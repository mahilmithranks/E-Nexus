import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Camera, AlertCircle, CheckCircle } from 'lucide-react';
import * as faceapi from 'face-api.js';
import { cn } from '../lib/utils';

// Global cache so models aren't re-loaded on every mount
let modelsLoaded = false;

export const loadModels = async () => {
    if (!modelsLoaded) {
        try {
            await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
            modelsLoaded = true;
        } catch (err) {
            console.error('Failed to pre-load models:', err);
        }
    }
};

// How long the face must be held continuously (ms)
const HOLD_DURATION_MS = 4000;

function CameraCapture({ onCapture, onCancel }) {
    const [stream, setStream] = useState(null);
    const [error, setError] = useState('');
    const [isModelLoading, setIsModelLoading] = useState(!modelsLoaded);
    const [isProcessing, setIsProcessing] = useState(false);
    const [captured, setCaptured] = useState(false);

    // For the live progress ring (0–1)
    const [holdProgress, setHoldProgress] = useState(0);
    // Whether a face is currently in frame
    const [faceDetected, setFaceDetected] = useState(false);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    // Refs used inside the detection loop (avoid stale closures)
    const holdStartRef = useRef(null);   // timestamp when current hold began
    const captureLockedRef = useRef(false); // prevent double-capture
    const animFrameRef = useRef(null);

    // ─── Load models + start camera ───────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            try {
                if (!modelsLoaded) {
                    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
                    modelsLoaded = true;
                }
                if (!cancelled) {
                    setIsModelLoading(false);
                    await startCamera();
                }
            } catch (err) {
                console.error('Initialization error:', err);
                if (!cancelled) {
                    setError('Failed to initialize face detection. Please refresh and try again.');
                    setIsModelLoading(false);
                }
            }
        };

        init();

        return () => {
            cancelled = true;
            stopCamera();
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
                audio: false
            });
            streamRef.current = mediaStream;
            setStream(mediaStream);
            if (videoRef.current) videoRef.current.srcObject = mediaStream;
        } catch (err) {
            console.error('Camera error:', err);
            setError('Unable to access camera. Please grant camera permissions and try again.');
        }
    };

    const stopCamera = () => {
        const s = streamRef.current;
        if (s) s.getTracks().forEach(t => t.stop());
    };

    // ─── Sustained face detection loop ────────────────────────────────────────
    useEffect(() => {
        if (!stream || isModelLoading || captured) return;

        const detectorOptions = new faceapi.TinyFaceDetectorOptions({
            inputSize: 224,
            scoreThreshold: 0.6
        });

        let videoReady = false;

        const loop = async () => {
            if (!videoRef.current || !videoReady || captureLockedRef.current) return;

            let detection = null;
            try {
                detection = await faceapi.detectSingleFace(videoRef.current, detectorOptions);
            } catch (_) {
                // Transient detection errors – just continue
            }

            const facePresent = detection && detection.score > 0.7;
            setFaceDetected(facePresent);

            if (facePresent) {
                // Start the hold clock on first detection
                if (!holdStartRef.current) holdStartRef.current = Date.now();

                const elapsed = Date.now() - holdStartRef.current;
                const progress = Math.min(elapsed / HOLD_DURATION_MS, 1);
                setHoldProgress(progress);

                if (elapsed >= HOLD_DURATION_MS && !captureLockedRef.current) {
                    captureLockedRef.current = true;
                    await doCapture(detection);
                    return; // Stop the loop after capture
                }
            } else {
                // Face lost – reset hold
                holdStartRef.current = null;
                setHoldProgress(0);
            }

            animFrameRef.current = requestAnimationFrame(loop);
        };

        if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
                videoReady = true;
                loop();
            };
            // In case metadata already loaded (e.g. hot-reload)
            if (videoRef.current.readyState >= 2) {
                videoReady = true;
                loop();
            }
        }

        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [stream, isModelLoading, captured]);

    // ─── Core capture + final verify ──────────────────────────────────────────
    const doCapture = useCallback(async (preDetection) => {
        setIsProcessing(true);
        setError('');

        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) { setIsProcessing(false); captureLockedRef.current = false; return; }

        try {
            // Final strict re-verification on the current frame
            const finalOptions = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.65 });
            const finalDetection = await faceapi.detectSingleFace(video, finalOptions);

            if (!finalDetection || finalDetection.score < 0.65) {
                setError('❌ Face not clearly visible. Keep your face steady in front of the camera and try again.');
                setIsProcessing(false);
                captureLockedRef.current = false;
                holdStartRef.current = null;
                setHoldProgress(0);
                setFaceDetected(false);
                // Restart detection loop
                animFrameRef.current = requestAnimationFrame(() => { });
                return;
            }

            // Draw frame to canvas
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Black-screen / covered-camera check
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;
            let totalBrightness = 0;
            for (let i = 0; i < pixels.length; i += 4) {
                totalBrightness += 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
            }
            const avgBrightness = totalBrightness / (pixels.length / 4);

            if (avgBrightness < 15) {
                setError('❌ Black screen detected. Your camera may be covered or the room is too dark.');
                setIsProcessing(false);
                captureLockedRef.current = false;
                holdStartRef.current = null;
                setHoldProgress(0);
                return;
            }

            // Everything looks good – export blob
            canvas.toBlob((blob) => {
                const file = new File([blob], `attendance-${Date.now()}.jpg`, { type: 'image/jpeg' });
                setCaptured(true);
                stopCamera();
                onCapture(file);
            }, 'image/jpeg', 0.85);

        } catch (err) {
            console.error('Capture error:', err);
            setError('Verification error. Please ensure camera is not covered and try again.');
            setIsProcessing(false);
            captureLockedRef.current = false;
            holdStartRef.current = null;
            setHoldProgress(0);
        }
    }, [onCapture]);

    // ─── Manual capture button (same strict path) ─────────────────────────────
    const handleManualCapture = async () => {
        if (isProcessing || captured) return;
        if (captureLockedRef.current) return;

        setError('');

        // Quick check: is a face present right now?
        const detectorOptions = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.65 });
        const detection = await faceapi.detectSingleFace(videoRef.current, detectorOptions);

        if (!detection || detection.score < 0.65) {
            setError('❌ No face detected. Position your face clearly in the frame before capturing.');
            return;
        }

        captureLockedRef.current = true;
        await doCapture(detection);
    };

    const handleCancel = () => {
        stopCamera();
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        onCancel();
    };

    // ─── SVG progress ring ────────────────────────────────────────────────────
    const RADIUS = 28;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
    const strokeDashoffset = CIRCUMFERENCE * (1 - holdProgress);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]/90 backdrop-blur-xl p-4"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="w-full max-w-xl bg-gradient-to-br from-[#111111] to-[#0d0d0d] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] relative"
            >
                {/* Decorative glow */}
                <div className="absolute -top-20 -left-20 size-64 bg-[#f05423]/10 blur-[100px] rounded-full pointer-events-none" />

                <div className="relative z-10">
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">Identity Authentication</h3>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Biometric Verification Stream</p>
                        </div>
                        <button
                            onClick={handleCancel}
                            className="size-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-red-500/10 hover:text-red-400 transition-all text-zinc-500"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-10">
                        {isModelLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-6">
                                <div className="size-12 border-2 border-[#f05423] border-t-transparent rounded-full animate-spin shadow-lg shadow-[#f05423]/20" />
                                <div className="text-center">
                                    <p className="text-white font-bold text-sm">Initializing Neural Engine</p>
                                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-2">Loading face-api weights...</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Camera viewport */}
                                <div className="relative aspect-video bg-black rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl">
                                    {/* Scan bar while processing */}
                                    {isProcessing && !captured && (
                                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#f05423] to-transparent animate-scan z-20" />
                                    )}

                                    {!captured ? (
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            className="w-full h-full object-cover transform scale-x-[-1]"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]/90 backdrop-blur-md z-30">
                                            <div className="text-center space-y-6">
                                                <div className="relative">
                                                    <div className="size-20 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                                        <CheckCircle className="w-10 h-10 animate-pulse" />
                                                    </div>
                                                    <div className="absolute inset-0 size-20 rounded-full border-2 border-emerald-500/30 animate-ping" />
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-emerald-400 font-black text-xs uppercase tracking-[0.3em]">Identity Verified</p>
                                                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Biometric Data Synchronized</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Processing overlay */}
                                    {isProcessing && !captured && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] z-20">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="relative">
                                                    <div className="size-14 border-4 border-[#f05423]/20 border-t-[#f05423] rounded-full animate-spin" />
                                                </div>
                                                <span className="text-white text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Verifying...</span>
                                            </div>
                                        </div>
                                    )}

                                    <canvas ref={canvasRef} className="hidden" />

                                    {/* Viewfinder corners */}
                                    <div className={cn(
                                        "absolute inset-0 pointer-events-none z-10 transition-opacity duration-300",
                                        faceDetected ? "opacity-80" : "opacity-30"
                                    )}>
                                        <div className={cn("absolute top-8 left-8 size-12 border-t-2 border-l-2 rounded-tl-xl transition-colors duration-300", faceDetected ? "border-emerald-400" : "border-white/40")} />
                                        <div className={cn("absolute top-8 right-8 size-12 border-t-2 border-r-2 rounded-tr-xl transition-colors duration-300", faceDetected ? "border-emerald-400" : "border-white/40")} />
                                        <div className={cn("absolute bottom-8 left-8 size-12 border-b-2 border-l-2 rounded-bl-xl transition-colors duration-300", faceDetected ? "border-emerald-400" : "border-white/40")} />
                                        <div className={cn("absolute bottom-8 right-8 size-12 border-b-2 border-r-2 rounded-br-xl transition-colors duration-300", faceDetected ? "border-emerald-400" : "border-white/40")} />
                                    </div>
                                </div>

                                {/* Status row: face indicator + progress ring */}
                                {!captured && (
                                    <div className="flex items-center justify-between px-2">
                                        {/* Face status pill */}
                                        <div className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                                            faceDetected
                                                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                                                : "bg-white/5 border border-white/10 text-zinc-500"
                                        )}>
                                            <div className={cn(
                                                "w-1.5 h-1.5 rounded-full transition-colors duration-300",
                                                faceDetected ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"
                                            )} />
                                            {faceDetected ? "Face Detected" : "No Face Detected"}
                                        </div>

                                        {/* Progress ring – only visible when holding */}
                                        <div className={cn(
                                            "relative transition-opacity duration-300",
                                            holdProgress > 0 ? "opacity-100" : "opacity-0"
                                        )}>
                                            <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
                                                {/* Track */}
                                                <circle
                                                    cx="36" cy="36" r={RADIUS}
                                                    fill="none"
                                                    stroke="rgba(255,255,255,0.06)"
                                                    strokeWidth="4"
                                                />
                                                {/* Progress */}
                                                <circle
                                                    cx="36" cy="36" r={RADIUS}
                                                    fill="none"
                                                    stroke={holdProgress >= 1 ? "#10b981" : "#f05423"}
                                                    strokeWidth="4"
                                                    strokeLinecap="round"
                                                    strokeDasharray={CIRCUMFERENCE}
                                                    strokeDashoffset={strokeDashoffset}
                                                    style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s ease' }}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className={cn(
                                                    "text-[10px] font-black",
                                                    holdProgress >= 1 ? "text-emerald-400" : "text-[#f05423]"
                                                )}>
                                                    {holdProgress >= 1 ? "✓" : `${Math.ceil(HOLD_DURATION_MS / 1000 - (holdProgress * HOLD_DURATION_MS / 1000))}s`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Instruction text */}
                                {!captured && !isProcessing && (
                                    <p className={cn(
                                        "text-center text-[10px] font-bold uppercase tracking-widest transition-colors duration-300",
                                        faceDetected ? "text-emerald-500" : "text-zinc-600"
                                    )}>
                                        {faceDetected
                                            ? `Hold still — verifying for ${Math.ceil(HOLD_DURATION_MS / 1000)} seconds`
                                            : "Position your face clearly in the camera frame"}
                                    </p>
                                )}

                                {/* Error */}
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-5 rounded-2xl flex items-start gap-4 text-xs font-medium animate-in fade-in slide-in-from-top-2">
                                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="font-black uppercase tracking-widest text-[10px]">Verification Failed</p>
                                            <p>{error}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Action buttons */}
                                <div className="flex flex-col sm:flex-row justify-center gap-4">
                                    <button
                                        onClick={handleCancel}
                                        className="flex-1 px-8 py-4 rounded-2xl border border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all font-black text-[10px] uppercase tracking-widest text-zinc-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleManualCapture}
                                        disabled={captured || isProcessing}
                                        className="flex-[2] px-10 py-4 rounded-2xl bg-gradient-to-r from-[#f05423] to-[#ff9d00] text-white shadow-xl shadow-[#f05423]/20 hover:shadow-[#f05423]/40 hover:scale-[1.02] active:scale-[0.98] transition-all font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed"
                                    >
                                        <Camera className="w-5 h-5" />
                                        {isProcessing ? 'Verifying...' : 'Capture Now'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default CameraCapture;
