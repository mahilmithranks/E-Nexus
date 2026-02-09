import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Camera, RefreshCw, AlertCircle } from 'lucide-react';
import * as faceapi from 'face-api.js';
import { cn } from '../lib/utils';

// Global cache for model loading state to avoid redundant re-loading
let modelsLoaded = false;

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

    const capturePhoto = async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas || isProcessing) return;

        // Ensure video is playing and has frames
        if (video.readyState < 2) {
            setError('Camera is still warming up. Please wait...');
            return;
        }

        setIsProcessing(true);
        setError('');

        try {
            // Options: Large inputSize (224) is generally more accurate than 128/160
            const detectorOptions = new faceapi.TinyFaceDetectorOptions({
                inputSize: 224,
                scoreThreshold: 0.25 // More permissive
            });

            // Try to detect face with a small retry logic (3 attempts over 1.5s)
            // This handles cases where the first frame might be blurry or eyes are closed
            let detection = null;
            for (let i = 0; i < 3; i++) {
                detection = await faceapi.detectSingleFace(video, detectorOptions);
                if (detection) break;
                // Wait 300ms before next attempt
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            if (!detection) {
                console.warn('Face detection failed after 3 attempts');
                setError('Face not detected. Please ensure you are in a well-lit area and face the camera directly.');
                setIsProcessing(false);
                return;
            }

            console.log('✅ Face detected! Confidence:', detection.score.toFixed(2));

            // Capture the image
            const context = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Mirror back for the actual file if desired, or keep as is. 
            // Most systems prefer a natural (non-mirrored) view for records.
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                const file = new File([blob], `attendance-${Date.now()}.jpg`, {
                    type: 'image/jpeg'
                });
                setCaptured(true);
                stopCamera();
                onCapture(file);
            }, 'image/jpeg', 0.85);
        } catch (err) {
            console.error('Face detection error:', err);
            setError('Face analysis error. Please try again or refresh the page.');
            setIsProcessing(false);
        }
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
                                    {!captured ? (
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            className="w-full h-full object-cover transform scale-x-[-1]"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]/80 backdrop-blur-md">
                                            <div className="text-center space-y-4">
                                                <div className="size-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                                                    <RefreshCw className="w-8 h-8 animate-spin" />
                                                </div>
                                                <div>
                                                    <p className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.2em]">Authenticating</p>
                                                    <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mt-1">Updating Records...</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {isProcessing && !captured && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="size-10 border-2 border-white/10 border-t-[#f05423] rounded-full animate-spin" />
                                                <span className="text-white text-[10px] font-black uppercase tracking-widest">Scanning Bio-Markers</span>
                                            </div>
                                        </div>
                                    )}

                                    <canvas ref={canvasRef} className="hidden" />

                                    {/* Advanced Viewfinder */}
                                    <div className="absolute inset-0 pointer-events-none opacity-40">
                                        <div className="absolute top-8 left-8 size-12 border-t-2 border-l-2 border-white/20 rounded-tl-xl" />
                                        <div className="absolute top-8 right-8 size-12 border-t-2 border-r-2 border-white/20 rounded-tr-xl" />
                                        <div className="absolute bottom-8 left-8 size-12 border-b-2 border-l-2 border-white/20 rounded-bl-xl" />
                                        <div className="absolute bottom-8 right-8 size-12 border-b-2 border-r-2 border-white/20 rounded-br-xl" />

                                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-white/5" />
                                        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-white/5" />
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
                                        className="flex-1 px-8 py-4 rounded-2xl border border-white/10 hover:bg-white/5 text-zinc-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest"
                                    >
                                        Abandon
                                    </button>
                                    <button
                                        onClick={capturePhoto}
                                        disabled={captured || isProcessing}
                                        className="flex-[2] px-10 py-4 rounded-2xl bg-gradient-to-r from-[#f05423] to-[#ff9d00] text-white shadow-xl shadow-[#f05423]/20 hover:shadow-[#f05423]/40 hover:scale-[1.02] active:scale-[0.98] transition-all font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed"
                                    >
                                        <Camera className="w-5 h-5" />
                                        {isProcessing ? 'Processing' : 'Commit Authentication'}
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

