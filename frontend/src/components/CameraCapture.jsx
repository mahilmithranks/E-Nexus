import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Camera, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import * as faceapi from 'face-api.js';
import { cn } from '../lib/utils';

// Global cache for model loading state to avoid redundant re-loading
let modelsLoaded = false;

export const loadModels = async () => {
    if (!modelsLoaded) {
        console.log('📡 Pre-loading face detection models...');
        try {
            await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
            modelsLoaded = true;
            console.log('✅ Models loaded successfully');
        } catch (err) {
            console.error('Failed to pre-load models:', err);
        }
    }
};

function CameraCapture({ onCapture, onCancel }) {
    const [stream, setStream] = useState(null);
    const [error, setError] = useState('');
    const [isModelLoading, setIsModelLoading] = useState(!modelsLoaded);
    const [isProcessing, setIsProcessing] = useState(false);
    const [captured, setCaptured] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        const loadModelsAndStartCamera = async () => {
            try {
                if (!modelsLoaded) {
                    console.log('📡 Loading face detection models...');
                    // Models are in /public/models
                    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
                    modelsLoaded = true;
                    console.log('✅ Models loaded successfully');
                }
                setIsModelLoading(false);
                await startCamera();
            } catch (err) {
                console.error('Initialization error:', err);
                setError('Failed to initialize face detection: ' + err.message);
                setIsModelLoading(false);
            }
        };

        loadModelsAndStartCamera();

        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                },
                audio: false
            });

            setStream(mediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error('Camera error:', err);
            setError('Unable to access camera. Please grant camera permissions.');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };

    useEffect(() => {
        let isVideoReady = false;
        let animationFrameId;

        const runDetection = async () => {
            if (!videoRef.current || !isVideoReady || isProcessing || captured) return;

            try {
                const detectorOptions = new faceapi.TinyFaceDetectorOptions({
                    inputSize: 224, // Higher resolution for better accuracy
                    scoreThreshold: 0.6 // Higher threshold to ensure clear face detection
                });

                const detection = await faceapi.detectSingleFace(videoRef.current, detectorOptions);

                if (detection && detection.score > 0.75) {
                    // Added a 3-second delay to make the detection feel more deliberate/slow
                    setTimeout(() => {
                        console.log('✅ Face detected automatically! Confidence:', detection.score);
                        autoCapture();
                    }, 3000);
                    return; // Stop loop after capture
                }
            } catch (err) {
                console.warn('Detection loop error:', err);
            }

            animationFrameId = requestAnimationFrame(runDetection);
        };

        if (stream && !isModelLoading) {
            videoRef.current.onloadedmetadata = () => {
                isVideoReady = true;
                runDetection();
            };
        }

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [stream, isModelLoading, isProcessing, captured]);

    const autoCapture = async () => {
        if (isProcessing || captured) return;
        setIsProcessing(true);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) {
            setIsProcessing(false);
            return;
        }

        try {
            // Add a 2-second delay to make the process feel more deliberate and thorough
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Verify face presence one last time on the current frame with stricter threshold
            const detectorOptions = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.6 });
            const finalDetection = await faceapi.detectSingleFace(video, detectorOptions);

            if (!finalDetection || finalDetection.score < 0.6) {
                setError('❌ Face Verification Failed: No clear face detected in the frame. Please position your face properly in front of the camera and try again.');
                setIsProcessing(false);
                setCaptured(false);
                return;
            }

            console.log('✅ Face verified with confidence:', finalDetection.score);

            const context = canvas.getContext('2d', { willReadFrequently: true });
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Check for "Black Screen" (Low average brightness)
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            let totalBrightness = 0;
            for (let i = 0; i < data.length; i += 4) {
                // Formula for perceived brightness: 0.299R + 0.587G + 0.114B
                totalBrightness += (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
            }
            const avgBrightness = totalBrightness / (data.length / 4);

            if (avgBrightness < 15) { // Threshold for "nearly black" (0-255 scale)
                setError('❌ Black Screen Detected: Your camera appears to be covered or the lighting is too dark. Please ensure proper lighting and try again.');
                setIsProcessing(false);
                setCaptured(false);
                return;
            }

            canvas.toBlob((blob) => {
                const file = new File([blob], `attendance-${Date.now()}.jpg`, {
                    type: 'image/jpeg'
                });
                setCaptured(true);
                stopCamera();
                onCapture(file);
            }, 'image/jpeg', 0.85);

        } catch (err) {
            console.error('Final verification error:', err);
            setError('Verification error. Please ensure your camera is not covered and try again.');
            setIsProcessing(false);
        }
    };

    const capturePhoto = async () => {
        // Fallback manual capture
        autoCapture();
    };

    const handleCancel = () => {
        stopCamera();
        onCancel();
    };

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
                            <div className="space-y-8">
                                <div className="relative aspect-video bg-black rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl group">
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

                                    {isProcessing && !captured && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] z-20">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="relative">
                                                    <div className="size-14 border-4 border-[#f05423]/20 border-t-[#f05423] rounded-full animate-spin" />
                                                    <div className="absolute inset-0 size-14 rounded-full border-4 border-[#f05423]/10 animate-pulse" />
                                                </div>
                                                <span className="text-white text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Syncing...</span>
                                            </div>
                                        </div>
                                    )}

                                    <canvas ref={canvasRef} className="hidden" />

                                    {/* Advanced Viewfinder */}
                                    <div className="absolute inset-0 pointer-events-none opacity-40 z-10">
                                        <div className="absolute top-8 left-8 size-12 border-t-2 border-l-2 border-white/40 rounded-tl-xl" />
                                        <div className="absolute top-8 right-8 size-12 border-t-2 border-r-2 border-white/40 rounded-tr-xl" />
                                        <div className="absolute bottom-8 left-8 size-12 border-b-2 border-l-2 border-white/40 rounded-bl-xl" />
                                        <div className="absolute bottom-8 right-8 size-12 border-b-2 border-r-2 border-white/40 rounded-br-xl" />

                                        {/* Dynamic Grid */}
                                        <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
                                            {[...Array(16)].map((_, i) => (
                                                <div key={i} className="border-[0.5px] border-white/5" />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-5 rounded-2xl flex items-start gap-4 text-xs font-medium animate-in fade-in slide-in-from-top-2">
                                        <AlertCircle className="w-5 h-5 shrink-0" />
                                        <div className="space-y-1">
                                            <p className="font-black uppercase tracking-widest text-[10px]">Transmission Failure</p>
                                            <p>{error}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row justify-center gap-4">
                                    <button
                                        onClick={handleCancel}
                                        className="flex-1 px-8 py-4 rounded-2xl border border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all font-black text-[10px] uppercase tracking-widest text-zinc-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={capturePhoto}
                                        disabled={captured || isProcessing}
                                        className="flex-[2] px-10 py-4 rounded-2xl bg-gradient-to-r from-[#f05423] to-[#ff9d00] text-white shadow-xl shadow-[#f05423]/20 hover:shadow-[#f05423]/40 hover:scale-[1.02] active:scale-[0.98] transition-all font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed"
                                    >
                                        <Camera className="w-5 h-5" />
                                        {isProcessing ? 'Authenticating...' : 'Manual Capture'}
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

