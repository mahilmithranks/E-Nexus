import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Calendar, Clock, BarChart2, Download, LogOut,
    CheckCircle, AlertCircle, XCircle, Lock, Unlock, Play, Square,
    FileText, ChevronLeft, ChevronRight, RefreshCw
} from 'lucide-react';
import api from '../services/api';
import { getUser, clearAuth } from '../utils/auth';
import Timer from './Timer';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';
// import './AdminDashboard.css'; // Removed in favor of Tailwind

// Internal Debounced Input Component to fix INP (Input Lag)
const DebouncedInput = ({ value: initialValue, onChange, delay = 300, ...props }) => {
    const [value, setValue] = useState(initialValue);

    React.useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    React.useEffect(() => {
        const handler = setTimeout(() => {
            onChange(value);
        }, delay);

        return () => clearTimeout(handler);
    }, [value, delay]); // Intentionally omitting onChange to avoid reset on parent re-renders

    return (
        <input
            {...props}
            value={value}
            onChange={(e) => setValue(e.target.value)}
        />
    );
};

// Admin Dashboard Component
function AdminDashboard() {
    const [days, setDays] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [progressData, setProgressData] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, pages: 1, currentPage: 1, limit: 20 });
    const [onlineUsers, setOnlineUsers] = useState(0);
    const [totalStudentsCount, setTotalStudentsCount] = useState(0);
    const [selectedSessionDay, setSelectedSessionDay] = useState(null);
    const [loading, setLoading] = useState(true);
    const [progressLoading, setProgressLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('days');
    const [searchTerm, setSearchTerm] = useState('');
    const [exportFilters, setExportFilters] = useState({ dayId: '', sessionId: '' });
    const [showPhotoModal, setShowPhotoModal] = useState({ show: false, url: '', student: '' });
    const [showOverrideModal, setShowOverrideModal] = useState({
        show: false,
        student: null,
        sessionId: null,
        comment: ''
    });

    const user = getUser();
    const navigate = useNavigate();

    // Default selectedSessionDay to the first OPEN day
    useEffect(() => {
        if (days.length > 0 && !selectedSessionDay) {
            const openDay = days.find(d => d.status === 'OPEN');
            setSelectedSessionDay(openDay ? openDay._id : days[0]._id);
        }
    }, [days]);

    // Debounce search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (activeTab === 'attendance' || activeTab === 'assignments') {
                fetchProgress(1, searchTerm);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    // Auto-close polling: Check every 30s for expired sessions
    useEffect(() => {
        const checkAndCloseExpiredSessions = async () => {
            try {
                const now = new Date();
                const expiredSessions = sessions.filter(s =>
                    s.attendanceOpen &&
                    s.attendanceEndTime &&
                    new Date(s.attendanceEndTime) < now
                );

                for (const session of expiredSessions) {
                    try {
                        await api.post(`/admin/sessions/${session._id}/attendance/stop`);
                        toast(`Auto-closed attendance for: ${session.title}`, {
                            icon: '🕒',
                        });
                    } catch (err) {
                        if (err.response?.status === 404) {
                            console.warn('Session not found during auto-close, refreshing list...');
                            fetchData();
                            break;
                        }
                        throw err;
                    }
                }

                if (expiredSessions.length > 0) {
                    fetchData(); // Refresh data after auto-close
                }
            } catch (error) {
                console.error('Auto-close error:', error);
            }
        };

        // Run check every 30 seconds
        const interval = setInterval(checkAndCloseExpiredSessions, 15000);

        // Cleanup on unmount
        return () => clearInterval(interval);
    }, [sessions]); // Re-run when sessions change

    useEffect(() => {
        fetchInitialData();
        // Auto-refresh stats every 15 seconds to keep "Live Sessions" accurate
        const interval = setInterval(fetchInitialData, 15000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (activeTab === 'attendance' || activeTab === 'assignments') {
            fetchProgress(1, searchTerm);
        }
    }, [activeTab, searchTerm]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [daysRes, sessionsRes, statsRes] = await Promise.all([
                api.get('/admin/days'),
                api.get('/admin/sessions'),
                api.get('/admin/stats')
            ]);

            setDays(daysRes.data);
            setSessions(sessionsRes.data);
            setOnlineUsers(statsRes.data.onlineUsers);
            setTotalStudentsCount(statsRes.data.totalStudents);

            // Fetch progress initially if we are already on a progress tab
            if (activeTab === 'attendance' || activeTab === 'assignments') {
                await fetchProgress(1, searchTerm);
            }
        } catch (error) {
            console.error('Error fetching initial data:', error);
            if (error.response) {
                console.error('Server Response Data:', error.response.data);
                toast.error(`Error: ${error.response.data.message || 'Failed to load dashboard data'}`);
            } else {
                toast.error('Failed to load dashboard data');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchProgress = async (page = 1, search = '') => {
        try {
            setProgressLoading(true);
            const res = await api.get(`/admin/progress?page=${page}&limit=20&search=${search}`);
            setProgressData(res.data.students);
            setPagination(res.data.pagination);
        } catch (error) {
            console.error('Error fetching progress:', error);
            toast.error('Failed to load progress data');
        } finally {
            setProgressLoading(false);
        }
    };

    // Generic refresh to stay backward compatible with existing calls
    const fetchData = async () => {
        try {
            setLoading(true);
            const [daysRes, sessionsRes] = await Promise.all([
                api.get('/admin/days'),
                api.get('/admin/sessions')
            ]);

            setDays(daysRes.data);
            setSessions(sessionsRes.data);

            // Only refresh progress if we are on a tab that shows it
            if (activeTab === 'attendance' || activeTab === 'assignments') {
                await fetchProgress(pagination.currentPage, searchTerm);
            }
            toast.success('System data synchronized', { icon: '🔄' });
        } catch (error) {
            console.error('Error refreshing data:', error);
            toast.error('Sync failed. Please check connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        clearAuth();
        window.location.href = '/';
    };

    const updateDayStatus = async (dayId, status) => {
        try {
            await api.put(`/admin/days/${dayId}/status`, { status });
            fetchData();
        } catch (error) {
            if (error.response?.status === 404) {
                toast.error('Data state is stale. Refreshing dashboard...');
                fetchData();
            } else {
                toast.error('Error updating day status: ' + (error.response?.data?.message || error.message));
            }
        }
    };

    const startAttendance = async (sessionId) => {
        // Optimistic update
        const originalSessions = [...sessions];
        setSessions(prev => prev.map(s => s._id === sessionId ?
            { ...s, attendanceOpen: true, attendanceEndTime: new Date(Date.now() + 10 * 60 * 1000).toISOString() } : s
        ));

        try {
            const response = await api.post(`/admin/sessions/${sessionId}/attendance/start`);
            toast.success(`Attendance started! Window closes at ${new Date(response.data.windowEndsAt).toLocaleTimeString()}`);
            // Sync with actual server time/data
            fetchData();
        } catch (error) {
            setSessions(originalSessions);
            toast.error('Error starting attendance: ' + (error.response?.data?.message || error.message));
        }
    };

    const stopAttendance = async (sessionId) => {
        // Optimistic update
        const originalSessions = [...sessions];
        setSessions(prev => prev.map(s => s._id === sessionId ? { ...s, attendanceOpen: false } : s));

        try {
            await api.post(`/admin/sessions/${sessionId}/attendance/stop`);
            toast.success('Attendance stopped successfully');
            fetchData();
        } catch (error) {
            setSessions(originalSessions);
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
            let url = '/admin/export/attendance?';
            if (exportFilters.sessionId) {
                url += `sessionId=${exportFilters.sessionId}`;
            } else if (exportFilters.dayId) {
                url += `dayId=${exportFilters.dayId}`;
            }

            const response = await api.get(url, { responseType: 'blob' });
            // Explicitly set the MIME type for Excel
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;

            // Generate descriptive filename
            let filename = 'attendance_report';
            if (exportFilters.sessionId) {
                const session = sessions.find(s => s._id === exportFilters.sessionId);
                filename = `attendance_${session ? session.title.replace(/\s+/g, '_') : 'session'}`;
            } else if (exportFilters.dayId) {
                const day = days.find(d => d._id === exportFilters.dayId);
                filename = `attendance_day_${day ? day.dayNumber : 'filtered'}`;
            }

            link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
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
            let url = '/admin/export/assignments?';
            if (exportFilters.sessionId) {
                url += `sessionId=${exportFilters.sessionId}`;
            } else if (exportFilters.dayId) {
                url += `dayId=${exportFilters.dayId}`;
            }

            const response = await api.get(url, { responseType: 'blob' });
            // Explicitly set the MIME type for Excel
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;

            // Generate descriptive filename
            let filename = 'assignment_report';
            if (exportFilters.sessionId) {
                const session = sessions.find(s => s._id === exportFilters.sessionId);
                filename = `assignments_${session ? session.title.replace(/\s+/g, '_') : 'session'}`;
            } else if (exportFilters.dayId) {
                const day = days.find(d => d._id === exportFilters.dayId);
                filename = `assignments_day_${day ? day.dayNumber : 'filtered'}`;
            }

            link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Export error:', error);
            handleExportError(error, 'assignments');
        }
    };

    const exportCertificates = async () => {
        try {
            let url = '/admin/export/certificates?';
            if (exportFilters.sessionId) {
                url += `sessionId=${exportFilters.sessionId}`;
            } else if (exportFilters.dayId) {
                url += `dayId=${exportFilters.dayId}`;
            }

            const response = await api.get(url, { responseType: 'blob' });
            // Explicitly set the MIME type for Excel
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;

            // Generate descriptive filename
            let filename = 'certificate_report';
            if (exportFilters.sessionId) {
                const session = sessions.find(s => s._id === exportFilters.sessionId);
                filename = `certificates_${session ? session.title.replace(/\s+/g, '_') : 'session'}`;
            } else if (exportFilters.dayId) {
                const day = days.find(d => d._id === exportFilters.dayId);
                filename = `certificates_day_${day ? day.dayNumber : 'filtered'}`;
            }

            link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Export error:', error);
            handleExportError(error, 'certificates');
        }
    };

    const handleExportError = async (error, type) => {
        let errorMessage = `Error exporting ${type}`;
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
    };

    const PaginationControls = () => {
        if (pagination.pages <= 1) return null;

        return (
            <div className="flex items-center justify-center gap-4 mt-8">
                <button
                    onClick={() => fetchProgress(pagination.currentPage - 1, searchTerm)}
                    disabled={pagination.currentPage === 1 || progressLoading}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30 transition-all hover:bg-white/10"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="text-white/60 text-sm font-medium">
                    Page <span className="text-white">{pagination.currentPage}</span> of {pagination.pages}
                </div>
                <button
                    onClick={() => fetchProgress(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.pages || progressLoading}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30 transition-all hover:bg-white/10"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const toggleCertificateUpload = async (sessionId, isOpen) => {
        try {
            await api.put(`/admin/sessions/${sessionId}/certificate-upload`, { isOpen });
            toast.success(`Certificate uploads ${isOpen ? 'opened' : 'closed'} successfully`);
            fetchData();
        } catch (error) {
            toast.error('Error updating certificate upload status: ' + (error.response?.data?.message || error.message));
        }
    };

    const tabs = [
        { id: 'days', label: 'Day Control', icon: Calendar },
        { id: 'sessions', label: 'Sessions', icon: Clock },
        { id: 'attendance', label: 'Attendance', icon: Users },
        { id: 'certificates', label: 'Certificate', icon: FileText },
        { id: 'export', label: 'Exports', icon: Download },
    ];

    // Helper function to get the correct photo URL
    const getPhotoUrl = (photoPath) => {
        if (!photoPath) return null;

        // If it's already a full URL (Cloudinary), return as is
        if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
            return photoPath;
        }

        const cleanPath = photoPath.startsWith('/') ? photoPath.substring(1) : photoPath;
        return `/${cleanPath}`;
    };

    return (
        <div className="min-h-screen w-full bg-[#0a0a0a] text-zinc-400 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
            {/* Ambient Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-indigo-600/10 blur-[120px]" />
                <div className="absolute bottom-[-5%] left-[-5%] w-[30vw] h-[30vw] rounded-full bg-purple-600/10 blur-[100px]" />
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row h-screen overflow-hidden">
                {/* MODERN SIDEBAR - Hidden on mobile, shown on desktop */}
                <aside className="hidden lg:flex w-72 border-r border-white/5 bg-[#0d0d0d] flex-col shrink-0">
                    <div className="p-8">
                        <div className="mb-10">
                            <span className="text-xl font-bold text-white tracking-tight">Workshop Management</span>
                        </div>

                        <nav className="space-y-1.5">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                                        activeTab === tab.id
                                            ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                            : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300 border border-transparent"
                                    )}
                                >
                                    <tab.icon className={cn(
                                        "w-4 h-4 transition-colors",
                                        activeTab === tab.id ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"
                                    )} />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="mt-auto p-6 border-t border-white/5 space-y-4">
                        {user.role === 'admin' && (
                            <button
                                onClick={() => navigate('/student')}
                                className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Switch to Student View
                            </button>
                        )}
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </aside>

                {/* MAIN CONTENT AREA */}
                <main className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a] overflow-hidden">
                    {/* Header */}
                    <header className="h-16 lg:h-20 border-b border-white/5 px-3 lg:px-8 flex items-center justify-between bg-[#0a0a0a]/50 backdrop-blur-md sticky top-0 z-30">
                        <div className="flex items-center gap-2 lg:gap-6 overflow-hidden min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-4 min-w-0">
                                <img src="/univ-logo.png" alt="University Logo" className="h-7 sm:h-8 lg:h-11 w-auto object-contain shrink-0" />
                                <span className="text-zinc-600 font-light text-sm lg:text-lg hidden sm:inline">×</span>
                                <img src="/enexus-white-logo.png" alt="E-Nexus Logo" className="h-9 sm:h-10 lg:h-14 w-auto object-contain shrink-0" />
                            </div>

                            <div className="h-6 lg:h-8 w-px bg-white/10 hidden md:block" />

                            <div className="hidden sm:flex items-center gap-2 lg:gap-4 min-w-0">
                                <h2 className="text-sm lg:text-lg font-semibold text-white capitalize truncate">
                                    {tabs.find(t => t.id === activeTab)?.label}
                                </h2>
                                <div className="h-3 lg:h-4 w-px bg-white/10 hidden md:block" />
                                <div className="hidden md:flex items-center gap-2 text-[10px] lg:text-xs text-zinc-500">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    System Online
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 lg:gap-3">
                            <button
                                onClick={fetchData}
                                className="p-2 lg:p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-all"
                                title="Refresh Data"
                            >
                                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                            </button>
                            <div className="h-6 lg:h-8 w-px bg-white/10 mx-1" />
                            <div className="flex items-center gap-2 lg:gap-3">
                                <div className="text-right">
                                    <p className="text-[10px] sm:text-xs lg:text-sm font-medium text-white leading-none truncate max-w-[80px] sm:max-w-[120px] lg:max-w-none">{user.name}</p>
                                    <p className="text-[8px] sm:text-[9px] lg:text-[10px] text-zinc-500 font-bold uppercase mt-0.5 sm:mt-1 tracking-wider truncate">Super Admin</p>
                                </div>
                                <div className="size-7 sm:size-8 lg:size-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-[10px] sm:text-xs lg:text-sm font-bold ring-2 lg:ring-4 ring-black shrink-0">
                                    {user.name?.[0]}
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Mobile Tab Navigation */}
                    <div className="lg:hidden border-b border-white/5 bg-[#0d0d0d] overflow-x-auto">
                        <div className="flex gap-1 p-2 min-w-max">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                                        activeTab === tab.id
                                            ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                            : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300 border border-transparent"
                                    )}
                                >
                                    <tab.icon className="w-3.5 h-3.5" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Scroll Area */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8">
                        <div className="max-w-6xl mx-auto space-y-6 lg:space-y-8">
                            {/* Dashboard Heading for certain tabs */}
                            {activeTab !== 'attendance' && activeTab !== 'assignments' && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="mb-2"
                                >
                                    <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
                                        Dashboard <span className="text-indigo-500">Overview</span>
                                    </h1>
                                    <p className="text-zinc-500">Manage workshop days, sessions and system exports.</p>
                                </motion.div>
                            )}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-full"
                                >
                                    {/* Statistics Overview Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                                        {[
                                            { label: 'Total Schedule', value: `${days.length} Days`, icon: Calendar, color: 'indigo' },
                                            { label: 'Total Sessions', value: sessions.length, icon: Clock, color: 'blue' },
                                            { label: 'Live Sessions', value: sessions.filter(s => s.attendanceOpen).length, icon: Play, color: 'emerald' },
                                            { label: 'Total Students', value: totalStudentsCount || '0', icon: Users, color: 'purple' },
                                        ].map((stat, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="p-6 rounded-3xl bg-[#111111]/40 border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden"
                                            >
                                                <div className={cn(
                                                    "absolute -right-4 -top-4 size-24 blur-3xl opacity-10 group-hover:opacity-20 transition-opacity rounded-full",
                                                    stat.color === 'indigo' && "bg-indigo-500",
                                                    stat.color === 'blue' && "bg-blue-500",
                                                    stat.color === 'emerald' && "bg-emerald-500",
                                                    stat.color === 'purple' && "bg-purple-500",
                                                )} />
                                                <div className="flex items-center gap-4 relative z-10">
                                                    <div className={cn(
                                                        "size-12 rounded-2xl flex items-center justify-center",
                                                        stat.color === 'indigo' && "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
                                                        stat.color === 'blue' && "bg-blue-500/10 text-blue-400 border border-blue-500/20",
                                                        stat.color === 'emerald' && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                                                        stat.color === 'purple' && "bg-purple-500/10 text-purple-400 border border-purple-500/20",
                                                    )}>
                                                        <stat.icon className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">{stat.label}</div>
                                                        <div className="text-xl font-bold text-white">{stat.value}</div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {activeTab === 'days' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {days.map(day => (
                                                <div key={day._id} className={cn(
                                                    "group relative overflow-hidden p-6 rounded-2xl border transition-all duration-300",
                                                    day.status === 'OPEN'
                                                        ? "bg-[#111111] border-indigo-500/50 shadow-[0_0_40px_-15px_rgba(99,102,241,0.2)]"
                                                        : "bg-[#111111]/40 border-white/5 hover:border-white/10"
                                                )}>
                                                    <div className="relative z-10">
                                                        <div className="flex justify-between items-start mb-6">
                                                            <div className="space-y-1">
                                                                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Workshop Timeline</div>
                                                                <h3 className="text-2xl font-bold text-white leading-none">
                                                                    Day {day.dayNumber}
                                                                </h3>
                                                                {day.date && <p className="text-zinc-500 text-xs font-medium">{new Date(day.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
                                                            </div>
                                                            <div className={cn(
                                                                "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border",
                                                                day.status === 'OPEN' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                                                    day.status === 'LOCKED' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                                                        "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                                                            )}>
                                                                {day.status}
                                                            </div>
                                                        </div>

                                                        <p className="text-zinc-400 text-sm mb-8 line-clamp-1 font-medium">{day.title}</p>

                                                        <div className="grid grid-cols-3 gap-2">
                                                            <button
                                                                onClick={() => updateDayStatus(day._id, 'OPEN')}
                                                                disabled={day.status === 'OPEN'}
                                                                className="px-3 py-2.5 rounded-xl bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 text-[11px] font-bold border border-emerald-500/10 disabled:opacity-20 transition-all uppercase tracking-wide"
                                                            >
                                                                Activate
                                                            </button>
                                                            <button
                                                                onClick={() => updateDayStatus(day._id, 'CLOSED')}
                                                                disabled={day.status === 'CLOSED'}
                                                                className="px-3 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] text-zinc-400 text-[11px] font-bold border border-white/5 disabled:opacity-20 transition-all uppercase tracking-wide"
                                                            >
                                                                Finish
                                                            </button>
                                                            <button
                                                                onClick={() => updateDayStatus(day._id, 'LOCKED')}
                                                                disabled={day.status === 'LOCKED'}
                                                                className="px-3 py-2.5 rounded-xl bg-red-500/5 hover:bg-red-500/10 text-red-400 text-[11px] font-bold border border-red-500/10 disabled:opacity-20 transition-all uppercase tracking-wide"
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
                                            {/* Day Selector for Sessions */}
                                            <div className="flex flex-wrap gap-2 p-4 bg-white/[0.02] rounded-xl border border-white/5">
                                                <div className="w-full text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Filter by Day</div>
                                                {days.map(day => (
                                                    <button
                                                        key={day._id}
                                                        onClick={() => setSelectedSessionDay(day._id)}
                                                        className={cn(
                                                            "px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                                                            selectedSessionDay === day._id
                                                                ? "bg-blue-500 text-white border-blue-400 shadow-lg shadow-blue-500/20"
                                                                : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            Day {day.dayNumber}
                                                            {day.status === 'OPEN' && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="space-y-4">
                                                {sessions
                                                    .filter(session => !selectedSessionDay || session.dayId?._id === selectedSessionDay || session.dayId === selectedSessionDay)
                                                    .map(session => (
                                                        <div key={session._id} className="group relative overflow-hidden p-6 rounded-[2rem] bg-[#111111]/60 border border-white/5 hover:border-indigo-500/30 transition-all duration-500">
                                                            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                                                <div className="flex gap-6 max-w-2xl">
                                                                    <div className="size-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col items-center justify-center shrink-0">
                                                                        <div className="text-[10px] font-black text-indigo-400/60 uppercase leading-none mb-1">Session</div>
                                                                        <div className="text-xl font-bold text-white leading-none">
                                                                            {sessions.indexOf(session) + 1}
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <div className="flex flex-wrap items-center gap-3">
                                                                            <h3 className="text-2xl font-bold text-white tracking-tight">{session.title}</h3>
                                                                            <div className={cn(
                                                                                "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                                                                session.mode === 'OFFLINE'
                                                                                    ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                                                                    : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                                                            )}>
                                                                                {session.mode || 'ONLINE'}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-4 text-xs font-semibold">
                                                                            <div className="flex items-center gap-1.5 text-zinc-400 bg-white/[0.03] px-2.5 py-1.5 rounded-lg border border-white/5">
                                                                                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                                                                                {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                            </div>
                                                                            {session.attendanceOpen && (
                                                                                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/10 animate-pulse">
                                                                                    <div className="size-1.5 rounded-full bg-emerald-400" />
                                                                                    Live
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-zinc-500 text-sm max-w-lg leading-relaxed">{session.description}</p>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-3 shrink-0">
                                                                    {session.type === 'BREAK' ? (
                                                                        <div className="px-6 py-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 text-sm font-bold flex items-center gap-2 uppercase tracking-wide">
                                                                            <Clock className="w-4 h-4" /> Reserved for Break
                                                                        </div>
                                                                    ) : session.title === "Infosys Certified Course" ? (
                                                                        <button
                                                                            onClick={() => toggleCertificateUpload(session._id, !session.isCertificateUploadOpen)}
                                                                            className={cn(
                                                                                "px-6 py-3.5 rounded-[1.25rem] text-sm font-bold shadow-xl transition-all flex items-center gap-2 group/btn",
                                                                                session.isCertificateUploadOpen
                                                                                    ? "bg-white/[0.03] hover:bg-white/[0.06] text-zinc-400 border border-white/5"
                                                                                    : "bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/20"
                                                                            )}
                                                                        >
                                                                            {session.isCertificateUploadOpen ? (
                                                                                <>
                                                                                    <Square className="w-4 h-4" />
                                                                                    Close Uploads
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Play className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                                                                    Open Uploads
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    ) : (
                                                                        <>
                                                                            <button
                                                                                onClick={() => startAttendance(session._id)}
                                                                                disabled={session.attendanceOpen || session.dayId?.status !== 'OPEN'}
                                                                                className="px-8 py-3.5 rounded-[1.25rem] bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold shadow-xl shadow-indigo-500/20 disabled:opacity-20 transition-all flex items-center gap-2 group/btn"
                                                                            >
                                                                                <Play className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                                                                Open Attendance
                                                                            </button>
                                                                            <button
                                                                                onClick={() => stopAttendance(session._id)}
                                                                                disabled={!session.attendanceOpen}
                                                                                className="px-6 py-3.5 rounded-[1.25rem] bg-white/[0.03] hover:bg-white/[0.06] text-zinc-400 border border-white/5 text-sm font-bold disabled:opacity-20 transition-all flex items-center gap-2"
                                                                            >
                                                                                <Square className="w-4 h-4" />
                                                                                Close
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {false && session.attendanceOpen && session.attendanceEndTime && (
                                                                <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                                                                    {/* Timer removed */}
                                                                    <div className="text-indigo-400 font-mono text-xl font-bold bg-indigo-500/10 px-4 py-1.5 rounded-xl border border-indigo-500/20">
                                                                        {/* <Timer targetDate={session.attendanceEndTime} /> */}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                            </div>

                                            {/* Manual Override Toggle */}

                                        </div>
                                    )}

                                    {/* Attendance Tracking Tab */}
                                    {activeTab === 'attendance' && (
                                        <>
                                            <div className="mb-10 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                                                <div className="space-y-2">
                                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                                                        Real-time Monitoring
                                                    </div>
                                                    <h2 className="text-4xl font-bold text-white tracking-tight">Attendance Tracking</h2>
                                                    <p className="text-zinc-500 font-medium">Verified student logs with photographic evidence.</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="relative group">
                                                        <DebouncedInput
                                                            type="text"
                                                            placeholder="Target Student or Reg ID..."
                                                            value={searchTerm}
                                                            onChange={setSearchTerm}
                                                            className="w-full md:w-96 px-6 py-4 pl-12 rounded-2xl bg-[#111111] border border-white/5 text-white text-sm font-medium focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                                                        />
                                                        <Users className="w-5 h-5 text-zinc-600 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-400 transition-colors" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.02]">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left border-collapse">
                                                        <thead>
                                                            <tr className="bg-white/[0.03] border-b border-white/10">
                                                                <th className="p-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] w-14 text-center border-r border-white/5 sticky left-0 z-20 bg-[#0d0d0d]">#</th>
                                                                <th className="p-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] sticky left-14 bg-[#0d0d0d] z-20 min-w-[200px] border-r border-white/5">Student Information</th>
                                                                {sessions.map(s => (
                                                                    <th key={s._id} className="p-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] whitespace-nowrap text-center border-r border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                                                                        <div>{s.title}</div>
                                                                        <div className="text-[10px] text-indigo-400/50 font-bold mt-1 tracking-widest italic">Day {s.dayId?.dayNumber}</div>
                                                                    </th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-white/5">
                                                            {progressLoading ? (
                                                                <tr>
                                                                    <td colSpan={sessions.length + 1} className="p-8 text-center bg-black/20">
                                                                        <div className="flex flex-col items-center gap-3">
                                                                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                                                            <p className="text-white/40 text-sm">Loading students...</p>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ) : progressData.length === 0 ? (
                                                                <tr>
                                                                    <td colSpan={sessions.length + 1} className="p-8 text-center text-white/40 bg-black/20">
                                                                        No students found
                                                                    </td>
                                                                </tr>
                                                            ) : (
                                                                progressData.map((student, index) => (
                                                                    <tr key={student.registerNumber} className="hover:bg-white/[0.01] transition-colors group/row">
                                                                        <td className="p-5 text-center text-zinc-600 text-[10px] font-bold border-r border-white/5 bg-[#0d0d0d] sticky left-0 z-10 w-14">
                                                                            {(pagination.currentPage - 1) * pagination.limit + index + 1}
                                                                        </td>
                                                                        <td className="p-5 sticky left-14 bg-[#0d0d0d] z-10 border-r border-white/5">
                                                                            <div className="text-sm font-bold text-white group-hover/row:text-indigo-400 transition-colors">{student.name}</div>
                                                                            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">{student.registerNumber}</div>
                                                                        </td>
                                                                        {student.sessions.map(session => {
                                                                            const fullSession = sessions.find(s => s._id === session.sessionId);
                                                                            const isInfosys = fullSession?.title === "Infosys Certified Course";

                                                                            const hasAttendance = session.attendance?.status === 'PRESENT';
                                                                            const isOverride = session.attendance?.isOverride;
                                                                            const photoPath = session.attendance?.photoPath;
                                                                            const photoUrl = getPhotoUrl(photoPath);

                                                                            if (isInfosys) {
                                                                                return (
                                                                                    <td key={session.sessionId} className="p-4">
                                                                                        <div className="flex flex-col items-center gap-1">
                                                                                            <div className="text-zinc-700 font-bold text-xs">—</div>
                                                                                        </div>
                                                                                    </td>
                                                                                );
                                                                            }

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
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                            <PaginationControls />

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



                                    {activeTab === 'export' && (
                                        <div className="space-y-6">
                                            <div className="mb-6">
                                                <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">System Exports</h2>
                                                <p className="text-zinc-500 text-sm">Generate and download workshop reports in Microsoft Excel format.</p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                {/* Attendance Export */}
                                                <div className="p-10 rounded-[2.5rem] bg-[#111111]/80 border border-white/5 hover:border-indigo-500/20 transition-all group relative overflow-hidden">
                                                    <div className="absolute -right-12 -top-12 size-48 bg-indigo-500/10 blur-[100px] group-hover:bg-indigo-500/20 transition-all rounded-full" />

                                                    <div className="relative z-10 h-full flex flex-col">
                                                        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-8 text-indigo-400">
                                                            <Download className="w-8 h-8" />
                                                        </div>
                                                        <h3 className="text-3xl font-bold text-white mb-3">Attendance Report</h3>
                                                        <p className="text-zinc-500 mb-10 text-sm leading-relaxed max-w-sm">Securely generate complete student attendance logs with date and session filters.</p>

                                                        <div className="space-y-6 mb-12 flex-1">
                                                            <div className="space-y-2.5">
                                                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-1">Target Dimension</label>
                                                                <select
                                                                    value={exportFilters.dayId}
                                                                    onChange={(e) => setExportFilters({ dayId: e.target.value, sessionId: '' })}
                                                                    className="w-full px-6 py-5 rounded-[1.25rem] bg-[#0d0d0d] border border-white/10 text-white text-sm font-medium focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all appearance-none cursor-pointer"
                                                                >
                                                                    <option value="">All Days Combined</option>
                                                                    {days.map(d => (
                                                                        <option key={d._id} value={d._id}>Timeline: Day {d.dayNumber}</option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            <div className="space-y-2.5">
                                                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-1">Granularity</label>
                                                                <select
                                                                    value={exportFilters.sessionId}
                                                                    onChange={(e) => setExportFilters({ ...exportFilters, sessionId: e.target.value })}
                                                                    className="w-full px-6 py-5 rounded-[1.25rem] bg-[#0d0d0d] border border-white/10 text-white text-sm font-medium focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all appearance-none cursor-pointer"
                                                                >
                                                                    <option value="">Consolidated Sessions</option>
                                                                    {sessions
                                                                        .filter(s => !exportFilters.dayId || s.dayId?._id === exportFilters.dayId || s.dayId === exportFilters.dayId)
                                                                        .map(s => (
                                                                            <option key={s._id} value={s._id}>{s.title}</option>
                                                                        ))}
                                                                </select>
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={exportAttendance}
                                                            className="w-full py-5 rounded-[1.25rem] bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                                        >
                                                            <Download className="w-5 h-5" /> Export Data Assets
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Certificate Export */}
                                                <div className="p-10 rounded-[2.5rem] bg-[#111111]/80 border border-white/5 hover:border-emerald-500/20 transition-all group relative overflow-hidden">
                                                    <div className="absolute -right-12 -top-12 size-48 bg-emerald-500/10 blur-[100px] group-hover:bg-emerald-500/20 transition-all rounded-full" />

                                                    <div className="relative z-10 h-full flex flex-col">
                                                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-8 text-emerald-400">
                                                            <FileText className="w-8 h-8" />
                                                        </div>
                                                        <h3 className="text-3xl font-bold text-white mb-3">Certificates Report</h3>
                                                        <p className="text-zinc-500 mb-10 text-sm leading-relaxed max-w-sm">Download user certificates and metadata. This report includes links to uploaded certificate files.</p>

                                                        <div className="flex-1 min-h-[100px] flex items-center justify-center">
                                                            <div className="text-center space-y-2">
                                                                <div className="inline-block p-3 rounded-full bg-emerald-500/10 text-emerald-500 mb-2">
                                                                    <CheckCircle className="w-6 h-6" />
                                                                </div>
                                                                <p className="text-zinc-400 text-sm font-medium">Ready for Extraction</p>
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={exportCertificates}
                                                            className="w-full py-5 rounded-[1.25rem] bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                                        >
                                                            <Download className="w-5 h-5" /> Export Certificates
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'certificates' && (
                                        <div className="space-y-6">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                                <div className="space-y-2">
                                                    <h2 className="text-3xl font-bold text-white tracking-tight">Certificate Management</h2>
                                                    <p className="text-zinc-500">Control certificate upload windows and manage submissions.</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-6">
                                                {sessions
                                                    .filter(s => s.title === "Infosys Certified Course")
                                                    .map(session => (
                                                        <div key={session._id} className="group relative overflow-hidden p-8 rounded-[2rem] bg-[#111111]/60 border border-white/5 hover:border-emerald-500/30 transition-all duration-500">
                                                            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                                                                <div className="space-y-2 max-w-2xl">
                                                                    <div className="flex items-center gap-3">
                                                                        <h3 className="text-2xl font-bold text-white tracking-tight">{session.title}</h3>
                                                                        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest border border-white/10 px-2 py-1 rounded-full">
                                                                            Day {session.dayId?.dayNumber}
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-zinc-500 text-sm">{session.description}</p>
                                                                </div>

                                                                <div className="flex items-center gap-4 shrink-0">
                                                                    <div className={cn(
                                                                        "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 border",
                                                                        session.isCertificateUploadOpen
                                                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                                            : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                                                                    )}>
                                                                        <div className={cn("w-2 h-2 rounded-full", session.isCertificateUploadOpen ? "bg-emerald-500 animate-pulse" : "bg-zinc-500")} />
                                                                        {session.isCertificateUploadOpen ? "Uploads Active" : "Uploads Closed"}
                                                                    </div>

                                                                    <button
                                                                        onClick={() => toggleCertificateUpload(session._id, !session.isCertificateUploadOpen)}
                                                                        className={cn(
                                                                            "px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center gap-2",
                                                                            session.isCertificateUploadOpen
                                                                                ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                                                                                : "bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20"
                                                                        )}
                                                                    >
                                                                        {session.isCertificateUploadOpen ? (
                                                                            <>
                                                                                <Lock className="w-4 h-4" /> Close Uploads
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Unlock className="w-4 h-4" /> Open Uploads
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default AdminDashboard;
