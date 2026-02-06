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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-lg bg-black/40 border border-white/10 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl"
            >
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h3 className="text-lg font-semibold text-white">Capture Attendance</h3>
                    <button
                        onClick={handleCancel}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {isModelLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-white/60 text-sm">Initializing AI Face Detector...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="relative aspect-video bg-black/50 rounded-xl overflow-hidden border border-white/10 shadow-inner">
                                {!captured ? (
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                        <div className="text-center">
                                            <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto mb-3 border border-green-500/30">
                                                <RefreshCw className="w-8 h-8 animate-spin" />
                                            </div>
                                            <p className="text-green-400 font-medium">Submitting...</p>
                                        </div>
                                    </div>
                                )}

                                {isProcessing && !captured && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span className="text-white text-xs font-medium">Checking face...</span>
                                        </div>
                                    </div>
                                )}

                                <canvas ref={canvasRef} className="hidden" />

                                {/* Overlay Rulers/Frame for professional look */}
                                <div className="absolute inset-x-0 top-[20%] bottom-[20%] border-y border-white/10 pointer-events-none" />
                                <div className="absolute inset-y-0 left-[25%] right-[25%] border-x border-white/10 pointer-events-none" />
                                <div className="absolute inset-4 border-2 border-dashed border-white/10 rounded-lg pointer-events-none" />
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-1">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={handleCancel}
                                    className="px-6 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 text-white/70 hover:text-white transition-all font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={capturePhoto}
                                    disabled={captured || isProcessing}
                                    className="px-8 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Camera className="w-5 h-5" />
                                    {isProcessing ? 'Processing...' : 'Take Photo'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

export default CameraCapture;

