import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, LogOut, FileText, Link as LinkIcon, Upload, Calendar, Clock, ChevronRight, CheckCircle, AlertCircle, Lock, X, Send, ExternalLink } from 'lucide-react';
import api from '../services/api';
import { getUser, clearAuth } from '../utils/auth';
import CameraCapture from './CameraCapture';
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
    const [showWarning, setShowWarning] = useState(false);
    const [warningTimerSeconds, setWarningTimerSeconds] = useState(5);
    const [redoActive, setRedoActive] = useState({}); // Tracking resubmission mode per session
    const [showLaptopNotice, setShowLaptopNotice] = useState(() => {
        return !sessionStorage.getItem('laptopNoticeShown');
    });
    const [noticeTimer, setNoticeTimer] = useState(10);

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

        const interval = setInterval(checkSync, 60000); // Check every minute, session-specific refreshes handle real-time

        return () => clearInterval(interval);
    }, [selectedDay, isRefreshing, lastSyncTime]);

    useEffect(() => {
        let timer;
        if (showWarning && warningTimerSeconds > 0) {
            timer = setTimeout(() => {
                setWarningTimerSeconds(prev => prev - 1);
            }, 1000);
        }
        return () => clearTimeout(timer);
    }, [showWarning, warningTimerSeconds]);

    useEffect(() => {
        let timer;
        if (showLaptopNotice && noticeTimer > 0) {
            timer = setTimeout(() => {
                setNoticeTimer(prev => prev - 1);
            }, 1000);
        }
        return () => clearTimeout(timer);
    }, [showLaptopNotice, noticeTimer]);

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
            if (error.response?.status === 403) {
                toast.error('This day is currently locked by the administrator.');
            } else {
                toast.error(error.response?.data?.message || 'Error fetching sessions');
            }
            setSessions([]);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Auto-populate assignment data from existing submissions (ONLY for Infosys)
    useEffect(() => {
        if (sessions.length > 0) {
            const newAssignmentData = { ...assignmentData };
            sessions.forEach(session => {
                // Restricted to Infosys Certified Course as per user request
                if (session.title === "Infosys Certified Course" && session.submissionDetails) {
                    session.submissionDetails.forEach(detail => {
                        const key = `${session._id}-${detail.title}`;
                        // Only populate if not already touched by user in current session
                        if (!newAssignmentData[key]) {
                            newAssignmentData[key] = detail.response;
                        }
                    });
                }
            });
            setAssignmentData(newAssignmentData);
        }
    }, [sessions]);

    const handleLogout = () => {
        clearAuth();
        sessionStorage.removeItem('laptopNoticeShown');
        window.location.href = '/';
    };

    const openCamera = (session) => {
        setSelectedSession(session);
        setWarningTimerSeconds(5);
        setShowWarning(true);
    };

    const handleProceedToCamera = () => {
        setShowWarning(false);
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

        if (!data || !data.toString().trim()) {
            toast.error('Please submit link to submit assessment');
            return;
        }

        if (assignment.type === 'certificate' || assignment.title === 'Certificate') {
            const confirmed = window.confirm("Are you sure you want to submit? You can update this link anytime before the deadline.");
            if (!confirmed) return;
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

            // Clear redo mode if this was a certificate update
            if (assignment.title === 'Certificate' || assignment.type === 'certificate') {
                setRedoActive({ ...redoActive, [session._id]: false });
            }

            selectDay(selectedDay);
        } catch (error) {
            toast.error('Error submitting assignment: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleAssignmentChange = (sessionId, assignmentTitle, value) => {
        if (value instanceof File && value.size > 100 * 1024) {
            toast.error('File size exceeds 100KB limit! Please compress the file.');
            return;
        }
        const key = `${sessionId}-${assignmentTitle}`;
        setAssignmentData({ ...assignmentData, [key]: value });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center text-zinc-900 font-sans">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-[#f05423] border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Initializing Environment</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-white text-zinc-600 font-sans selection:bg-[#f05423]/20 selection:text-[#f05423] relative overflow-x-hidden">
            {/* Ambient Background Effects - Enhanced Liquid Motion */}
            {/* Ambient Background Effects - Optimized for Mobile */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {/* Mobile: Static Gradient (Zero GPU cost) */}
                <div className="absolute inset-0 bg-gradient-to-br from-white via-[#f05423]/05 to-white md:hidden" />

                {/* Desktop: Animated Blobs (Only show on md+) */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{
                        opacity: 1,
                        x: [0, 40, -20, 0],
                        y: [0, -30, 50, 0],
                        scale: [1, 1.1, 0.9, 1]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="hidden md:block absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#f05423]/10 blur-[120px]"
                    style={{ willChange: 'transform' }}
                />
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{
                        opacity: 1,
                        x: [0, -50, 30, 0],
                        y: [0, 60, -40, 0],
                        scale: [1, 0.9, 1.1, 1]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="hidden md:block absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#ff9d00]/10 blur-[100px]"
                    style={{ willChange: 'transform' }}
                />
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{
                        opacity: 1,
                        x: [0, 30, -50, 0],
                        y: [0, 40, 20, 0]
                    }}
                    transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                    className="hidden md:block absolute top-[30%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-blue-400/05 blur-[120px]"
                    style={{ willChange: 'transform' }}
                />
                <div className="absolute inset-0 opacity-[0.3]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E")`,
                    }}
                />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                {/* MODERN TOP BAR - Glassy */}
                <header className="h-16 sm:h-20 border-b border-white/40 bg-white/60 backdrop-blur-xl sticky top-0 z-50 px-3 sm:px-6 md:px-10 flex items-center justify-between shadow-sm supports-[backdrop-filter]:bg-white/60">
                    <div className="flex items-center gap-2 sm:gap-4 md:gap-6 overflow-hidden min-w-0">
                        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                            {/* Logo - Slightly smaller on mobile */}
                            <img src="/enexus-logo.png" alt="E-Nexus Logo" className="h-8 sm:h-10 md:h-16 w-auto object-contain shrink-0" />

                            {/* Separator - Hidden on very small screens, shown on sm+ */}
                            <div className="h-6 sm:h-8 md:h-10 w-px bg-zinc-200/50 mx-1 flex shrink-0" />

                            {/* Title - Visible on ALL screens now */}
                            <div className="flex flex-col justify-center min-w-0">
                                <span className="text-xs sm:text-sm md:text-lg font-bold text-zinc-900 tracking-tight leading-none truncate">
                                    E-Nexus <span className="text-[#f05423]">Buildmode</span>
                                </span>
                                <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-0.5 sm:mt-1 truncate">
                                    2026 Bootcamp
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-white/50 border border-white/40 shadow-sm backdrop-blur-md">
                            <div className="text-right">
                                <p className="text-[10px] sm:text-xs md:text-sm font-bold text-zinc-900 leading-none capitalize truncate max-w-[100px] sm:max-w-none">{user.name}</p>
                                <p className="text-[9px] sm:text-[10px] md:text-xs text-zinc-400 font-bold uppercase tracking-tighter mt-0.5 sm:mt-1 truncate">{user.registerNumber}</p>
                            </div>
                            <div className="size-5 sm:size-6 md:size-8 rounded-md sm:rounded-lg bg-[#f05423]/10 border border-[#f05423]/20 flex items-center justify-center text-[#f05423] text-[9px] sm:text-[10px] md:text-xs font-bold ring-1 sm:ring-2 ring-white/50 shrink-0">
                                {user.name?.[0]}
                            </div>
                        </div>

                        {user.role === 'admin' && (
                            <button
                                onClick={() => navigate('/admin')}
                                className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[#f05423]/10 text-[#f05423] text-[9px] sm:text-[10px] font-black uppercase tracking-widest border border-[#f05423]/20 hover:bg-[#f05423]/20 transition-all backdrop-blur-md"
                            >
                                Admin
                            </button>
                        )}

                        <div className="h-4 sm:h-6 w-px bg-zinc-200/50 mx-0.5 sm:mx-1" />

                        <button
                            onClick={handleLogout}
                            className="p-1.5 sm:p-2.5 rounded-xl text-zinc-400 hover:bg-red-500/10 hover:text-red-500 transition-all border border-transparent hover:border-red-500/20 backdrop-blur-md"
                            title="Terminate Session"
                        >
                            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </header>

                <main className="flex-1 flex flex-col-reverse md:flex-row max-w-[1600px] mx-auto w-full px-3 sm:px-4 md:px-10 py-6 sm:py-10 gap-6 sm:gap-10">

                    {/* LEFT PANEL: TIMELINE & STATS */}
                    <div className="w-full md:w-80 space-y-6 sm:space-y-8 shrink-0">
                        {/* PERSISTENT HIGHLIGHTED NOTICE */}
                        <div className="p-5 sm:p-6 rounded-2xl bg-[#f05423] text-white shadow-xl shadow-[#f05423]/30 relative overflow-hidden group animate-pulse">
                            <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
                            <div className="relative z-10 space-y-3">
                                <div className="flex items-center gap-2 text-white/90 text-[10px] font-black uppercase tracking-widest">
                                    <AlertCircle className="w-4 h-4" />
                                    Critically Important
                                </div>
                                <p className="text-sm sm:text-base font-bold leading-tight">
                                    "A laptop is mandatory for Day 8 (21.02.2026). Please ensure you bring your device."
                                </p>
                            </div>
                        </div>

                        {/* User Metadata Card - Glassy */}
                        <div className="p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl shadow-zinc-200/50 relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 size-24 sm:size-32 bg-[#f05423]/10 blur-3xl rounded-full" />

                            <div className="relative z-10 space-y-4 sm:space-y-6">
                                <div>
                                    <h2 className="text-xs sm:text-sm font-black text-[#f05423] uppercase tracking-[0.2em] mb-3 sm:mb-4">Identity Profile</h2>
                                    <div className="space-y-2 sm:space-y-3">
                                        <div className="flex items-center justify-between text-[10px] sm:text-xs py-1.5 sm:py-2 border-b border-zinc-100/50">
                                            <span className="text-zinc-400 font-bold">Department</span>
                                            <span className="text-zinc-800 font-bold">{user.department}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] sm:text-xs py-1.5 sm:py-2 border-b border-zinc-100/50">
                                            <span className="text-zinc-400 font-bold">Academic Year</span>
                                            <span className="text-zinc-800 font-bold">{user.yearOfStudy} Year</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] sm:text-xs py-1.5 sm:py-2">
                                            <span className="text-zinc-400 font-bold">Status</span>
                                            <div className="flex items-center gap-1.5 text-emerald-500 font-bold">
                                                <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Active
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-3 sm:pt-4">
                                    <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white/50 border border-white/50 text-[9px] sm:text-[10px] text-zinc-500 leading-relaxed font-medium relative group/notice overflow-hidden backdrop-blur-sm">
                                        <div className="absolute inset-0 bg-gradient-to-r from-[#f05423]/05 to-transparent opacity-0 group-hover/notice:opacity-100 transition-opacity" />
                                        <div className="flex items-center gap-2 text-zinc-800 mb-2 sm:mb-3 font-black uppercase tracking-wider relative z-10 text-[10px] sm:text-xs">
                                            <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#f05423]" />
                                            Support & Protocol
                                        </div>
                                        <div className="space-y-1.5 sm:space-y-2 relative z-10">
                                            <p>• Mark attendance within the first 10m of session activation.</p>
                                            <p className="text-[#ff9d00] font-bold">
                                                • Refresh page if facing any technical issue. Report to admin if not resolved.
                                            </p>
                                            <div className="pt-1.5 sm:pt-2 mt-1.5 sm:mt-2 border-t border-zinc-200/30">
                                                <p className="text-[10px] sm:text-xs font-bold text-zinc-800 mb-1">Contact Admins:</p>
                                                <p>• Rupesh: <span className="text-zinc-900 select-all">9493760536</span></p>
                                                <p>• Mahil Mithran: <span className="text-zinc-900 select-all">9363978578</span></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Course Credits Card - Glassy */}
                        <div className="p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl shadow-zinc-200/50 relative overflow-hidden group">
                            <div className="absolute -left-4 -bottom-4 size-20 sm:size-24 bg-[#ff9d00]/10 blur-3xl rounded-full" />
                            <div className="relative z-10 space-y-3 sm:space-y-4">
                                <h2 className="text-[9px] sm:text-[10px] font-black text-[#ff9d00] uppercase tracking-[0.3em]">Course Details</h2>
                                <div className="space-y-3 sm:space-y-4">
                                    <div className="flex items-end justify-between">
                                        <div className="space-y-1">
                                            <p className="text-base sm:text-lg font-black text-zinc-900">Experimental Elective</p>
                                            <p className="text-[8px] sm:text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Course Type</p>
                                        </div>
                                        <div className="px-2 sm:px-2.5 py-1 rounded-lg bg-[#ff9d00]/10 border border-[#ff9d00]/20 text-[#ff9d00] text-[8px] sm:text-[9px] font-black uppercase tracking-widest backdrop-blur-sm">
                                            2 Credits
                                        </div>
                                    </div>
                                    <div className="pt-2 sm:pt-3 border-t border-zinc-100/50">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] sm:text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Total Duration</span>
                                            <span className="text-sm font-black text-zinc-900">60 HRS</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Component Hours Breakdown - Glassy */}
                        <div className="p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl shadow-zinc-200/50 relative overflow-hidden group">
                            <div className="absolute -right-4 -bottom-4 size-24 sm:size-32 bg-blue-500/10 blur-3xl rounded-full" />
                            <div className="relative z-10 space-y-3 sm:space-y-4">
                                <h2 className="text-[9px] sm:text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Component Hours</h2>
                                <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white/50 border border-white/50 space-y-2 sm:space-y-3 backdrop-blur-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Infosys Spring Board</span>
                                        <span className="text-[10px] sm:text-xs font-bold text-zinc-900">30 Hrs</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Hands-on Training</span>
                                        <span className="text-[10px] sm:text-xs font-bold text-zinc-900">30 Hrs</span>
                                    </div>
                                    <div className="w-full h-px bg-zinc-200/30 my-1.5 sm:my-2" />
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] sm:text-[10px] text-blue-500 font-black uppercase tracking-wider">Total Required</span>
                                        <span className="text-xs sm:text-sm font-black text-zinc-900">60 Hrs</span>
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* Workshop Rules Section */}
                        <div className="space-y-4 px-4">
                            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-4">Bootcamp Rules</h3>
                            <div className="space-y-3">
                                {[
                                    { text: "Professional Conduct", color: "text-indigo-400" },
                                    { text: "Camera Authentication", color: "text-emerald-400" },
                                    { text: "No External Proxies", color: "text-red-400" },
                                    { text: "Session Punctuality", color: "text-blue-400" }
                                ].map((rule, i) => (
                                    <div key={i} className="flex items-center gap-3 group/rule">
                                        <div className={cn("size-1 rounded-full bg-zinc-300 transition-all group-hover/rule:scale-150 group-hover/rule:bg-current", rule.color)} />
                                        <span className="text-[11px] font-medium text-zinc-500 group-hover:text-zinc-700 transition-colors uppercase tracking-wider">{rule.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>


                    </div>

                    {/* RIGHT PANEL: SESSIONS LIST */}
                    <div className="flex-1 space-y-8">
                        {/* Innovative Sprint Roadmap */}
                        <div className="w-full">
                            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-6">Sprint Roadmap</h3>

                            <div className="relative group">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-8">
                                    {days.map((day, idx) => {
                                        const isActive = selectedDay === day._id;
                                        // Only LOCKED status disables the day. COMPLETED/OPEN are accessible.
                                        const isLocked = day.status === 'LOCKED';
                                        const isCompleted = day.status === 'COMPLETED';

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
                                                    isLocked ? "opacity-30 grayscale cursor-not-allowed" : "cursor-pointer",
                                                    isActive ? "z-10" : "z-0"
                                                )}
                                            >
                                                <div className={cn(
                                                    "relative w-full h-full rounded-[2rem] p-5 flex flex-col justify-between overflow-hidden transition-all duration-500 border backdrop-blur-xl",
                                                    isActive
                                                        ? "bg-[#f05423] border-[#f05423] shadow-xl scale-105"
                                                        : isCompleted
                                                            ? "bg-emerald-50/60 border-emerald-100 hover:border-emerald-200 hover:bg-emerald-50 hover:translate-y-[-2px] shadow-sm"
                                                            : "bg-white/60 border-white/40 hover:border-white hover:bg-white/80 hover:translate-y-[-2px] shadow-sm"
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
                                                            isActive ? "text-white" : isCompleted ? "text-emerald-600" : "text-zinc-900 group-hover/card:text-zinc-700"
                                                        )}>
                                                            {day.title.toLowerCase().includes('certificate') ? (
                                                                <Upload className="w-8 h-8" />
                                                            ) : (
                                                                String(day.dayNumber).padStart(2, '0')
                                                            )}
                                                        </span>
                                                        {isLocked ? (
                                                            <Lock className="w-4 h-4 text-zinc-300" />
                                                        ) : isCompleted ? (
                                                            <CheckCircle className={cn("w-5 h-5", isActive ? "text-white" : "text-emerald-500")} />
                                                        ) : isActive ? (
                                                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]" />
                                                        ) : null}

                                                    </div>

                                                    <div className="relative z-10 space-y-1.5 text-left">
                                                        {!day.title.toLowerCase().includes('certificate') && (
                                                            <p className={cn(
                                                                "text-[9px] font-black uppercase tracking-widest",
                                                                isActive ? "text-white/60" : "text-zinc-400"
                                                            )}>
                                                                {day.date ? new Date(day.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) : 'TBA'}
                                                            </p>
                                                        )}
                                                        <div className={cn(
                                                            "h-px w-full",
                                                            isActive ? "bg-white/20" : "bg-zinc-200/50"
                                                        )} />
                                                        <p className={cn(
                                                            "text-[11px] font-bold line-clamp-2 leading-tight min-h-[2.5em]",
                                                            isActive ? "text-white" : "text-zinc-500 group-hover/card:text-zinc-600"
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

                        {/* Header Stats for Selected Day - Glassy */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-6 rounded-[2rem] bg-white/70 backdrop-blur-xl border border-white/40 flex items-center justify-between group shadow-lg shadow-zinc-200/50 hover:shadow-xl transition-all">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Selected Period</p>
                                    <p className="text-xl font-bold text-zinc-900 capitalize">
                                        {days.find(d => d._id === selectedDay)?.title || "Select a Day"}
                                    </p>
                                </div>
                                <div className="size-12 rounded-2xl bg-white/50 border border-white/40 flex items-center justify-center text-zinc-400 backdrop-blur-sm">
                                    <Calendar className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="p-6 rounded-[2rem] bg-white/70 backdrop-blur-xl border border-white/40 flex items-center justify-between shadow-lg shadow-zinc-200/50 hover:shadow-xl transition-all">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Volume</p>
                                    <p className="text-xl font-bold text-zinc-900">{sessions.length} Core Sessions</p>
                                </div>
                                <div className="size-12 rounded-2xl bg-white/50 border border-white/40 flex items-center justify-center text-zinc-400 backdrop-blur-sm">
                                    <Clock className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <AnimatePresence mode="wait">
                                {isRefreshing && sessions.length === 0 ? (
                                    <div className="py-10 sm:py-20 flex flex-col items-center justify-center text-zinc-400 space-y-4">
                                        <div className="w-6 h-6 border border-zinc-300 border-t-transparent animate-spin rounded-full" />
                                        <p className="text-xs font-black uppercase tracking-[0.2em]">Synchronizing Records</p>
                                    </div>
                                ) : sessions.length === 0 ? (
                                    <div className="py-10 sm:py-20 rounded-[2rem] sm:rounded-[2.5rem] border border-dashed border-zinc-200 flex flex-col items-center justify-center text-zinc-400 bg-white/30 backdrop-blur-sm">
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
                                                className="group relative p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] bg-white border border-white/60 hover:border-[#f05423]/30 transition-all duration-500 overflow-hidden shadow-lg hover:shadow-xl shadow-zinc-200/40 md:bg-white/60 md:backdrop-blur-2xl"
                                                style={{
                                                    willChange: 'transform, opacity',
                                                    contentVisibility: 'auto',
                                                    contain: 'layout paint'
                                                }}
                                            >
                                                <div className="absolute -right-20 -bottom-20 size-64 bg-[#f05423]/05 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />

                                                <div className="relative z-10">
                                                    <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
                                                        <div className="space-y-4 flex-1">
                                                            <div className="flex flex-wrap items-center gap-3">
                                                                <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">{session.title}</h3>
                                                                <div className={cn(
                                                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border backdrop-blur-sm",
                                                                    session.mode === 'OFFLINE'
                                                                        ? "bg-[#ff9d00]/10 text-[#ff9d00] border-[#ff9d00]/20"
                                                                        : "bg-[#f05423]/10 text-[#f05423] border-[#f05423]/20"
                                                                )}>
                                                                    {session.mode || 'ONLINE'}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-6">
                                                                {session.startTime && (
                                                                    <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold bg-white/50 px-3 py-1.5 rounded-lg border border-zinc-200/50 backdrop-blur-sm">
                                                                        <Clock className="w-3.5 h-3.5 text-[#f05423]" />
                                                                        {session.title !== "Infosys Certified Course" && !session.title.toLowerCase().includes('certificate') && (
                                                                            new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' — ' + new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                                        )}
                                                                        {(session.title === "Infosys Certified Course" || session.title.toLowerCase().includes('certificate')) && (
                                                                            <span className="opacity-80">{session.isCertificateUploadOpen ? "Submission Window Open" : "Submission Window Closed"}</span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                <p className="text-zinc-500 text-sm font-medium line-clamp-1 max-w-sm">{session.description}</p>
                                                            </div>

                                                            {/* Course Assessment Link - Handler for Assessment Days */}
                                                            {(session.title.includes("Assessment Day") || (days.find(d => d._id === selectedDay)?.title || "").includes("Assessment Day") || session.title.includes("Customization, Debugging & Wrap-up")) && (
                                                                <div className="mt-6 p-4 rounded-xl bg-indigo-50 border border-indigo-100 space-y-3">
                                                                    <div className="flex items-center justify-between">
                                                                        <div>
                                                                            <h4 className="text-sm font-bold text-indigo-900">Course Assessment</h4>
                                                                            <p className="text-[10px] text-indigo-600 font-medium mt-0.5">
                                                                                {session.title.includes("Customization")
                                                                                    ? "Complete N8N assessment after marking attendance."
                                                                                    : "Complete the assessment form before uploading your certificate."}
                                                                            </p>
                                                                        </div>

                                                                        {/* Only show button if attendance is marked OR if it's not the specific N8N session that requires it */}
                                                                        {(!session.title.includes("Customization") || session.hasAttendance) ? (
                                                                            <a
                                                                                href={(session.title.includes("Day 3") || (days.find(d => d._id === selectedDay)?.title || "").includes("Day 3") || days.find(d => d._id === selectedDay)?.dayNumber === 3 || days.find(d => d._id === selectedDay)?.dayNumber === '3')
                                                                                    ? "https://docs.google.com/forms/d/e/1FAIpQLScJjAnnhpx1BI6XjA77bKiqAFGHmNgrhYegP_fOIOB3jnfXUg/viewform?usp=dialog"
                                                                                    : (session.title.includes("Day 6") || (days.find(d => d._id === selectedDay)?.title || "").includes("Day 6") || days.find(d => d._id === selectedDay)?.dayNumber === 6 || days.find(d => d._id === selectedDay)?.dayNumber === '6')
                                                                                        ? "https://docs.google.com/forms/d/e/1FAIpQLSf_6XdpLM7pOjp6Pbq68RWSIdInx_RUqulKzZZQ4rDxfcnxTA/viewform?usp=dialog"
                                                                                        : (session.title.includes("Day 7") || (days.find(d => d._id === selectedDay)?.title || "").includes("Day 7") || days.find(d => d._id === selectedDay)?.dayNumber === 7 || days.find(d => d._id === selectedDay)?.dayNumber === '7')
                                                                                            ? "https://docs.google.com/forms/d/e/1FAIpQLSc1gq6CSg-1-nLKNlcDzGHDMixLi5PZTn5CI_LPUz4XsNjHxg/viewform?usp=header"
                                                                                            : (session.title.includes("Customization") || (days.find(d => d._id === selectedDay)?.title || "").includes("Day 8"))
                                                                                                ? "https://docs.google.com/forms/d/e/1FAIpQLSdO74i2TwnCNFObqrxIb8_wd4UldEcTvb5I8uL46d9qM-wHhg/viewform?usp=header"
                                                                                                : undefined
                                                                                }
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors shadow-sm"
                                                                            >
                                                                                Open Form
                                                                                <ExternalLink className="w-3 h-3" />
                                                                            </a>
                                                                        ) : (
                                                                            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-400 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-zinc-200 cursor-not-allowed">
                                                                                <Lock className="w-3 h-3" />
                                                                                Locked
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {session.title.includes("Customization") && !session.hasAttendance && (
                                                                        <div className="flex items-center gap-2 text-amber-600 text-[10px] font-bold bg-white/50 px-2 py-1.5 rounded-md border border-amber-100 w-fit">
                                                                            <AlertCircle className="w-3 h-3" />
                                                                            Mark attendance to unlock N8N assessment.
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Certificate Upload Section - ONLY for Infosys Certified Course */}
                                                            {session.title === "Infosys Certified Course" && session.isCertificateUploadOpen && (
                                                                <div className="mt-6 pt-6 border-t border-zinc-100/50 space-y-4">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
                                                                            <FileText className="w-4 h-4 text-emerald-500" />
                                                                            {session.assignmentsSubmitted?.includes('Certificate') ? 'Certification Status' : 'Upload Certification'}
                                                                        </div>
                                                                    </div>

                                                                    {/* Success Status Banner - ONLY shown when NOT in redo mode */}
                                                                    {session.assignmentsSubmitted?.includes('Certificate') && !redoActive[session._id] && (
                                                                        <div className="bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/10 backdrop-blur-sm animate-in fade-in duration-300">
                                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="size-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 shadow-sm ring-1 ring-emerald-500/20">
                                                                                        <CheckCircle className="w-5 h-5" />
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-sm font-bold text-emerald-700 uppercase tracking-wide">
                                                                                            SUCCESSFULLY SUBMITTED
                                                                                        </p>
                                                                                        <p className="text-[11px] font-medium text-emerald-600/80">
                                                                                            Your certificate Drive link has been recorded.
                                                                                        </p>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="text-right hidden sm:block">
                                                                                        <p className="text-[9px] font-black text-emerald-600/50 uppercase tracking-widest">Update Limit</p>
                                                                                        <p className="text-[10px] font-bold text-emerald-700">
                                                                                            Used: {session.submissionDetails?.find(d => d.title === 'Certificate')?.updateCount || 0}/1
                                                                                        </p>
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={() => setRedoActive({ ...redoActive, [session._id]: true })}
                                                                                        disabled={session.submissionDetails?.find(d => d.title === 'Certificate')?.updateCount >= 1}
                                                                                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-30 disabled:cursor-not-allowed group"
                                                                                    >
                                                                                        <Send className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                                                                        Resubmit Link
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                            <div className="mt-4 pt-3 border-t border-emerald-500/10 flex items-center justify-between">
                                                                                <p className="text-[10px] text-zinc-500 font-medium italic opacity-80">
                                                                                    * Note: Your certificate link can be updated anytime before the deadline.
                                                                                </p>
                                                                                <div className="sm:hidden text-[9px] font-bold text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded-full">
                                                                                    Used: {session.submissionDetails?.find(d => d.title === 'Certificate')?.updateCount || 0}/1
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* URL Provider Box - ONLY if NOT submitted OR redo mode is ACTIVE */}
                                                                    {(!session.assignmentsSubmitted?.includes('Certificate') || redoActive[session._id]) && (
                                                                        <div className="bg-white/40 p-4 rounded-xl border border-white/60 backdrop-blur-sm shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                                                                            {/* Infosys Direct Link Row */}
                                                                            <div className="mb-6 p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="size-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                                                                                        <ExternalLink className="w-5 h-5" />
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-xs font-bold text-indigo-900">Earn your Infosys Certificate</p>
                                                                                        <p className="text-[10px] text-indigo-600 font-medium">Complete the course on Springboard first</p>
                                                                                    </div>
                                                                                </div>
                                                                                <a
                                                                                    href="https://infyspringboard.onwingspan.com/web/en/app/toc/lex_auth_014449374745780224228/overview"
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="px-6 py-2 bg-white border border-indigo-200 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-indigo-50 transition-all shadow-sm flex items-center gap-2"
                                                                                >
                                                                                    Access Infosys Portal
                                                                                </a>
                                                                            </div>

                                                                            {/* Deadline Banner */}
                                                                            <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3">
                                                                                <Clock className="w-4 h-4 text-red-500" />
                                                                                <p className="text-[10px] sm:text-xs font-black text-red-600 uppercase tracking-widest">
                                                                                    Submission Deadline: February 19, 2026
                                                                                </p>
                                                                            </div>

                                                                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                                                                <div className="relative flex-1 w-full">
                                                                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                                                                                    <input
                                                                                        type="url"
                                                                                        placeholder="Paste Google Drive Link here..."
                                                                                        value={assignmentData[`${session._id}-Certificate`] || ''}
                                                                                        onChange={(e) => handleAssignmentChange(session._id, 'Certificate', e.target.value)}
                                                                                        className="w-full pl-9 pr-4 py-2 bg-white/50 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-[#f05423]/20 focus:border-[#f05423] outline-none transition-all placeholder:text-zinc-400 font-medium"
                                                                                    />
                                                                                </div>
                                                                                {/* Submit/Update Button */}
                                                                                <button
                                                                                    onClick={() => handleAssignmentSubmit(session, { title: 'Certificate', type: 'certificate' })}
                                                                                    disabled={(session.submissionDetails?.find(d => d.title === 'Certificate')?.updateCount >= 1)}
                                                                                    className="w-full sm:w-auto px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                                                                                >
                                                                                    <Send className="w-3 h-3" />
                                                                                    {session.assignmentsSubmitted?.includes('Certificate') ? 'Update Link' : 'Submit Link'}
                                                                                </button>
                                                                            </div>

                                                                            {/* Warning Message Box */}
                                                                            <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-3">
                                                                                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                                                                <div className="space-y-1">
                                                                                    <p className="text-[10px] font-bold text-amber-800 uppercase tracking-tight">Submission Guidelines</p>
                                                                                    <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                                                                                        You can resubmit your link a maximum of <span className="font-bold underline">1 time</span>.
                                                                                        {session.submissionDetails?.find(d => d.title === 'Certificate') && (
                                                                                            <span className="ml-1 text-[#f05423] font-bold">
                                                                                                Used: {session.submissionDetails.find(d => d.title === 'Certificate').updateCount}/1
                                                                                            </span>
                                                                                        )}
                                                                                    </p>
                                                                                </div>
                                                                            </div>

                                                                            <p className="text-[10px] text-zinc-700 mt-4 font-medium flex items-center gap-2">
                                                                                <span className="text-[#f05423] font-black">!</span>
                                                                                <span>Ensure your Google Drive link is set to <span className="text-emerald-600 font-bold">"Anyone with the link"</span></span>
                                                                            </p>
                                                                            <p className="text-[9px] text-red-500 mt-1 font-bold italic">
                                                                                * Info: You can update your certificate link only once.
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="shrink-0">
                                                            {session.title.toLowerCase().includes('assessment') ? (
                                                                <div className="flex flex-col items-end gap-3">
                                                                    {!session.hasAttendance ? (
                                                                        session.attendanceStatus === 'closed' ? (
                                                                            <div className="flex flex-col items-end gap-2 text-right">
                                                                                <div className="px-6 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 backdrop-blur-sm">
                                                                                    <X className="w-3 h-3" />
                                                                                    Absent
                                                                                </div>
                                                                                <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter bg-white/40 px-3 py-1 rounded-lg border border-white/60 backdrop-blur-sm">
                                                                                    Attendance Window Closed
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex flex-col items-end gap-3">
                                                                                <div className="px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 text-[10px] font-bold uppercase tracking-wide flex items-center gap-2 backdrop-blur-sm border-dashed">
                                                                                    <AlertCircle className="w-3 h-3" />
                                                                                    Mark attendance to unlock assessment window
                                                                                </div>
                                                                                {session.isAttendanceActive ? (
                                                                                    <button
                                                                                        onClick={() => openCamera(session)}
                                                                                        className="px-6 py-2.5 sm:px-8 sm:py-3 rounded-2xl bg-[#f05423] hover:bg-[#ff9d00] text-white text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-lg shadow-[#f05423]/20 transition-all flex items-center gap-2 active:scale-95"
                                                                                    >
                                                                                        <Camera className="w-4 h-4" />
                                                                                        Authenticate
                                                                                    </button>
                                                                                ) : (
                                                                                    <div className="px-6 py-3 rounded-2xl bg-white/40 border border-white/60 text-zinc-600 text-xs font-black uppercase tracking-widest flex items-center gap-2.5 backdrop-blur-sm shadow-sm">
                                                                                        <Lock className="w-4 h-4" />
                                                                                        Attendance Not Started
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )
                                                                    ) : (
                                                                        <div className="flex flex-col items-end gap-3">
                                                                            <div className="px-6 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2.5 backdrop-blur-sm shadow-sm">
                                                                                <CheckCircle className="w-4 h-4" />
                                                                                Attendance Verified
                                                                            </div>
                                                                            <button
                                                                                onClick={() => {
                                                                                    if (session.assignmentsSubmitted?.length >= 5) {
                                                                                        navigate(`/assessment/${session._id}`);
                                                                                    } else {
                                                                                        navigate(`/assessment/${session._id}`);
                                                                                    }
                                                                                }}
                                                                                className="px-6 py-3 sm:px-8 sm:py-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-700 text-white text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-xl shadow-zinc-200/50 transition-all flex items-center gap-2 active:scale-95 group"
                                                                            >
                                                                                {session.assignmentsSubmitted?.some(title => title.toLowerCase().includes('assessment')) ? (
                                                                                    <>
                                                                                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                                                        Assessment Completed
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <FileText className="w-4 h-4 group-hover:rotate-12 transition-transform text-[#f05423]" />
                                                                                        Start Assessment
                                                                                    </>
                                                                                )}
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : session.title === "Infosys Certified Course" ? (
                                                                <>
                                                                    {session.assignmentsSubmitted?.includes('Certificate') ? (
                                                                        <div className="px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-black uppercase tracking-widest flex items-center gap-2.5 backdrop-blur-sm shadow-sm">
                                                                            <CheckCircle className="w-4 h-4" />
                                                                            Successfully Uploaded
                                                                        </div>
                                                                    ) : session.isCertificateUploadOpen ? (
                                                                        <div className="px-6 py-3 rounded-2xl bg-[#f05423]/10 border border-[#f05423]/20 text-[#f05423] text-xs font-black uppercase tracking-widest flex items-center gap-2.5 backdrop-blur-sm shadow-sm animate-pulse ring-2 ring-[#f05423]/20">
                                                                            <Upload className="w-4 h-4" />
                                                                            Upload your certificate now
                                                                        </div>
                                                                    ) : (
                                                                        <div className="px-6 py-3 rounded-2xl bg-white/40 border border-white/60 text-zinc-500 text-xs font-black uppercase tracking-widest flex items-center gap-2.5 backdrop-blur-sm shadow-sm text-center">
                                                                            <Lock className="w-4 h-4" />
                                                                            Uploading window is closed now! (Deadline: Feb 19, 2026)
                                                                        </div>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    {session.hasAttendance ? (
                                                                        <div className="px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-black uppercase tracking-widest flex items-center gap-2.5 backdrop-blur-sm shadow-sm">
                                                                            <CheckCircle className="w-4 h-4" />
                                                                            Attendance Verified
                                                                        </div>
                                                                    ) : session.type === 'BREAK' ? (
                                                                        <div className="px-6 py-3 rounded-2xl bg-white/40 text-zinc-700 border border-white/60 text-xs font-black uppercase tracking-widest flex items-center gap-2.5 backdrop-blur-sm shadow-sm">
                                                                            Break Period
                                                                        </div>
                                                                    ) : session.isAttendanceActive ? (
                                                                        <button
                                                                            onClick={() => openCamera(session)}
                                                                            className="px-6 py-3 sm:px-8 sm:py-4 rounded-2xl bg-[#f05423] hover:bg-[#ff9d00] text-white text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-xl shadow-[#f05423]/20 transition-all flex items-center gap-2 active:scale-95 hover:scale-105"
                                                                        >
                                                                            <Camera className="w-4 h-4" />
                                                                            Authenticate
                                                                        </button>
                                                                    ) : (session.attendanceStatus === 'closed' && session.attendanceEndTime && new Date(session.attendanceEndTime) < new Date()) ? (
                                                                        <div className="flex flex-col items-end gap-2">
                                                                            <div className="px-6 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 backdrop-blur-sm">
                                                                                <X className="w-3 h-3" />
                                                                                Absent
                                                                            </div>
                                                                            <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter bg-white/40 px-3 py-1 rounded-lg border border-white/60 backdrop-blur-sm">
                                                                                Attendance Window Closed
                                                                            </div>
                                                                        </div>
                                                                    ) : session.attendanceStatus === 'not_started' ? (
                                                                        <div className="px-6 py-3 rounded-2xl bg-white/40 border border-white/60 text-zinc-600 text-xs font-black uppercase tracking-widest flex items-center gap-2.5 backdrop-blur-sm shadow-sm">
                                                                            <Lock className="w-4 h-4" />
                                                                            Attendance Not Started
                                                                        </div>
                                                                    ) : (
                                                                        <div className="px-6 py-3 rounded-2xl bg-white/40 border border-white/60 text-zinc-600 text-xs font-black uppercase tracking-widest flex items-center gap-2.5 backdrop-blur-sm shadow-sm">
                                                                            <Lock className="w-4 h-4" />
                                                                            Attendance Locked
                                                                        </div>
                                                                    )}
                                                                </>
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
                </main >

                {/* MOBILE NAV PLACEHOLDER / FOOTER */}
                < footer className="py-10 border-t border-zinc-200/50 text-center bg-white/50 backdrop-blur-sm" >
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Buildmode 2026 Bootcamp developed by E-nexus tech member.</p>
                </footer >
            </div >

            {/* Warning Modal */}
            < AnimatePresence >
                {showWarning && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-[#f05423]" />

                            <div className="flex flex-col items-center text-center space-y-6">
                                <div className="size-16 rounded-full bg-red-100 flex items-center justify-center text-red-500 mb-2">
                                    <AlertCircle className="w-8 h-8" />
                                </div>

                                <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">
                                    Attendance Protocol
                                </h3>

                                <div className="space-y-4 text-sm text-zinc-600 font-medium leading-relaxed">
                                    <p className="p-4 bg-red-50 rounded-2xl border border-red-100 text-red-700">
                                        Do not mark attendance without <strong>proper dress code</strong> or showing a <strong>black screen</strong>.
                                    </p>
                                    <p>
                                        Attendance must be marked following proper guidelines. Each entry is <strong>verified individually</strong> by administrators.
                                    </p>
                                </div>

                                <button
                                    onClick={handleProceedToCamera}
                                    disabled={warningTimerSeconds > 0}
                                    className="w-full py-4 rounded-xl bg-[#f05423] hover:bg-[#ff9d00] text-white font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#f05423]/20"
                                >
                                    {warningTimerSeconds > 0 ? (
                                        <>
                                            <Clock className="w-4 h-4 animate-spin" />
                                            Reading Guidelines ({warningTimerSeconds}s)
                                        </>
                                    ) : (
                                        <>
                                            <Camera className="w-4 h-4" />
                                            I Understand, Proceed
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )
                }
            </AnimatePresence >

            {/* Camera Overlay */}
            < AnimatePresence >
                {showCamera && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90">
                        <CameraCapture
                            onCapture={handlePhotoCapture}
                            onCancel={() => setShowCamera(false)}
                        />
                    </div>
                )
                }
            </AnimatePresence >

            {/* MANDATORY LAPTOP NOTICE */}
            <AnimatePresence>
                {showLaptopNotice && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative"
                        >
                            <div className="bg-[#f05423] p-6 text-white relative overflow-hidden">
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/20 rounded-full blur-xl" />
                                <div className="relative z-10 flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                        <AlertCircle className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg uppercase tracking-wider">Crucial Update</h3>
                                        <p className="text-white/80 text-xs font-bold uppercase tracking-widest">Day 8 Preparation</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 sm:p-8 space-y-6">
                                <div className="space-y-4 text-center">
                                    <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100 shadow-inner">
                                        <p className="text-zinc-900 font-bold text-lg sm:text-xl leading-relaxed">
                                            "A laptop is mandatory for Day 8 (21.02.2026). Please ensure you bring your device."
                                        </p>
                                    </div>
                                    <p className="text-[#f05423] text-sm font-bold uppercase tracking-widest animate-pulse">
                                        Mandatory Requirement
                                    </p>
                                </div>

                                <button
                                    onClick={() => {
                                        setShowLaptopNotice(false);
                                        sessionStorage.setItem('laptopNoticeShown', 'true');
                                    }}
                                    disabled={noticeTimer > 0}
                                    className="w-full py-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-zinc-200/50"
                                >
                                    {noticeTimer > 0 ? (
                                        <>
                                            <Clock className="w-4 h-4 animate-spin" />
                                            Read Carefully ({noticeTimer}s)
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            I Acknowledge
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
}

export default StudentDashboard;
