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

function StudentDashboard() {
    const [days, setDays] = useState([]);
    const [selectedDay, setSelectedDay] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCamera, setShowCamera] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const user = getUser();
    const navigate = useNavigate();

    useEffect(() => {
        fetchDays();
    }, []);

    // Auto-refresh sessions every 15 seconds to update attendance status
    useEffect(() => {
        if (!selectedDay) return;

        const interval = setInterval(() => {
            if (!isRefreshing) {
                refreshSessions(selectedDay);
            }
        }, 5000); // Reduced to 5 seconds for more "immediate" updates

        return () => clearInterval(interval);
    }, [selectedDay, isRefreshing]);

    const fetchDays = async () => {
        try {
            const response = await api.get('/student/days');
            const daysData = Array.isArray(response.data) ? response.data : [];
            setDays(daysData);

            // Select the first OPEN day by default
            const openDay = daysData.find(d => d.status === 'OPEN');
            if (openDay) {
                setSelectedDay(openDay._id);
                const sessionRes = await api.get(`/student/sessions/${openDay._id}`);
                setSessions(Array.isArray(sessionRes.data) ? sessionRes.data : []);
            }
        } catch (error) {
            console.error('Error fetching days:', error);
            toast.error('Failed to load dashboard data');
            setDays([]);
            setSessions([]);
        } finally {
            setLoading(false);
        }
    };

    const refreshSessions = async (dayId) => {
        try {
            setIsRefreshing(true);
            const response = await api.get(`/student/sessions/${dayId}`);
            setSessions(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error refreshing sessions:', error);
            // Don't toast on auto-refresh to avoid spam, but clear sessions if needed
        } finally {
            setIsRefreshing(false);
        }
    };

    const selectDay = async (dayId) => {
        try {
            setSelectedDay(dayId);
            setIsRefreshing(true);
            const response = await api.get(`/student/sessions/${dayId}`);
            setSessions(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching sessions:', error);
            toast.error(error.response?.data?.message || 'Error fetching sessions');
            setSessions([]);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleLogout = () => {
        clearAuth();
        window.location.href = '/';
    };

    const openCamera = (session) => {
        setSelectedSession(session);
        setShowCamera(true);
    };

    const handlePhotoCapture = async (photoFile) => {
        setShowCamera(false);
        const toastId = toast.loading('Submitting attendance...');

        try {
            const formData = new FormData();
            formData.append('sessionId', selectedSession._id);
            formData.append('photo', photoFile);

            await api.post('/student/attendance', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Attendance marked successfully!', { id: toastId });
            selectDay(selectedDay);
        } catch (error) {
            toast.error('Error marking attendance: ' + (error.response?.data?.message || error.message), { id: toastId });
        }
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
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-soft-light"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/10 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />

            {/* Logout Button */}
            <button
                onClick={handleLogout}
                className="absolute top-6 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-lg bg-black/20 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-105 transition-all text-sm font-medium text-white/70 hover:text-white backdrop-blur-md"
            >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
            </button>

            {/* Header Content */}
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
                </motion.div>
            </div>

            {/* Guidelines */}
            <div className="relative z-10 max-w-7xl mx-auto w-full px-4 md:px-6 mt-6">
                <div className="p-4 rounded-xl bg-purple-900/10 border border-purple-500/20 backdrop-blur-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="flex gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 h-fit">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-semibold text-purple-100">Quick Rules</h3>
                            <div className="text-sm text-purple-200/60">
                                <p>• Mark attendance within 15 minutes of the start.</p>
                                <p>• Complete assessments to earn credits.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="relative z-10 flex-1 flex overflow-hidden pt-6">
                {days.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-white/40">
                        <Calendar className="w-12 h-12 mb-4 opacity-50" />
                        <p>No workshops scheduled.</p>
                    </div>
                ) : (
                    <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 flex flex-col md:flex-row gap-6 overflow-hidden">
                        {/* Days Sidebar */}
                        <div className="w-full md:w-64 flex-shrink-0 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto pb-2 scrollbar-hide">
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
                                                ? "bg-purple-500/10 border-purple-500/50"
                                                : isLocked
                                                    ? "bg-white/[0.02] border-white/5 opacity-50 cursor-not-allowed"
                                                    : "bg-white/5 border-white/5 hover:bg-white/10"
                                        )}
                                    >
                                        <div className="relative z-10">
                                            <div className={cn("text-xs font-semibold mb-1 uppercase tracking-wider", isActive ? "text-purple-400" : "text-white/40")}>
                                                Day {day.dayNumber} {day.date && `(${new Date(day.date).toLocaleDateString('en-GB')})`}
                                            </div>
                                            <div className={cn("text-sm font-medium truncate", isActive ? "text-white" : "text-white/70")}>
                                                {day.title}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Sessions List */}
                        <div className="flex-1 overflow-y-auto scrollbar-hide pb-20">
                            <div className="space-y-4">
                                {sessions.length === 0 ? (
                                    <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
                                        <p className="text-white/40">No sessions for this day.</p>
                                    </div>
                                ) : (
                                    sessions.map((session, idx) => (
                                        <motion.div
                                            key={session._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="relative group bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden p-6"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-xl font-medium text-white/90">{session.title}</h3>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                                        <div className="flex items-center gap-3">
                                                            {session.startTime && (
                                                                <div className="flex items-center gap-1.5 text-purple-300/80 text-xs font-medium">
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                    {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                            )}
                                                            <span className={cn(
                                                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                                                                session.mode === 'OFFLINE'
                                                                    ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                                                                    : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                                            )}>
                                                                {session.mode || 'ONLINE'}
                                                            </span>
                                                        </div>
                                                        <p className="text-white/50 text-sm">{session.description}</p>
                                                    </div>
                                                </div>
                                                {session.hasAttendance && (
                                                    <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium flex items-center gap-1.5">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Present
                                                    </div>
                                                )}
                                            </div>

                                            {session.type !== 'BREAK' && (
                                                <>
                                                    {!session.hasAttendance && (
                                                        <div className="mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                                            {session.isAttendanceActive ? (
                                                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                                                    <div className="flex items-center gap-2 text-purple-300 text-sm">
                                                                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                                                                        Live Attendance
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="text-xs text-white/40 font-mono">
                                                                            <Timer targetDate={session.attendanceEndTime} />
                                                                        </div>
                                                                        <button
                                                                            onClick={() => openCamera(session)}
                                                                            className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 font-medium text-white text-sm flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
                                                                        >
                                                                            <Camera className="w-4 h-4" />
                                                                            Mark Attendance
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : session.attendanceStatus === 'closed' ? (
                                                                <div className="flex items-center justify-between text-red-400 text-sm">
                                                                    <span>Attendance Window Closed</span>
                                                                    <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-xs">Absent</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2 text-white/30 text-sm">
                                                                    <Lock className="w-4 h-4" /> Not Started
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {session.assignments && session.assignments.length > 0 && (
                                                        <div className="mt-4 pt-4 border-t border-white/5">
                                                            {!session.hasAttendance ? (
                                                                <div className="text-yellow-500/70 text-sm flex items-center gap-2">
                                                                    <AlertCircle className="w-4 h-4" /> Mark attendance to unlock assessment
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <div className="text-white font-medium">Assignment</div>
                                                                        <div className="text-white/40 text-sm">{session.assignmentsSubmitted}/{session.totalAssignments} completed</div>
                                                                    </div>
                                                                    <button
                                                                        disabled={session.assignmentsSubmitted === session.totalAssignments}
                                                                        onClick={() => navigate(`/student/assessment/${session._id}`)}
                                                                        className={cn(
                                                                            "px-4 py-2 rounded-lg font-medium text-sm transition-all",
                                                                            session.assignmentsSubmitted === session.totalAssignments
                                                                                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                                                                : "bg-white text-black hover:bg-gray-200"
                                                                        )}
                                                                    >
                                                                        {session.assignmentsSubmitted === session.totalAssignments ? 'Completed' : 'Go to Assessment'}
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Camera Overlay */}
            <AnimatePresence>
                {showCamera && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90">
                        <CameraCapture
                            onCapture={handlePhotoCapture}
                            onCancel={() => setShowCamera(false)}
                        />
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default StudentDashboard;
