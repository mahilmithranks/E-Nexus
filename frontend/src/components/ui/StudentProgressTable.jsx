import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, BookOpen, GraduationCap, Camera, Activity, FileCheck, AlertCircle } from "lucide-react";
import api from "../../services/api";

export function StudentProgressTable({
    title = "Student Progress Tracking",
    students = [],
    className = ""
}) {
    const [hoveredStudent, setHoveredStudent] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [viewingPhoto, setViewingPhoto] = useState(null);

    // Helper to calculate overall stats
    const getStudentStats = (student) => {
        let totalSessions = 0;
        let attendedSessions = 0;
        let totalAssignments = 0;
        let completedAssignments = 0;

        student.sessions.forEach(session => {
            totalSessions++;
            if (session.attendance?.status === 'PRESENT') attendedSessions++;

            if (session.totalAssignments > 0) {
                totalAssignments += session.totalAssignments;
                completedAssignments += session.assignmentsCompleted;
            }
        });

        const attendanceRate = totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0;
        const assignmentRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

        // Determine status based on attendance
        let status = 'active'; // Good standing
        if (attendanceRate < 50) status = 'inactive'; // Critical
        else if (attendanceRate < 75) status = 'paused'; // Warning

        return { attendanceRate, assignmentRate, status, totalSessions, attendedSessions, totalAssignments, completedAssignments };
    };

    const getDepartmentIcon = (dept) => {
        // Simple mapping or generic icon
        return (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center p-1.5 border border-white/10">
                <GraduationCap className="text-white w-4 h-4" />
            </div>
        );
    };

    const getAttendanceBars = (percentage, status) => {
        const filledBars = Math.round((percentage / 100) * 10);

        const getBarColor = (index) => {
            if (index >= filledBars) return "bg-white/10 border border-white/5";

            if (percentage >= 80) return "bg-green-500/80";
            if (percentage >= 60) return "bg-yellow-500/80";
            return "bg-red-500/80";
        };

        return (
            <div className="flex items-center gap-3">
                <div className="flex gap-1">
                    {Array.from({ length: 10 }).map((_, index) => (
                        <div
                            key={index}
                            className={`w-1.5 h-5 rounded-full transition-all duration-500 ${getBarColor(index)}`}
                        />
                    ))}
                </div>
                <span className="text-sm font-mono text-white/80 font-medium min-w-[3rem]">
                    {percentage}%
                </span>
            </div>
        );
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "active": // > 75%
                return (
                    <div className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                        <span className="text-green-400 text-sm font-medium">Excellent</span>
                    </div>
                );
            case "paused": // 50-75%
                return (
                    <div className="px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                        <span className="text-yellow-400 text-sm font-medium">Average</span>
                    </div>
                );
            case "inactive": // < 50%
                return (
                    <div className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                        <span className="text-red-400 text-sm font-medium">Critical</span>
                    </div>
                );
            default:
                return null;
        }
    };

    const getStatusGradient = (status) => {
        switch (status) {
            case "active": return "from-green-500/10 to-transparent";
            case "paused": return "from-yellow-500/10 to-transparent";
            case "inactive": return "from-red-500/10 to-transparent";
            default: return "";
        }
    };

    return (
        <div className={`w-full max-w-7xl mx-auto ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <h1 className="text-xl font-medium text-white">{title}</h1>
                    </div>
                    <div className="text-sm text-gray-400">
                        {students.length} Students Included
                    </div>
                </div>
            </div>

            {/* Table Rows */}
            <motion.div
                className="space-y-2"
                variants={{
                    visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
                }}
                initial="hidden"
                animate="visible"
            >
                {/* Headers */}
                <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="col-span-2">Reg No</div>
                    <div className="col-span-3">Student Name</div>
                    <div className="col-span-2">Department</div>
                    <div className="col-span-2">Attendance</div>
                    <div className="col-span-2">Assignment Rate</div>
                    <div className="col-span-1">Status</div>
                </div>

                {/* Student Rows */}
                {students.map((student) => {
                    const stats = getStudentStats(student);
                    return (
                        <motion.div
                            key={student.registerNumber}
                            variants={{
                                hidden: { opacity: 0, x: -25, scale: 0.95, filter: "blur(4px)" },
                                visible: {
                                    opacity: 1, x: 0, scale: 1, filter: "blur(0px)",
                                    transition: { type: "spring", stiffness: 400, damping: 28, mass: 0.6 },
                                },
                            }}
                            className="relative cursor-pointer"
                            onMouseEnter={() => setHoveredStudent(student.registerNumber)}
                            onMouseLeave={() => setHoveredStudent(null)}
                            onClick={() => setSelectedStudent(student)}
                        >
                            <motion.div
                                className="relative bg-white/5 border border-white/10 rounded-xl p-4 overflow-hidden backdrop-blur-sm hover:bg-white/10 transition-colors"
                                whileHover={{ y: -1, transition: { type: "spring", stiffness: 400, damping: 25 } }}
                            >
                                {/* Status gradient */}
                                <div
                                    className={`absolute inset-0 bg-gradient-to-l ${getStatusGradient(stats.status)} pointer-events-none opacity-50`}
                                    style={{ backgroundSize: "30% 100%", backgroundPosition: "right", backgroundRepeat: "no-repeat" }}
                                />

                                <div className="relative grid grid-cols-12 gap-4 items-center">
                                    {/* Reg No */}
                                    <div className="col-span-2">
                                        <span className="text-lg font-bold text-gray-400 font-mono">
                                            {student.registerNumber}
                                        </span>
                                    </div>

                                    {/* Name */}
                                    <div className="col-span-3 flex items-center gap-3">
                                        {getDepartmentIcon(student.department)}
                                        <span className="text-white font-medium truncate">
                                            {student.name}
                                        </span>
                                    </div>

                                    {/* Department */}
                                    <div className="col-span-2">
                                        <span className="text-gray-300 text-sm">
                                            {student.department || 'N/A'} - Year {student.yearOfStudy}
                                        </span>
                                    </div>

                                    {/* Attendance Bars */}
                                    <div className="col-span-2">
                                        {getAttendanceBars(stats.attendanceRate, stats.status)}
                                    </div>

                                    {/* Assignment Progress */}
                                    <div className="col-span-2">
                                        <div className="flex items-center gap-2">
                                            <FileCheck className="w-4 h-4 text-gray-400" />
                                            <span className="text-white/90 font-mono">
                                                {stats.assignmentRate}%
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                ({stats.completedAssignments}/{stats.totalAssignments})
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="col-span-1">
                                        {getStatusBadge(stats.status)}
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Detail Modal */}
            <AnimatePresence>
                {selectedStudent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => setSelectedStudent(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-gray-900/90 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="relative bg-gradient-to-r from-white/5 to-transparent p-6 border-b border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                                        <User className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{selectedStudent.name}</h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <span className="font-mono">{selectedStudent.registerNumber}</span>
                                            <span>•</span>
                                            <span>{selectedStudent.department} (Year {selectedStudent.yearOfStudy})</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                                    onClick={() => setSelectedStudent(null)}
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            {/* Modal Content - Scrollable */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {/* Overall Stats Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                    {(() => {
                                        const stats = getStudentStats(selectedStudent);
                                        return (
                                            <>
                                                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-gray-400 text-sm">Attendance</span>
                                                        <Activity className="w-4 h-4 text-blue-400" />
                                                    </div>
                                                    <div className="text-2xl font-bold text-white mb-1">{stats.attendanceRate}%</div>
                                                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                                        <div className="bg-blue-500 h-full rounded-full" style={{ width: `${stats.attendanceRate}%` }} />
                                                    </div>
                                                </div>
                                                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-gray-400 text-sm">Assignments</span>
                                                        <BookOpen className="w-4 h-4 text-purple-400" />
                                                    </div>
                                                    <div className="text-2xl font-bold text-white mb-1">{stats.completedAssignments}/{stats.totalAssignments}</div>
                                                    <div className="text-xs text-gray-500">Submitted</div>
                                                </div>
                                                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-gray-400 text-sm">Standing</span>
                                                        <AlertCircle className="w-4 h-4 text-green-400" />
                                                    </div>
                                                    <div className="mt-1">
                                                        {getStatusBadge(stats.status)}
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>

                                {/* Sessions List */}
                                <h4 className="text-lg font-semibold text-white mb-4">Detailed Session Log</h4>
                                <div className="space-y-3">
                                    {selectedStudent.sessions.map((session, idx) => {
                                        const hasAttendance = session.attendance?.status === 'PRESENT';
                                        const hasPhoto = !!session.attendance?.photoPath;
                                        return (
                                            <div key={idx} className="bg-white/5 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/5 hover:border-white/10 transition-colors">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-medium">{session.sessionTitle}</span>
                                                    <span className="text-sm text-gray-500">Day {session.dayNumber || '?'}</span>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-xs text-gray-400 mb-1">Attendance</span>
                                                        <div className="flex items-center gap-2">
                                                            {hasAttendance ? (
                                                                <span className="text-green-400 font-medium text-sm flex items-center gap-1">
                                                                    ✓ Present
                                                                </span>
                                                            ) : (
                                                                <span className="text-red-400 font-medium text-sm flex items-center gap-1">
                                                                    ✗ Absent
                                                                </span>
                                                            )}
                                                            {hasPhoto && (
                                                                <button
                                                                    className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-gray-300 transition-colors"
                                                                    title="View Photo"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setViewingPhoto({
                                                                            url: `${api.defaults.baseURL}/${session.attendance.photoPath.replace(/\\/g, '/')}`,
                                                                            title: `${selectedStudent.name} - ${session.sessionTitle}`
                                                                        });
                                                                    }}
                                                                >
                                                                    <Camera className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end min-w-[100px]">
                                                        <span className="text-xs text-gray-400 mb-1">Assignments</span>
                                                        <div className="flex items-center gap-1">
                                                            <span className={`text-sm font-medium ${session.assignmentsCompleted === session.totalAssignments ? 'text-green-400' : 'text-yellow-400'}`}>
                                                                {session.assignmentsCompleted}/{session.totalAssignments}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Photo Modal (Nested on top) */}
                {viewingPhoto && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4"
                        onClick={() => setViewingPhoto(null)}
                    >
                        <div onClick={e => e.stopPropagation()} className="relative max-w-4xl w-full max-h-[90vh]">
                            <button
                                onClick={() => setViewingPhoto(null)}
                                className="absolute -top-12 right-0 text-gray-400 hover:text-white"
                            >
                                <X className="w-8 h-8" />
                            </button>
                            <img
                                src={viewingPhoto.url}
                                alt="Evidence"
                                className="w-full h-full object-contain rounded-lg shadow-2xl border border-white/10"
                            />
                            <p className="mt-4 text-center text-gray-400">{viewingPhoto.title}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
