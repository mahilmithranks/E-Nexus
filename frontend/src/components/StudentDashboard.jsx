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
    const [lastSyncTime, setLastSyncTime] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [assignmentData, setAssignmentData] = useState({});

    const user = getUser();
    const navigate = useNavigate();

    const calculateTotalTime = () => {
        if (!sessions || sessions.length === 0) return "0h 0m";
        let totalMinutes = 0;
        sessions.forEach(session => {
            if (session.startTime && session.endTime) {
                const start = new Date(session.startTime);
                const end = new Date(session.endTime);
                const diff = (end - start) / (1000 * 60);
                if (diff > 0) totalMinutes += diff;
            }
        });
        const hours = Math.floor(totalMinutes / 60);
        const mins = Math.floor(totalMinutes % 60);
        return `${hours}h ${mins}m`;
    };

    useEffect(() => {
        fetchDays();
    }, []);

    // Optimized Auto-refresh: Poll for a "tick" first, then fetch full data if changed
    useEffect(() => {
        if (!selectedDay) return;

        const checkSync = async () => {
            if (isRefreshing) return;
            try {
                const response = await api.get('/sync/check');
                const serverLastUpdate = response.data.lastUpdate;

                if (serverLastUpdate > lastSyncTime) {
                    await refreshSessions(selectedDay);
                    setLastSyncTime(serverLastUpdate);
                }
            } catch (err) {
                console.warn('Sync check failed, falling back...');
                // Fallback: refresh anyway if sync fails
                refreshSessions(selectedDay);
            }
        };

        const interval = setInterval(checkSync, 3000);

        return () => clearInterval(interval);
    }, [selectedDay, isRefreshing, lastSyncTime]);

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
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white font-sans">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-[#f05423] border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Initializing Environment</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-[#0a0a0a] text-zinc-400 font-sans selection:bg-[#f05423]/30 selection:text-[#f05423]">
            {/* Ambient Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#f05423]/05 blur-[120px]" />
                <div className="absolute bottom-[-5%] right-[-5%] w-[30vw] h-[30vw] rounded-full bg-[#ff9d00]/05 blur-[100px]" />
                <div className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    }}
                />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                {/* MODERN TOP BAR */}
                <header className="h-20 border-b border-white/5 bg-[#0d0d0d]/80 backdrop-blur-xl sticky top-0 z-50 px-6 md:px-10 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">

                            <div className="hidden sm:block">
                                <span className="text-lg font-bold text-white tracking-tight block leading-none">Workshop Console</span>
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1 block">Live Learning Environment</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5">
                            <div className="text-right">
                                <p className="text-xs font-bold text-white leading-none capitalize">{user.name}</p>
                                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter mt-1">{user.registerNumber}</p>
                            </div>
                            <div className="size-8 rounded-lg bg-[#f05423]/10 border border-[#f05423]/20 flex items-center justify-center text-[#f05423] text-xs font-bold ring-2 ring-black">
                                {user.name?.[0]}
                            </div>
                        </div>

                        {user.role === 'admin' && (
                            <button
                                onClick={() => navigate('/admin')}
                                className="px-4 py-2 rounded-xl bg-[#f05423]/10 text-[#f05423] text-[10px] font-black uppercase tracking-widest border border-[#f05423]/20 hover:bg-[#f05423]/20 transition-all"
                            >
                                Admin View
                            </button>
                        )}

                        <div className="h-6 w-px bg-white/10 mx-1" />

                        <button
                            onClick={handleLogout}
                            className="p-2.5 rounded-xl text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20"
                            title="Terminate Session"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                <main className="flex-1 flex flex-col md:flex-row max-w-[1600px] mx-auto w-full px-4 md:px-10 py-10 gap-10">

                    {/* LEFT PANEL: TIMELINE & STATS */}
                    <div className="w-full md:w-80 space-y-8 shrink-0">
                        {/* User Metadata Card */}
                        <div className="p-8 rounded-[2rem] bg-gradient-to-br from-[#111111] to-[#0d0d0d] border border-white/5 shadow-2xl relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 size-32 bg-[#f05423]/10 blur-3xl rounded-full" />

                            <div className="relative z-10 space-y-6">
                                <div>
                                    <h2 className="text-sm font-black text-[#f05423] uppercase tracking-[0.2em] mb-4">Identity Profile</h2>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-xs py-2 border-b border-white/5">
                                            <span className="text-zinc-500 font-medium">Department</span>
                                            <span className="text-white font-bold">{user.department}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs py-2 border-b border-white/5">
                                            <span className="text-zinc-500 font-medium">Academic Year</span>
                                            <span className="text-white font-bold">{user.yearOfStudy} Year</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs py-2">
                                            <span className="text-zinc-500 font-medium">Status</span>
                                            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                                                <div className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                Active
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <div className="p-5 rounded-2xl bg-[#0a0a0a] border border-[#f05423]/20 text-[10px] text-zinc-500 leading-relaxed font-medium relative group/notice overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-[#f05423]/05 to-transparent opacity-0 group-hover/notice:opacity-100 transition-opacity" />
                                        <div className="flex items-center gap-2 text-white mb-3 font-black uppercase tracking-wider relative z-10">
                                            <AlertCircle className="w-3.5 h-3.5 text-[#f05423]" />
                                            Support & Protocol
                                        </div>
                                        <div className="space-y-2 relative z-10">
                                            <p>• Mark attendance within the first 10m of session activation.</p>
                                            <p className="text-[#ff9d00] font-bold">
                                                • Refresh page if facing any technical issue. Report to admin if not resolved.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Course Credits Card */}
                        <div className="p-8 rounded-[2rem] bg-gradient-to-br from-[#111111] to-[#0a0a0a] border border-white/5 shadow-2xl relative overflow-hidden group">
                            <div className="absolute -left-4 -bottom-4 size-24 bg-[#ff9d00]/05 blur-3xl rounded-full" />
                            <div className="relative z-10 space-y-4">
                                <h2 className="text-[10px] font-black text-[#ff9d00] uppercase tracking-[0.3em]">Course Details</h2>
                                <div className="space-y-4">
                                    <div className="flex items-end justify-between">
                                        <div className="space-y-1">
                                            <p className="text-lg font-black text-white">Experimental Elective</p>
                                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Course Type</p>
                                        </div>
                                        <div className="px-2.5 py-1 rounded-lg bg-[#ff9d00]/10 border border-[#ff9d00]/20 text-[#ff9d00] text-[9px] font-black uppercase tracking-widest">
                                            2 Credits
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t border-white/5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Duration</span>
                                            <span className="text-sm font-black text-white">60 HRS</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Component Hours Breakdown */}
                        <div className="p-8 rounded-[2rem] bg-gradient-to-br from-[#111111] to-[#0d0d0d] border border-white/5 shadow-2xl relative overflow-hidden group">
                            <div className="absolute -right-4 -bottom-4 size-32 bg-blue-500/05 blur-3xl rounded-full" />
                            <div className="relative z-10 space-y-4">
                                <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Component Hours</h2>
                                <div className="p-5 rounded-2xl bg-[#0a0a0a] border border-white/5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Infosys Spring Board</span>
                                        <span className="text-xs font-bold text-white">30 Hrs</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Hands-on Training</span>
                                        <span className="text-xs font-bold text-white">30 Hrs</span>
                                    </div>
                                    <div className="w-full h-px bg-white/5 my-2" />
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-blue-400 font-black uppercase tracking-wider">Total Required</span>
                                        <span className="text-sm font-black text-white">60 Hrs</span>
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* Workshop Rules Section */}
                        <div className="space-y-4 px-4">
                            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4">Workshop Rules</h3>
                            <div className="space-y-3">
                                {[
                                    { text: "Professional Conduct", color: "text-indigo-400" },
                                    { text: "Camera Authentication", color: "text-emerald-400" },
                                    { text: "No External Proxies", color: "text-red-400" },
                                    { text: "Session Punctuality", color: "text-blue-400" }
                                ].map((rule, i) => (
                                    <div key={i} className="flex items-center gap-3 group/rule">
                                        <div className={cn("size-1 rounded-full bg-zinc-800 transition-all group-hover/rule:scale-150 group-hover/rule:bg-current", rule.color)} />
                                        <span className="text-[11px] font-medium text-zinc-500 group-hover:text-zinc-300 transition-colors uppercase tracking-wider">{rule.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>


                    </div>

                    {/* RIGHT PANEL: SESSIONS LIST */}
                    <div className="flex-1 space-y-8">
                        {/* Innovative Sprint Roadmap */}
                        <div className="w-full">
                            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-6">Sprint Roadmap</h3>

                            <div className="relative group">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-8">
                                    {days.map((day, idx) => {
                                        const isActive = selectedDay === day._id;
                                        const isLocked = day.status !== 'OPEN';

                                        return (
                                            <motion.button
                                                key={day._id}
                                                onClick={() => selectDay(day._id)}
                                                disabled={isLocked}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className={cn(
                                                    "relative w-full aspect-[3/4] outline-none transition-all duration-300 group/card",
                                                    isLocked ? "opacity-40 grayscale cursor-not-allowed" : "cursor-pointer",
                                                    isActive ? "z-10" : "z-0"
                                                )}
                                            >
                                                <div className={cn(
                                                    "relative w-full h-full rounded-[2rem] p-5 flex flex-col justify-between overflow-hidden transition-all duration-500 border",
                                                    isActive
                                                        ? "bg-[#f05423] border-[#f05423] shadow-[0_10px_40px_-10px_rgba(240,84,35,0.6)] scale-105"
                                                        : "bg-[#111111] border-white/5 hover:border-white/20 hover:bg-[#1a1a1a] hover:translate-y-[-2px]"
                                                )}>
                                                    {/* Active Background Effects */}
                                                    {isActive && (
                                                        <>
                                                            <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/20 blur-3xl rounded-full pointer-events-none" />
                                                            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                                                        </>
                                                    )}

                                                    <div className="relative z-10 flex justify-between items-start">
                                                        <span className={cn(
                                                            "text-3xl font-black tracking-tighter leading-none",
                                                            isActive ? "text-white" : "text-zinc-800 group-hover/card:text-zinc-700"
                                                        )}>
                                                            {String(day.dayNumber).padStart(2, '0')}
                                                        </span>
                                                        {isLocked ? (
                                                            <Lock className="w-4 h-4 text-zinc-700" />
                                                        ) : isActive ? (
                                                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]" />
                                                        ) : null}
                                                    </div>

                                                    <div className="relative z-10 space-y-1.5 text-left">
                                                        <p className={cn(
                                                            "text-[9px] font-black uppercase tracking-widest",
                                                            isActive ? "text-white/60" : "text-zinc-600"
                                                        )}>
                                                            {day.date ? new Date(day.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) : 'TBA'}
                                                        </p>
                                                        <div className={cn(
                                                            "h-px w-full",
                                                            isActive ? "bg-white/20" : "bg-white/5"
                                                        )} />
                                                        <p className={cn(
                                                            "text-[11px] font-bold line-clamp-2 leading-tight min-h-[2.5em]",
                                                            isActive ? "text-white" : "text-zinc-400 group-hover/card:text-zinc-300"
                                                        )}>
                                                            {day.title}
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Header Stats for Selected Day */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:bg-white/[0.03] transition-colors">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Selected Period</p>
                                    <p className="text-xl font-bold text-white capitalize">
                                        {days.find(d => d._id === selectedDay)?.title || "Select a Day"}
                                    </p>
                                </div>
                                <div className="size-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/40">
                                    <Calendar className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center justify-between hover:bg-white/[0.03] transition-colors">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Volume</p>
                                    <p className="text-xl font-bold text-white">{sessions.length} Core Sessions</p>
                                </div>
                                <div className="size-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/40">
                                    <Clock className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <AnimatePresence mode="wait">
                                {isRefreshing && sessions.length === 0 ? (
                                    <div className="py-20 flex flex-col items-center justify-center text-zinc-600 space-y-4">
                                        <div className="w-6 h-6 border border-zinc-500 border-t-transparent animate-spin rounded-full" />
                                        <p className="text-xs font-black uppercase tracking-[0.2em]">Synchronizing Records</p>
                                    </div>
                                ) : sessions.length === 0 ? (
                                    <div className="py-20 rounded-[2.5rem] border border-dashed border-white/5 flex flex-col items-center justify-center text-zinc-600 bg-white/[0.01]">
                                        <AlertCircle className="w-8 h-8 mb-4 opacity-20" />
                                        <p className="text-xs font-black uppercase tracking-[0.2em]">No Active Sessions Found</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-6">
                                        {sessions.map((session, idx) => (
                                            <motion.div
                                                key={session._id}
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="group relative p-8 rounded-[2.5rem] bg-[#111111]/40 border border-white/5 hover:border-[#f05423]/20 transition-all duration-500 overflow-hidden shadow-2xl"
                                            >
                                                <div className="absolute -right-20 -bottom-20 size-64 bg-[#f05423]/05 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />

                                                <div className="relative z-10">
                                                    <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
                                                        <div className="space-y-4 flex-1">
                                                            <div className="flex flex-wrap items-center gap-3">
                                                                <h3 className="text-2xl font-bold text-white tracking-tight">{session.title}</h3>
                                                                <div className={cn(
                                                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                                                    session.mode === 'OFFLINE'
                                                                        ? "bg-[#ff9d00]/10 text-[#ff9d00] border-[#ff9d00]/20"
                                                                        : "bg-[#f05423]/10 text-[#f05423] border-[#f05423]/20"
                                                                )}>
                                                                    {session.mode || 'ONLINE'}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-6">
                                                                {session.startTime && (
                                                                    <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/5">
                                                                        <Clock className="w-3.5 h-3.5 text-[#f05423]" />
                                                                        {session.title === "Infosys Certified Course" ? (
                                                                            new Date(session.startTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                                                                        ) : (
                                                                            `${new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — ${new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                                                        )}
                                                                    </div>
                                                                )}
                                                                <p className="text-zinc-500 text-sm font-medium line-clamp-1 max-w-sm">{session.description}</p>
                                                            </div>
                                                        </div>

                                                        <div className="shrink-0">
                                                            {session.hasAttendance ? (
                                                                <div className="px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-widest flex items-center gap-2.5">
                                                                    <CheckCircle className="w-4 h-4" />
                                                                    Attendance Verified
                                                                </div>
                                                            ) : session.type === 'BREAK' ? (
                                                                <div className="px-6 py-3 rounded-2xl bg-white/[0.03] text-zinc-500 border border-white/5 text-xs font-black uppercase tracking-widest flex items-center gap-2.5">
                                                                    Break Period
                                                                </div>
                                                            ) : session.isAttendanceActive ? (
                                                                <div className="flex items-center gap-3">
                                                                    <div className="text-right hidden sm:block">
                                                                        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Window Ends In</div>
                                                                        <div className="text-white font-mono text-sm font-bold bg-[#f05423]/10 px-2 py-0.5 rounded border border-[#f05423]/20">
                                                                            <Timer targetDate={session.attendanceEndTime} />
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => openCamera(session)}
                                                                        className="px-8 py-4 rounded-2xl bg-[#f05423] hover:bg-[#ff9d00] text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-[#f05423]/20 transition-all flex items-center gap-2.5 active:scale-95"
                                                                    >
                                                                        <Camera className="w-4 h-4" />
                                                                        Authenticate
                                                                    </button>
                                                                </div>
                                                            ) : session.attendanceStatus === 'closed' && session.attendanceEndTime ? (
                                                                <div className="flex flex-col items-end gap-2">
                                                                    <div className="px-6 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                                                        <X className="w-3 h-3" />
                                                                        Absent
                                                                    </div>
                                                                    <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter bg-white/[0.03] px-3 py-1 rounded-lg border border-white/5">
                                                                        Registration Window Closed
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="px-6 py-3 rounded-2xl bg-white/[0.02] border border-white/5 text-zinc-600 text-xs font-black uppercase tracking-widest flex items-center gap-2.5">
                                                                    <Lock className="w-4 h-4" />
                                                                    Awaiting Startup
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>


                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </main>

                {/* MOBILE NAV PLACEHOLDER / FOOTER */}
                <footer className="py-10 border-t border-white/5 text-center bg-[#0d0d0d]/40">
                    <p className="text-[10px] font-black text-zinc-800 uppercase tracking-[0.5em]">Workshop Management System</p>
                </footer>
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
