import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Camera, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import './CameraCapture.css'; // We'll empty this file next

function CameraCapture({ onCapture, onCancel }) {
    const [stream, setStream] = useState(null);
    const [error, setError] = useState('');
    const [captured, setCaptured] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
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

    const capturePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video && canvas) {
            const context = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                const file = new File([blob], `attendance-${Date.now()}.jpg`, {
                    type: 'image/jpeg'
                });
                onCapture(file);
                setCaptured(true);
                stopCamera();
            }, 'image/jpeg', 0.9);
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
                    {error ? (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center text-sm">
                            {error}
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
                                            <p className="text-green-400 font-medium">Processing...</p>
                                        </div>
                                    </div>
                                )}
                                <canvas ref={canvasRef} className="hidden" />

                                {/* Overlay Rulers/Frame for professional look */}
                                <div className="absolute inset-4 border-2 border-dashed border-white/20 rounded-lg pointer-events-none" />
                                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white/40 rounded-tl pointer-events-none" />
                                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white/40 rounded-tr pointer-events-none" />
                                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-white/40 rounded-bl pointer-events-none" />
                                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white/40 rounded-br pointer-events-none" />
                            </div>

                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={handleCancel}
                                    className="px-6 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 text-white/70 hover:text-white transition-all font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={capturePhoto}
                                    disabled={captured}
                                    className="px-8 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Camera className="w-5 h-5" />
                                    Take Photo
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
