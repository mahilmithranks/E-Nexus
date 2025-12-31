import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Calendar, Clock, BarChart2, Download, LogOut,
    CheckCircle, AlertCircle, XCircle, Lock, Unlock, Play, Square,
    FileText
} from 'lucide-react';
import api from '../services/api';
import { getUser, clearAuth } from '../utils/auth';
import Timer from './Timer';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';
// import './AdminDashboard.css'; // Removed in favor of Tailwind

// Admin Dashboard Component
function AdminDashboard() {
    const [days, setDays] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [progress, setProgress] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('days');
    const [showOverrideForm, setShowOverrideForm] = useState(false);
    const [showPhotoModal, setShowPhotoModal] = useState({ show: false, url: '', student: '' });
    const [showOverrideModal, setShowOverrideModal] = useState({
        show: false,
        student: null,
        sessionId: null,
        comment: ''
    });

    const user = getUser();
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    // Auto-close polling: Check every 30s for expired sessions
    useEffect(() => {
        const checkAndCloseExpiredSessions = async () => {
            try {
                const now = new Date();
                const expiredSessions = sessions.filter(session =>
                    session.attendanceOpen &&
                    session.attendanceEndTime &&
                    new Date(session.attendanceEndTime) < now
                );

                for (const session of expiredSessions) {
                    await api.post(`/admin/sessions/${session._id}/attendance/stop`);
                    toast.info(`Auto-closed attendance for: ${session.title}`);
                }

                if (expiredSessions.length > 0) {
                    fetchData(); // Refresh data after auto-close
                }
            } catch (error) {
                console.error('Auto-close error:', error);
            }
        };

        // Run check every 30 seconds
        const interval = setInterval(checkAndCloseExpiredSessions, 30000);

        // Cleanup on unmount
        return () => clearInterval(interval);
    }, [sessions]); // Re-run when sessions change

    const fetchData = async () => {
        try {
            const [daysRes, sessionsRes, progressRes] = await Promise.all([
                api.get('/admin/days'),
                api.get('/admin/sessions'),
                api.get('/admin/progress')
            ]);

            setDays(daysRes.data);
            setSessions(sessionsRes.data);
            setProgress(progressRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        clearAuth();
        navigate('/');
    };

    const updateDayStatus = async (dayId, status) => {
        try {
            await api.put(`/admin/days/${dayId}/status`, { status });
            fetchData();
        } catch (error) {
            toast.error('Error updating day status: ' + (error.response?.data?.message || error.message));
        }
    };

    const startAttendance = async (sessionId) => {
        try {
            const response = await api.post(`/admin/sessions/${sessionId}/attendance/start`);
            toast.success(`Attendance started! Window closes at ${new Date(response.data.windowEndsAt).toLocaleTimeString()}`);
            fetchData();
        } catch (error) {
            toast.error('Error starting attendance: ' + (error.response?.data?.message || error.message));
        }
    };

    const stopAttendance = async (sessionId) => {
        try {
            await api.post(`/admin/sessions/${sessionId}/attendance/stop`);
            toast.success('Attendance stopped successfully');
            fetchData();
        } catch (error) {
            toast.error('Error stopping attendance: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleOverrideSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/attendance/override', {
                registerNumber: showOverrideModal.student.registerNumber,
                sessionId: showOverrideModal.sessionId,
                comment: showOverrideModal.comment
            });
            toast.success(`Attendance override successful for ${showOverrideModal.student.name}`);
            setShowOverrideModal({ show: false, student: null, sessionId: null, comment: '' });
            fetchData();
        } catch (error) {
            toast.error('Error overriding attendance: ' + (error.response?.data?.message || error.message));
        }
    };

    const openOverrideModal = (student, sessionId) => {
        setShowOverrideModal({
            show: true,
            student: student,
            sessionId: sessionId,
            comment: ''
        });
    };

    const exportAttendance = async () => {
        try {
            const response = await api.get('/admin/export/attendance', { responseType: 'blob' });
            // Explicitly set the MIME type for Excel
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export error:', error);
            let errorMessage = 'Error exporting attendance';
            if (error.response?.data instanceof Blob) {
                // Parse blob error to text
                const text = await error.response.data.text();
                try {
                    const json = JSON.parse(text);
                    errorMessage = json.message || errorMessage;
                } catch (e) {
                    errorMessage = text || errorMessage;
                }
            } else {
                errorMessage = error.response?.data?.message || error.message;
            }
            toast.error(errorMessage);
        }
    };

    const exportAssignments = async () => {
        try {
            const response = await api.get('/admin/export/assignments', { responseType: 'blob' });
            // Explicitly set the MIME type for Excel
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `assignment_report_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export error:', error);
            let errorMessage = 'Error exporting assignments';
            if (error.response?.data instanceof Blob) {
                // Parse blob error to text
                const text = await error.response.data.text();
                try {
                    const json = JSON.parse(text);
                    errorMessage = json.message || errorMessage;
                } catch (e) {
                    errorMessage = text || errorMessage;
                }
            } else {
                errorMessage = error.response?.data?.message || error.message;
            }
            toast.error(errorMessage);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const tabs = [
        { id: 'days', label: 'Day Control', icon: Calendar },
        { id: 'sessions', label: 'Sessions', icon: Clock },
        { id: 'attendance', label: 'Attendance', icon: Users },
        { id: 'assignments', label: 'Assignments', icon: FileText },
        { id: 'export', label: 'Exports', icon: Download },
    ];

    // Helper function to get the correct photo URL
    const getPhotoUrl = (photoPath) => {
        if (!photoPath) return null;

        // If it's already a full URL (Cloudinary), return as is
        if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
            return photoPath;
        }

        // If it's a local path, construct the backend URL
        // Remove leading slash if present
        const cleanPath = photoPath.startsWith('/') ? photoPath.substring(1) : photoPath;
        return `http://localhost:5000/${cleanPath}`;
    };

    return (
        <div className="min-h-screen w-full bg-black relative overflow-hidden flex flex-col selection:bg-blue-500/30 selection:text-blue-200">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-black to-black pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-soft-light"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-600/10 blur-[100px] pointer-events-none" />

            {/* Floating Logout */}
            <button
                onClick={handleLogout}
                className="absolute top-6 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-lg bg-black/20 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-105 transition-all text-sm font-medium text-white/70 hover:text-white backdrop-blur-md"
            >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
            </button>

            {/* Hero Section */}
            <div className="relative z-10 max-w-7xl mx-auto w-full px-4 md:px-6 pt-12 md:pt-16 pb-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-medium backdrop-blur-md">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        Administrator Console
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight">
                        Welcome back,<br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 animate-gradient-x bg-[length:200%_auto]">
                            {user.name}
                        </span>
                    </h1>
                </motion.div>
            </div>

            {/* Navigation Tabs */}
            <div className="relative z-10 max-w-7xl mx-auto w-full px-4 md:px-6 mb-8">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                                activeTab === tab.id
                                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                                    : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 pb-20">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="w-full"
                    >
                        {activeTab === 'days' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {days.map(day => (
                                    <div key={day._id} className={cn(
                                        "group relative overflow-hidden p-6 rounded-2xl border backdrop-blur-xl transition-all",
                                        day.status === 'OPEN'
                                            ? "bg-blue-500/10 border-blue-500/30 shadow-[0_0_30px_-10px_rgba(59,130,246,0.2)]"
                                            : "bg-white/[0.03] border-white/5 hover:border-white/10"
                                    )}>
                                        {/* Glow on Hover */}
                                        <div className="absolute -inset-px bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-xl font-bold text-white">Day {day.dayNumber}</h3>
                                                    <p className="text-white/60 text-sm">{day.title}</p>
                                                </div>
                                                <span className={cn(
                                                    "px-2 py-1 rounded-md text-xs font-bold uppercase",
                                                    day.status === 'OPEN' ? "bg-green-500/20 text-green-400" :
                                                        day.status === 'LOCKED' ? "bg-red-500/20 text-red-400" :
                                                            "bg-gray-500/20 text-gray-400"
                                                )}>
                                                    {day.status}
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => updateDayStatus(day._id, 'OPEN')}
                                                    disabled={day.status === 'OPEN'}
                                                    className="flex-1 px-3 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-sm font-medium border border-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    Open
                                                </button>
                                                <button
                                                    onClick={() => updateDayStatus(day._id, 'CLOSED')}
                                                    disabled={day.status === 'CLOSED'}
                                                    className="flex-1 px-3 py-2 rounded-lg bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 text-sm font-medium border border-gray-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    Close
                                                </button>
                                                <button
                                                    onClick={() => updateDayStatus(day._id, 'LOCKED')}
                                                    disabled={day.status === 'LOCKED'}
                                                    className="flex-1 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium border border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    Lock
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'sessions' && (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    {sessions.map(session => (
                                        <div key={session._id} className="group relative overflow-hidden p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all">
                                            {/* Glow on Hover */}
                                            <div className="absolute -inset-px bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                            <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-xl font-bold text-white">{session.title}</h3>
                                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-white/10 text-white/60 border border-white/5">
                                                            Day {session.dayId?.dayNumber}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {session.attendanceOpen ? (
                                                            <span className="flex items-center gap-2 text-green-400 text-sm font-medium">
                                                                <span className="relative flex h-2 w-2">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                                </span>
                                                                Attendance Open
                                                                {session.attendanceEndTime && <Timer targetDate={session.attendanceEndTime} />}
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-2 text-red-400 text-sm font-medium">
                                                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                                                Attendance Closed
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => startAttendance(session._id)}
                                                        disabled={session.attendanceOpen || session.dayId?.status !== 'OPEN'}
                                                        className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                                    >
                                                        <Play className="w-4 h-4" /> Start
                                                    </button>
                                                    <button
                                                        onClick={() => stopAttendance(session._id)}
                                                        disabled={!session.attendanceOpen}
                                                        className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                                    >
                                                        <Square className="w-4 h-4" /> Stop
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Manual Override Toggle */}

                            </div>
                        )}

                        {/* Attendance Tracking Tab */}
                        {activeTab === 'attendance' && (
                            <>
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-white mb-2">Attendance Tracking</h2>
                                    <p className="text-white/60">View all student attendance records. Click on green checkmarks to view attendance photos.</p>
                                </div>

                                <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.02]">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-white/5 border-b border-white/10">
                                                    <th className="p-4 text-xs font-semibold text-white/60 uppercase tracking-wider sticky left-0 bg-white/5">Student</th>
                                                    {sessions.map(s => (
                                                        <th key={s._id} className="p-4 text-xs font-semibold text-white/60 uppercase tracking-wider whitespace-nowrap text-center">
                                                            <div>{s.title}</div>
                                                            <div className="text-[10px] text-white/40 font-normal mt-1">Day {s.dayId?.dayNumber}</div>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {progress.map(student => (
                                                    <tr key={student.registerNumber} className="hover:bg-white/[0.02]">
                                                        <td className="p-4 sticky left-0 bg-black/40 backdrop-blur-sm">
                                                            <div className="text-white font-medium">{student.name}</div>
                                                            <div className="text-white/40 text-xs">{student.registerNumber}</div>
                                                        </td>
                                                        {student.sessions.map(session => {
                                                            const hasAttendance = session.attendance?.status === 'PRESENT';
                                                            const isOverride = session.attendance?.isOverride;
                                                            const photoPath = session.attendance?.photoPath;
                                                            const photoUrl = getPhotoUrl(photoPath);

                                                            return (
                                                                <td key={session.sessionId} className="p-4">
                                                                    <div className="flex flex-col items-center gap-1">
                                                                        {hasAttendance ? (
                                                                            <button
                                                                                onClick={() => photoUrl && setShowPhotoModal({ show: true, url: photoUrl, student: student.name })}
                                                                                className={cn(
                                                                                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                                                                    isOverride ? "bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30" : "bg-green-500/20 text-green-500 hover:bg-green-500/30",
                                                                                    photoUrl && "cursor-pointer hover:scale-110"
                                                                                )}
                                                                                title={photoUrl ? "Click to view photo" : (isOverride ? "Manual override" : "Present")}
                                                                            >
                                                                                <CheckCircle className="w-4 h-4" />
                                                                            </button>
                                                                        ) : (
                                                                            <div className="flex flex-col items-center gap-2">
                                                                                <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center" title="Absent">
                                                                                    <XCircle className="w-4 h-4" />
                                                                                </div>
                                                                                <button
                                                                                    onClick={() => openOverrideModal(student, session.sessionId)}
                                                                                    className="text-xs px-2 py-1 rounded bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 hover:border-yellow-500/30 transition-all"
                                                                                    title="Override attendance for this session"
                                                                                >
                                                                                    Override
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Photo Preview Modal */}
                                <AnimatePresence>
                                    {showPhotoModal.show && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                                            onClick={() => setShowPhotoModal({ show: false, url: '', student: '' })}
                                        >
                                            <motion.div
                                                initial={{ scale: 0.9, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.9, opacity: 0 }}
                                                className="relative max-w-4xl w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                                                    <h3 className="text-lg font-semibold text-white">
                                                        Attendance Photo - {showPhotoModal.student}
                                                    </h3>
                                                    <button
                                                        onClick={() => setShowPhotoModal({ show: false, url: '', student: '' })}
                                                        className="text-white/60 hover:text-white transition-colors"
                                                    >
                                                        <XCircle className="w-6 h-6" />
                                                    </button>
                                                </div>
                                                <div className="p-6 flex items-center justify-center bg-black/20">
                                                    <img
                                                        src={showPhotoModal.url}
                                                        alt="Attendance photo"
                                                        className="max-w-full max-h-[70vh] rounded-lg"
                                                    />
                                                </div>
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Override Attendance Modal */}
                                <AnimatePresence>
                                    {showOverrideModal.show && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                                            onClick={() => setShowOverrideModal({ show: false, student: null, sessionId: null, comment: '' })}
                                        >
                                            <motion.div
                                                initial={{ scale: 0.9, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.9, opacity: 0 }}
                                                className="relative max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="p-6 border-b border-white/10">
                                                    <h3 className="text-xl font-bold text-white mb-2">
                                                        Override Attendance
                                                    </h3>
                                                    <p className="text-white/60 text-sm">
                                                        Manually mark attendance for this student
                                                    </p>
                                                </div>

                                                <form onSubmit={handleOverrideSubmit} className="p-6 space-y-4">
                                                    {/* Student Info */}
                                                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                                        <div className="text-sm text-white/40 mb-1">Student</div>
                                                        <div className="text-white font-medium">{showOverrideModal.student?.name}</div>
                                                        <div className="text-white/60 text-xs">{showOverrideModal.student?.registerNumber}</div>
                                                    </div>

                                                    {/* Session Info */}
                                                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                                        <div className="text-sm text-white/40 mb-1">Session</div>
                                                        <div className="text-white font-medium">
                                                            {sessions.find(s => s._id === showOverrideModal.sessionId)?.title || 'Session'}
                                                        </div>
                                                    </div>

                                                    {/* Comment */}
                                                    <div>
                                                        <label className="block text-sm text-white/60 mb-2">
                                                            Reason for Override <span className="text-red-400">*</span>
                                                        </label>
                                                        <textarea
                                                            value={showOverrideModal.comment}
                                                            onChange={(e) => setShowOverrideModal({ ...showOverrideModal, comment: e.target.value })}
                                                            placeholder="e.g., Technical issue, Late entry approved, etc."
                                                            required
                                                            rows={3}
                                                            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-yellow-500/50 transition-colors"
                                                        />
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex gap-3 pt-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowOverrideModal({ show: false, student: null, sessionId: null, comment: '' })}
                                                            className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            type="submit"
                                                            className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-medium hover:from-yellow-600 hover:to-orange-600 transition-all"
                                                        >
                                                            Override & Mark Present
                                                        </button>
                                                    </div>
                                                </form>
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </>
                        )}

                        {/* Assignments Tracking Tab */}
                        {activeTab === 'assignments' && (
                            <>
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-white mb-2">Assignment Tracking</h2>
                                    <p className="text-white/60">View student assignment completion progress across all sessions.</p>
                                </div>

                                <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.02]">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-white/5 border-b border-white/10">
                                                    <th className="p-4 text-xs font-semibold text-white/60 uppercase tracking-wider sticky left-0 bg-white/5">Student</th>
                                                    {sessions.map(s => (
                                                        <th key={s._id} className="p-4 text-xs font-semibold text-white/60 uppercase tracking-wider whitespace-nowrap text-center">
                                                            <div>{s.title}</div>
                                                            <div className="text-[10px] text-white/40 font-normal mt-1">
                                                                {s.assignments?.length || 0} Task{s.assignments?.length !== 1 ? 's' : ''}
                                                            </div>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {progress.map(student => (
                                                    <tr key={student.registerNumber} className="hover:bg-white/[0.02]">
                                                        <td className="p-4 sticky left-0 bg-black/40 backdrop-blur-sm">
                                                            <div className="text-white font-medium">{student.name}</div>
                                                            <div className="text-white/40 text-xs">{student.registerNumber}</div>
                                                        </td>
                                                        {student.sessions.map(session => {
                                                            const completed = session.assignmentsCompleted || 0;
                                                            const total = session.totalAssignments || 0;
                                                            const percentage = total > 0 ? (completed / total) * 100 : 0;
                                                            const isComplete = completed === total && total > 0;

                                                            return (
                                                                <td key={session.sessionId} className="p-4">
                                                                    <div className="flex flex-col items-center gap-2">
                                                                        {total > 0 ? (
                                                                            <>
                                                                                <div className={cn(
                                                                                    "text-sm font-semibold",
                                                                                    isComplete ? "text-green-400" : completed > 0 ? "text-yellow-400" : "text-white/40"
                                                                                )}>
                                                                                    {completed}/{total}
                                                                                </div>
                                                                                <div className="w-full max-w-[60px] h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                                                    <div
                                                                                        className={cn(
                                                                                            "h-full transition-all",
                                                                                            isComplete ? "bg-green-500" : completed > 0 ? "bg-yellow-500" : "bg-transparent"
                                                                                        )}
                                                                                        style={{ width: `${percentage}%` }}
                                                                                    />
                                                                                </div>
                                                                            </>
                                                                        ) : (
                                                                            <div className="text-xs text-white/30">No tasks</div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'export' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 text-blue-400">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Attendance Report</h3>
                                    <p className="text-white/60 mb-6">Type: .xlsx • Includes: Photos, Timestamps, Overrides</p>
                                    <button
                                        onClick={exportAttendance}
                                        className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Download className="w-4 h-4" /> Download Report
                                    </button>
                                </div>

                                <div className="p-8 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                                    <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4 text-green-400">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Assignment Data</h3>
                                    <p className="text-white/60 mb-6">Type: .xlsx • Includes: Responses, Links, Timestamps</p>
                                    <button
                                        onClick={exportAssignments}
                                        className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Download className="w-4 h-4" /> Download Data
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

export default AdminDashboard;
