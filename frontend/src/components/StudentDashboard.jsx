import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, LogOut, FileText, Link as LinkIcon, Upload, Calendar, Clock, ChevronRight, CheckCircle, AlertCircle, Lock, X } from 'lucide-react';
import api from '../services/api';
import { getUser, clearAuth } from '../utils/auth';
import CameraCapture from './CameraCapture';
import Timer from './Timer';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';
import * as faceapi from 'face-api.js';

function StudentDashboard() {
    const [days, setDays] = useState([]);
    const [selectedDay, setSelectedDay] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCamera, setShowCamera] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [capturedPhoto, setCapturedPhoto] = useState(null);
    const [assignmentData, setAssignmentData] = useState({});
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [detectingFace, setDetectingFace] = useState(false);
    const [showPhotoConfirmation, setShowPhotoConfirmation] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [faceDetected, setFaceDetected] = useState(null);

    const user = getUser();
    const navigate = useNavigate();

    useEffect(() => {
        fetchDays();
        loadFaceDetectionModels();
    }, []);

    // Auto-refresh sessions every 30 seconds to update attendance status
    useEffect(() => {
        if (!selectedDay) return;

        const interval = setInterval(() => {
            selectDay(selectedDay);
        }, 30000); // Refresh every 30 seconds

        return () => clearInterval(interval);
    }, [selectedDay]);

    // Load face detection models
    const loadFaceDetectionModels = async () => {
        try {
            await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
            setModelsLoaded(true);
            console.log('✅ Face detection models loaded');
        } catch (error) {
            console.error('❌ Error loading face detection models:', error);
            toast.error('Face detection unavailable. Manual confirmation will be used.');
        }
    };

    const fetchDays = async () => {
        try {
            const response = await api.get('/student/days');
            setDays(response.data);
            // Select the first OPEN day by default
            const openDay = response.data.find(d => d.status === 'OPEN');
            if (openDay) {
                selectDay(openDay._id);
            }
        } catch (error) {
            console.error('Error fetching days:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectDay = async (dayId) => {
        // Find the day to check status
        const day = days.find(d => d._id === dayId);
        if (day && day.status !== 'OPEN') {
            return; // Do nothing if locked/closed
        }

        try {
            setSelectedDay(dayId);
            const response = await api.get(`/student/sessions/${dayId}`);
            setSessions(response.data);
        } catch (error) {
            console.error('Error fetching sessions:', error);
        }
    };

    const handleLogout = () => {
        clearAuth();
        navigate('/');
    };

    const openCamera = (session) => {
        setSelectedSession(session);
        setShowCamera(true);
    };

    // Detect face in captured photo
    const detectFace = async (photoFile) => {
        try {
            // Convert file to image
            const img = await faceapi.bufferToImage(photoFile);

            // Detect faces
            const detections = await faceapi.detectAllFaces(
                img,
                new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
            );

            return detections.length > 0;
        } catch (error) {
            console.error('Face detection error:', error);
            return null; // null means detection failed, not that no face was found
        }
    };

    const handlePhotoCapture = async (photoFile) => {
        setCapturedPhoto(photoFile);
        setShowCamera(false);

        // Create preview URL
        const previewUrl = URL.createObjectURL(photoFile);
        setPhotoPreview(previewUrl);

        // Try face detection if models are loaded
        if (modelsLoaded) {
            setDetectingFace(true);
            toast.loading('Analyzing photo...', { id: 'face-detection' });

            const hasFace = await detectFace(photoFile);
            setDetectingFace(false);
            toast.dismiss('face-detection');

            if (hasFace === true) {
                // Face detected! Submit immediately
                setFaceDetected(true);
                toast.success('Face detected! Submitting attendance...');
                await submitAttendance(photoFile);
            } else if (hasFace === false) {
                // No face detected - show manual confirmation
                setFaceDetected(false);
                setShowPhotoConfirmation(true);
                toast.error('No face detected in photo. Please confirm or retake.');
            } else {
                // Detection failed - show manual confirmation
                setFaceDetected(null);
                setShowPhotoConfirmation(true);
                toast('Face detection uncertain. Please confirm your photo.');
            }
        } else {
            // Models not loaded - show manual confirmation
            setFaceDetected(null);
            setShowPhotoConfirmation(true);
        }
    };

    const submitAttendance = async (photoFile) => {
        try {
            const formData = new FormData();
            formData.append('sessionId', selectedSession._id);
            formData.append('photo', photoFile);

            await api.post('/student/attendance', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Attendance marked successfully!');
            setShowPhotoConfirmation(false);
            setPhotoPreview(null);
            setCapturedPhoto(null);
            selectDay(selectedDay);
        } catch (error) {
            toast.error('Error marking attendance: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleConfirmPhoto = async () => {
        if (capturedPhoto) {
            await submitAttendance(capturedPhoto);
        }
    };

    const handleRetakePhoto = () => {
        setShowPhotoConfirmation(false);
        setPhotoPreview(null);
        setCapturedPhoto(null);
        setFaceDetected(null);
        setShowCamera(true);
    };

    const handleAssignmentSubmit = async (session, assignment) => {
        const key = `${session._id}-${assignment.title}`;
        const data = assignmentData[key];

        if (!data) {
            toast.error('Please provide a response');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('sessionId', session._id);
            formData.append('assignmentTitle', assignment.title);
            formData.append('assignmentType', assignment.type);

            if (assignment.type === 'file' && data instanceof File) {
                formData.append('assignment', data);
                formData.append('response', 'file');
            } else {
                formData.append('response', data);
            }

            await api.post('/student/assignment', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Assignment submitted successfully!');
            setAssignmentData({ ...assignmentData, [key]: '' });
            selectDay(selectedDay);
        } catch (error) {
            toast.error('Error submitting assignment: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleAssignmentChange = (sessionId, assignmentTitle, value) => {
        const key = `${sessionId}-${assignmentTitle}`;
        setAssignmentData({ ...assignmentData, [key]: value });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-black relative overflow-hidden flex flex-col selection:bg-purple-500/30 selection:text-purple-200">
            {/* Background Effects (Matching SignInCard) */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-soft-light"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/10 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />

            <button
                onClick={handleLogout}
                className="absolute top-6 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-lg bg-black/20 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-105 transition-all text-sm font-medium text-white/70 hover:text-white backdrop-blur-md"
            >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
            </button>

            {/* Large Welcome Hero */}
            <div className="relative z-10 max-w-7xl mx-auto w-full px-4 md:px-6 pt-12 md:pt-16 pb-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-medium backdrop-blur-md">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        Online &bull; {user.yearOfStudy} Year &bull; {user.department}
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight">
                        Welcome to the Workshop,<br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 animate-gradient-x bg-[length:200%_auto]">
                            {user.name}
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-white/40 max-w-2xl leading-relaxed">
                        Year: {user.yearOfStudy}
                    </p>
                </motion.div>
            </div>

            {/* Disclaimer Section */}
            <div className="relative z-10 max-w-7xl mx-auto w-full px-4 md:px-6 mt-6">
                <div className="p-4 rounded-xl bg-purple-900/10 border border-purple-500/20 backdrop-blur-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="flex gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 h-fit">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-semibold text-purple-100">Important Rules & Guidelines</h3>
                            <div className="text-sm text-purple-200/60 space-y-1">
                                <p>• Attendance must be marked strictly within the 10-minute active window.</p>
                                <p>• <span className="text-purple-200 font-medium">Credits are awarded only upon successful completion of assessments.</span></p>
                                <p>• For issues with attendance limits or missed sessions, please contact the administrator immediately.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex-1 flex overflow-hidden pt-6">
                {days.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-white/40">
                        <Calendar className="w-12 h-12 mb-4 opacity-50" />
                        <p>No scheduled workshops yet.</p>
                    </div>
                ) : (
                    <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 flex flex-col md:flex-row gap-6 overflow-hidden">

                        {/* Sidebar (Days) */}
                        <div className="w-full md:w-64 flex-shrink-0 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto pb-2 md:pb-0 scrollbar-hide">
                            {days.map(day => {
                                const isLocked = day.status !== 'OPEN';
                                const isActive = selectedDay === day._id;

                                return (
                                    <button
                                        key={day._id}
                                        onClick={() => selectDay(day._id)}
                                        disabled={isLocked}
                                        className={cn(
                                            "flex-shrink-0 w-32 md:w-full p-4 rounded-xl text-left transition-all border group relative overflow-hidden",
                                            isActive
                                                ? "bg-purple-500/10 border-purple-500/50 shadow-[0_0_15px_-3px_rgba(168,85,247,0.2)]"
                                                : isLocked
                                                    ? "bg-white/[0.02] border-white/5 opacity-50 cursor-not-allowed"
                                                    : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                                        )}
                                    >
                                        <div className="relative z-10 flex justify-between items-start">
                                            <div className="flex-1 min-w-0 mr-2">
                                                <div className={cn(
                                                    "text-xs font-semibold mb-1 uppercase tracking-wider",
                                                    isActive ? "text-purple-400" : "text-white/40 group-hover:text-white/60"
                                                )}>
                                                    Day {day.dayNumber}
                                                </div>
                                                <div className={cn(
                                                    "text-sm font-medium truncate",
                                                    isActive ? "text-white" : "text-white/70"
                                                )}>
                                                    {day.title}
                                                </div>
                                            </div>
                                            {isLocked && <Lock className="w-4 h-4 text-white/20 mt-1" />}
                                        </div>
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeDay"
                                                className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Sessions Content */}
                        <div className="flex-1 overflow-y-auto scrollbar-hide pb-20">
                            <h2 className="text-lg font-semibold text-white/90 mb-4 sticky top-0 z-10 py-4 backdrop-blur-md">
                                Current Schedule
                            </h2>

                            <div className="space-y-4">
                                {sessions.length === 0 ? (
                                    <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
                                        <p className="text-white/40">No sessions scheduled for this day.</p>
                                    </div>
                                ) : (
                                    sessions.map((session, idx) => (
                                        <motion.div
                                            key={session._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="relative group bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all"
                                        >
                                            {/* Glow on Hover */}
                                            <div className="absolute -inset-px bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                            <div className="p-6 relative z-10">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="text-xl font-medium text-white/90">{session.title}</h3>
                                                        {session.description && (
                                                            <p className="text-white/50 text-sm mt-1">{session.description}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        {session.hasAttendance && (
                                                            <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium flex items-center gap-1.5 shadow-[0_0_10px_-4px_rgba(34,197,94,0.3)]">
                                                                <CheckCircle className="w-3 h-3" />
                                                                Present
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Attendance Action */}
                                                {!session.hasAttendance && (
                                                    <div className="mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                                        {session.isAttendanceActive ? (
                                                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                                                <div className="flex items-center gap-2 text-purple-300 text-sm">
                                                                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                                                                    Attendance is live!
                                                                </div>

                                                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                                                    {session.attendanceEndTime && (
                                                                        <div className="text-xs text-white/40 font-mono bg-black/20 px-2 py-1 rounded">
                                                                            Closing in: <Timer targetDate={session.attendanceEndTime} />
                                                                        </div>
                                                                    )}
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.02 }}
                                                                        whileTap={{ scale: 0.98 }}
                                                                        onClick={() => openCamera(session)}
                                                                        className="flex-1 sm:flex-none px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 font-medium text-white shadow-lg shadow-purple-900/20 text-sm flex items-center justify-center gap-2"
                                                                    >
                                                                        <Camera className="w-4 h-4" />
                                                                        Mark Attendance
                                                                    </motion.button>
                                                                </div>
                                                            </div>
                                                        ) : session.attendanceStatus === 'closed' ? (
                                                            // Attendance window closed - student is absent
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2 text-red-400 text-sm">
                                                                    <AlertCircle className="w-4 h-4" />
                                                                    <span>Attendance Closed - Marked Absent</span>
                                                                </div>
                                                                <div className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                                                                    Absent
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            // Attendance not started yet
                                                            <div className="flex items-center gap-2 text-white/30 text-sm">
                                                                <Lock className="w-4 h-4" />
                                                                Attendance not started yet
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Assignments */}
                                                {session.assignments && session.assignments.length > 0 && (
                                                    <div className="space-y-3 mt-4 pt-4 border-t border-white/5">
                                                        <div className="flex items-center gap-2 text-sm text-white/50 mb-2">
                                                            <FileText className="w-4 h-4" />
                                                            <span>Assignments & Assessment</span>
                                                        </div>

                                                        {!session.hasAttendance ? (
                                                            <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/10 text-yellow-500/70 text-sm flex items-center gap-2">
                                                                <AlertCircle className="w-4 h-4" />
                                                                Mark attendance to unlock assessment
                                                            </div>
                                                        ) : (
                                                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                                                                <div>
                                                                    {session.assignmentsSubmitted === session.totalAssignments ? (
                                                                        <>
                                                                            <div className="text-green-400 font-medium mb-1 flex items-center gap-2">
                                                                                <CheckCircle className="w-5 h-5" />
                                                                                Assessment Done
                                                                            </div>
                                                                            <div className="text-white/40 text-sm">
                                                                                All {session.totalAssignments} tasks completed
                                                                            </div>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <div className="text-white font-medium mb-1">
                                                                                Assessment Pending
                                                                            </div>
                                                                            <div className="text-white/40 text-sm">
                                                                                {session.assignmentsSubmitted} / {session.totalAssignments} Task{session.totalAssignments !== 1 ? 's' : ''} completed
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                {session.assignmentsSubmitted === session.totalAssignments ? (
                                                                    <button
                                                                        disabled
                                                                        className="px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 font-medium text-sm flex items-center gap-2 cursor-default"
                                                                    >
                                                                        <CheckCircle className="w-4 h-4" />
                                                                        Completed
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => navigate(`/student/assessment/${session._id}`)}
                                                                        className="px-4 py-2 rounded-lg bg-white text-black font-medium text-sm hover:bg-gray-200 transition-colors flex items-center gap-2"
                                                                    >
                                                                        Start Assessment
                                                                        <ChevronRight className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Camera Modal */}
            <AnimatePresence>
                {showCamera && (
                    <CameraCapture
                        onCapture={handlePhotoCapture}
                        onCancel={() => setShowCamera(false)}
                    />
                )}
            </AnimatePresence>

            {/* Photo Confirmation Modal */}
            <AnimatePresence>
                {showPhotoConfirmation && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => { }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative max-w-2xl w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-white/10">
                                <h3 className="text-2xl font-bold text-white mb-2">
                                    Confirm Attendance Photo
                                </h3>
                                {faceDetected === true && (
                                    <div className="flex items-center gap-2 text-green-400">
                                        <CheckCircle className="w-5 h-5" />
                                        <span>Face detected successfully!</span>
                                    </div>
                                )}
                                {faceDetected === false && (
                                    <div className="flex items-center gap-2 text-yellow-400">
                                        <AlertCircle className="w-5 h-5" />
                                        <span>No face detected. Please confirm your face is visible.</span>
                                    </div>
                                )}
                                {faceDetected === null && (
                                    <div className="flex items-center gap-2 text-blue-400">
                                        <AlertCircle className="w-5 h-5" />
                                        <span>Please confirm your face is clearly visible in the photo.</span>
                                    </div>
                                )}
                            </div>

                            {/* Photo Preview */}
                            <div className="p-6 flex items-center justify-center bg-black/20">
                                {photoPreview && (
                                    <img
                                        src={photoPreview}
                                        alt="Attendance photo preview"
                                        className="max-w-full max-h-[50vh] rounded-lg border-2 border-white/10"
                                    />
                                )}
                            </div>

                            {/* Actions */}
                            <div className="p-6 border-t border-white/10 flex gap-4">
                                <button
                                    onClick={handleRetakePhoto}
                                    className={cn(
                                        "px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2",
                                        faceDetected === false ? "w-full" : "flex-1"
                                    )}
                                >
                                    <Camera className="w-5 h-5" />
                                    Retake Photo
                                </button>
                                {faceDetected !== false && (
                                    <button
                                        onClick={handleConfirmPhoto}
                                        className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:from-blue-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                        Confirm & Submit
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}

export default StudentDashboard;
