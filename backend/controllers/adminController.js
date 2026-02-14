import User from '../models/User.js';
import Day from '../models/Day.js';
import Session from '../models/Session.js';
import Attendance from '../models/Attendance.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';
import ExcelJS from 'exceljs';
import { clearCache } from '../middleware/cache.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Get dashboard stats (Live users count, etc)
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
    try {
        const totalStudents = await User.countDocuments({ role: 'student' });

        res.json({
            onlineUsers: 0,
            totalStudents: totalStudents,
            serverTime: new Date()
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            message: 'Error fetching stats',
            error: error.message,
            stack: error.stack
        });
    }
};

// @desc    Preload students from JSON array
// @route   POST /api/admin/students/preload
// @access  Private/Admin
export const preloadStudents = async (req, res) => {
    try {
        const { students } = req.body;

        if (!students || !Array.isArray(students)) {
            return res.status(400).json({ message: 'Invalid students data' });
        }

        let createdCount = 0;
        let skippedCount = 0;

        for (const studentData of students) {
            const { registerNumber, name, email, yearOfStudy, department } = studentData;

            // Check if student already exists
            const studentExists = await User.findOne({ registerNumber: registerNumber.toUpperCase() });

            if (studentExists) {
                skippedCount++;
                continue;
            }

            // Create new student - password is registerNumber by default
            await User.create({
                registerNumber,
                name,
                email: email || `${registerNumber.toLowerCase()}@klu.ac.in`,
                password: registerNumber,
                yearOfStudy: yearOfStudy || '1',
                department: department || 'General',
                role: 'student'
            });

            createdCount++;
        }

        res.json({
            message: `Successfully processed ${students.length} students`,
            created: createdCount,
            skipped: skippedCount
        });
    } catch (error) {
        console.error('Preload students error:', error);
        res.status(500).json({ message: 'Server error preloading students' });
    }
};

// @desc    Get all days
// @route   GET /api/admin/days
// @access  Private/Admin
export const getAllDays = async (req, res) => {
    try {
        const days = await Day.find().sort({ dayNumber: 1 });
        res.json(days);
    } catch (error) {
        console.error('CRITICAL: Get days error:', error);
        res.status(500).json({
            message: 'Server error fetching days',
            error: error.message,
            stack: error.stack
        });
    }
};

// Alias for getAllDays if needed
export const getDays = getAllDays;

// @desc    Create a day
// @route   POST /api/admin/days
// @access  Private/Admin
export const createDay = async (req, res) => {
    try {
        const { title, dayNumber, date } = req.body;

        const dayExists = await Day.findOne({ dayNumber });
        if (dayExists) {
            return res.status(400).json({ message: 'Day number already exists' });
        }

        const day = await Day.create({
            title,
            dayNumber,
            date,
            status: 'LOCKED'
        });

        // Clear cache
        clearCache('admin-days');
        clearCache('student-days');

        res.status(201).json(day);
    } catch (error) {
        console.error('Create day error:', error);
        res.status(500).json({ message: 'Server error creating day' });
    }
};

// @desc    Update day status
// @route   PUT /api/admin/days/:id/status
// @access  Private/Admin
export const updateDayStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const day = await Day.findById(req.params.id);

        if (!day) {
            return res.status(404).json({ message: 'Day not found' });
        }

        day.status = status;
        await day.save();

        // Clear cache
        clearCache('admin-days');
        clearCache('admin-sessions');
        clearCache('student-days');
        clearCache('student-sessions');
        clearCache('admin-progress');

        res.json(day);
    } catch (error) {
        console.error('Update day status error:', error);

        // Return 404 if it's a cast error (invalid ID format)
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Invalid Day ID' });
        }

        res.status(500).json({
            message: 'Server error updating day status',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// @desc    Get all sessions
// @route   GET /api/admin/sessions
// @access  Private/Admin
export const getAllSessions = async (req, res) => {
    try {
        const sessions = await Session.find().populate('dayId').lean();

        // Sort in memory by dayNumber
        sessions.sort((a, b) => {
            const dayA = a.dayId?.dayNumber ?? 999;
            const dayB = b.dayId?.dayNumber ?? 999;
            if (dayA !== dayB) return dayA - dayB;
            return a._id.toString().localeCompare(b._id.toString());
        });

        res.json(sessions);
    } catch (error) {
        console.error('CRITICAL: Get sessions error:', error);
        res.status(500).json({ message: 'Server error fetching sessions', error: error.message });
    }
};

// Alias for getAllSessions
export const getSessions = getAllSessions;

// @desc    Create a session
// @route   POST /api/admin/sessions
// @access  Private/Admin
export const createSession = async (req, res) => {
    try {
        const { dayId, title, description, assignments } = req.body;

        const session = await Session.create({
            dayId,
            title,
            description,
            assignments: assignments || []
        });

        // Clear cache
        clearCache('admin-sessions');
        clearCache('student-sessions');

        res.status(201).json(session);
    } catch (error) {
        console.error('Create session error:', error);
        res.status(500).json({ message: 'Server error creating session' });
    }
};

// @desc    Update a session
// @route   PUT /api/admin/sessions/:id
// @access  Private/Admin
export const updateSession = async (req, res) => {
    try {
        const { title, description, assignments } = req.body;
        const session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        session.title = title || session.title;
        session.description = description || session.description;
        if (assignments) session.assignments = assignments;
        if (req.body.isCertificateUploadOpen !== undefined) {
            session.isCertificateUploadOpen = req.body.isCertificateUploadOpen;
        }

        await session.save();

        // Clear cache
        clearCache('admin-sessions');
        clearCache('student-sessions');

        res.json(session);
    } catch (error) {
        console.error('Update session error:', error);
        res.status(500).json({ message: 'Server error updating session' });
    }
};

// @desc    Delete a session
// @route   DELETE /api/admin/sessions/:id
// @access  Private/Admin
export const deleteSession = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        await session.deleteOne();

        // Clear cache
        clearCache('admin-sessions');
        clearCache('student-sessions');

        res.json({ message: 'Session removed' });
    } catch (error) {
        console.error('Delete session error:', error);
        res.status(500).json({ message: 'Server error deleting session' });
    }
};

// @desc    Start attendance for a session
// @route   POST /api/admin/sessions/:id/attendance/start
// @access  Private/Admin
export const startAttendance = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id).populate('dayId');

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        // Check if day is open
        if (session.dayId.status !== 'OPEN') {
            return res.status(400).json({ message: 'Day must be OPEN to start attendance' });
        }

        const now = new Date();

        session.attendanceOpen = true;
        session.attendanceStartTime = now;
        session.attendanceEndTime = null; // Stays open until manually closed

        await session.save();

        // Clear caches so everyone sees the update immediately
        clearCache('admin-sessions');
        clearCache('student-sessions');
        clearCache('admin-progress');

        res.json({
            message: 'Attendance started',
            session
        });
    } catch (error) {
        console.error('Start attendance error:', error);
        res.status(500).json({ message: 'Server error starting attendance' });
    }
};

// @desc    Stop attendance for a session
// @route   POST /api/admin/sessions/:id/attendance/stop
// @access  Private/Admin
export const stopAttendance = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        session.attendanceOpen = false;
        session.attendanceEndTime = new Date();
        await session.save();

        // Clear caches
        clearCache('admin-sessions');
        clearCache('student-sessions');
        clearCache('admin-progress');

        res.json({
            message: 'Attendance stopped',
            session
        });
    } catch (error) {
        console.error('Stop attendance error:', error);
        res.status(500).json({ message: 'Server error stopping attendance' });
    }
};

// @desc    Manual attendance override
// @route   POST /api/admin/attendance/override
// @access  Private/Admin
export const overrideAttendance = async (req, res) => {
    try {
        const { registerNumber, sessionId, comment } = req.body;

        if (!registerNumber || !sessionId || !comment) {
            return res.status(400).json({
                message: 'Register number, session ID, and comment are required'
            });
        }

        const student = await User.findOne({ registerNumber: registerNumber.toUpperCase() });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        let attendance = await Attendance.findOne({
            registerNumber: registerNumber.toUpperCase(),
            sessionId
        });

        if (attendance) {
            attendance.status = 'PRESENT';
            attendance.isOverride = true;
            attendance.overrideComment = comment;
            attendance.overrideBy = req.user.email;
            await attendance.save();
        } else {
            attendance = await Attendance.create({
                registerNumber: registerNumber.toUpperCase(),
                sessionId,
                status: 'PRESENT',
                isOverride: true,
                overrideComment: comment,
                overrideBy: req.user.email,
                timestamp: new Date()
            });
        }

        // Clear progress cache
        clearCache('admin-progress');

        res.status(201).json({
            message: 'Attendance override successful',
            attendance
        });
    } catch (error) {
        console.error('Override attendance error:', error);
        res.status(500).json({ message: 'Server error override attendance' });
    }
};

// @desc    Get progress for all students
// @route   GET /api/admin/progress
// @access  Private/Admin
export const getProgress = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        const query = { role: 'student' };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { registerNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const totalStudents = await User.countDocuments(query);
        const students = await User.find(query)
            .select('registerNumber name yearOfStudy department')
            .sort({ registerNumber: 1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const sessions = await Session.find()
            .populate({ path: 'dayId', select: 'dayNumber title' })
            .select('title dayId assignments attendanceStartTime attendanceOpen')
            .lean();

        // Sort in memory
        sessions.sort((a, b) => {
            const dayA = a.dayId?.dayNumber ?? 999;
            const dayB = b.dayId?.dayNumber ?? 999;
            if (dayA !== dayB) return dayA - dayB;
            return a._id.toString().localeCompare(b._id.toString());
        });
        const studentRegNums = students.map(s => s.registerNumber);

        const allAttendance = await Attendance.find({
            registerNumber: { $in: studentRegNums }
        })
            .select('registerNumber sessionId status isOverride timestamp photoPath')
            .lean();

        const allSubmissions = await AssignmentSubmission.find({
            registerNumber: { $in: studentRegNums }
        })
            .select('registerNumber sessionId assignmentTitle')
            .lean();

        const attendanceMap = new Map();
        allAttendance.forEach(a => {
            attendanceMap.set(`${a.registerNumber}|${a.sessionId.toString()}`, a);
        });

        const submissionMap = new Map();
        allSubmissions.forEach(s => {
            const key = `${s.registerNumber}|${s.sessionId.toString()}`;
            if (!submissionMap.has(key)) submissionMap.set(key, []);
            submissionMap.get(key).push(s);
        });

        const progressData = students.map(student => ({
            registerNumber: student.registerNumber,
            name: student.name,
            yearOfStudy: student.yearOfStudy,
            department: student.department,
            sessions: sessions.map(session => {
                const attendance = attendanceMap.get(`${student.registerNumber}|${session._id.toString()}`);
                const subs = submissionMap.get(`${student.registerNumber}|${session._id.toString()}`) || [];
                const uniqueTitles = new Set(subs.map(s => s.assignmentTitle));

                return {
                    sessionId: session._id,
                    sessionTitle: session.title,
                    dayNumber: session.dayId?.dayNumber,
                    dayTitle: session.dayId?.title,
                    attendance: attendance ? {
                        status: attendance.status,
                        isOverride: attendance.isOverride,
                        timestamp: attendance.timestamp,
                        photoPath: attendance.photoPath
                    } : null,
                    attendanceStartTime: session.attendanceStartTime,
                    attendanceOpen: session.attendanceOpen,
                    assignmentsCompleted: uniqueTitles.size,
                    totalAssignments: session.assignments ? session.assignments.length : 0
                };
            })
        }));

        res.json({
            students: progressData,
            pagination: {
                total: totalStudents,
                pages: Math.ceil(totalStudents / limit),
                currentPage: page,
                limit
            }
        });
    } catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({ message: 'Server error fetching progress' });
    }
};

// @desc    Get assessment submission stats
// @route   GET /api/admin/assessment-stats
// @access  Private/Admin
export const getAssessmentStats = async (req, res) => {
    try {
        const assessmentSessions = await Session.find({
            title: { $regex: /assessment/i }
        }).populate('dayId').lean();

        // Filter out Day 1 sessions and sessions with no dayId
        const filteredSessions = assessmentSessions.filter(s => s.dayId && s.dayId.dayNumber !== 1);

        if (filteredSessions.length === 0) {
            return res.json([]);
        }

        const totalStudents = await User.countDocuments({ role: 'student' });

        // Count unique students who submitted something for each session
        const stats = await Promise.all(filteredSessions.map(async (session) => {
            const submittedCount = await AssignmentSubmission.distinct('registerNumber', {
                sessionId: session._id
            });

            return {
                sessionId: session._id,
                title: session.title,
                dayNumber: session.dayId?.dayNumber || 0,
                totalStudents,
                submittedCount: submittedCount.length,
                percentage: totalStudents > 0 ? (submittedCount.length / totalStudents * 100).toFixed(1) : 0
            };
        }));

        res.json(stats);
    } catch (error) {
        console.error('Get assessment stats error:', error);
        res.status(500).json({ message: 'Server error fetching assessment stats' });
    }
};

// @desc    Export attendance to Excel
// @route   GET /api/admin/export/attendance
// @access  Private/Admin
export const exportAttendance = async (req, res) => {
    try {
        const { dayId, sessionId } = req.query;

        const students = await User.find({ role: 'student' }).select('-password').sort({ registerNumber: 1 });
        const days = await Day.find().sort({ dayNumber: 1 });

        let sessionQuery = {};
        if (sessionId) {
            sessionQuery._id = sessionId;
        } else if (dayId) {
            sessionQuery.dayId = dayId;
        }

        let sessions = await Session.find(sessionQuery).populate('dayId').sort({ createdAt: 1 });

        // Filter out Lunch, Break and Infosys sessions from attendance export
        sessions = sessions.filter(s =>
            s.title?.toUpperCase() !== 'LUNCH' &&
            s.type !== 'BREAK' &&
            s.title !== "Infosys Certified Course"
        );

        const sessionIds = sessions.map(s => s._id);

        const allAttendance = await Attendance.find({
            sessionId: { $in: sessionIds }
        }).lean();

        const attendanceMap = new Map();
        allAttendance.forEach(a => attendanceMap.set(`${a.registerNumber}|${a.sessionId.toString()}`, a));

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Attendance');

        // Simple table structure for export
        worksheet.columns = [
            { header: 'Reg Number', key: 'reg', width: 15 },
            { header: 'Student Name', key: 'name', width: 25 },
            { header: 'Day', key: 'day', width: 10 },
            { header: 'Session', key: 'session', width: 20 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Timestamp', key: 'time', width: 20 },
            { header: 'Override', key: 'override', width: 10 }
        ];

        for (const student of students) {
            for (const session of sessions) {
                const att = attendanceMap.get(`${student.registerNumber}|${session._id.toString()}`);
                const status = att ? 'PRESENT' : (session.attendanceStartTime ? 'ABSENT' : 'NOT STARTED');
                worksheet.addRow({
                    reg: student.registerNumber,
                    name: student.name,
                    day: session.dayId?.dayNumber || '-',
                    session: session.title,
                    status: status,
                    time: att ? new Date(att.timestamp).toLocaleString() : '-',
                    override: att?.isOverride ? 'YES' : 'NO'
                });
            }
        }

        let filename = 'attendance_report';
        if (sessionId && sessions.length > 0) {
            filename = `attendance_${sessions[0].title.replace(/\s+/g, '_')}`;
        } else if (dayId) {
            const day = days.find(d => d._id.toString() === dayId);
            filename = `attendance_day_${day ? day.dayNumber : 'selected'}`;
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}_${Date.now()}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ message: 'Export failed' });
    }
};

// @desc    Export assignments to Excel
// @route   GET /api/admin/export/assignments
// @access  Private/Admin
export const exportAssignments = async (req, res) => {
    try {
        const { dayId, sessionId } = req.query;

        const students = await User.find({ role: 'student' }).select('-password').sort({ registerNumber: 1 });

        // Filter sessions based on parameters
        let sessionQuery = {};
        if (sessionId) {
            sessionQuery._id = sessionId;
        } else if (dayId) {
            sessionQuery.dayId = dayId;
        }

        const sessions = await Session.find(sessionQuery).populate('dayId').sort({ createdAt: 1 });

        if (sessions.length === 0) {
            return res.status(404).json({ message: 'No sessions found for the specified criteria' });
        }

        const sessionIds = sessions.map(s => s._id);
        const allSubmissions = await AssignmentSubmission.find({
            sessionId: { $in: sessionIds }
        }).lean();

        const subMap = new Map();
        allSubmissions.forEach(s => subMap.set(`${s.registerNumber}|${s.sessionId.toString()}|${s.assignmentTitle}`, s));

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Assignments');

        worksheet.columns = [
            { header: 'Reg Number', key: 'reg', width: 15 },
            { header: 'Student Name', key: 'name', width: 25 },
            { header: 'Day', key: 'day', width: 10 },
            { header: 'Session', key: 'session', width: 25 },
            { header: 'Assignment', key: 'title', width: 30 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Response Type', key: 'type', width: 15 },
            { header: 'Response', key: 'response', width: 40 },
            { header: 'Submitted At', key: 'submittedAt', width: 20 }
        ];

        for (const student of students) {
            for (const session of sessions) {
                for (const assignment of session.assignments) {
                    const sub = subMap.get(`${student.registerNumber}|${session._id.toString()}|${assignment.title}`);
                    worksheet.addRow({
                        reg: student.registerNumber,
                        name: student.name,
                        day: session.dayId?.dayNumber || '-',
                        session: session.title,
                        title: assignment.title,
                        status: sub ? 'SUBMITTED' : 'PENDING',
                        type: sub ? sub.assignmentType : '-',
                        response: sub ? (sub.assignmentType === 'file' ? (sub.files?.[0] || sub.response) : sub.response) : '-',
                        submittedAt: sub ? new Date(sub.submittedAt).toLocaleString() : '-'
                    });
                }
            }
        }

        // Apply formatting
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        let filename = 'assignments_all';
        if (sessionId) {
            filename = `assignments_${sessions[0].title.replace(/\s+/g, '_')}`;
        } else if (dayId) {
            filename = `assignments_day_${sessions[0].dayId?.dayNumber || 'filtered'}`;
        }

        res.setHeader('Content-Disposition', `attachment; filename="${filename}_${Date.now()}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ message: 'Export failed' });
    }
};

// @desc    Export certificates to Excel
// @route   GET /api/admin/export/certificates
// @access  Private/Admin
// @desc    Export certificates to Excel
// @route   GET /api/admin/export/certificates
// @access  Private/Admin
export const exportCertificates = async (req, res) => {
    try {
        const { dayId, sessionId } = req.query;

        const students = await User.find({ role: 'student' }).select('-password').sort({ registerNumber: 1 });

        // Filter sessions
        let sessionQuery = {};
        if (sessionId) {
            sessionQuery._id = sessionId;
        } else if (dayId) {
            sessionQuery.dayId = dayId;
        } else {
            // Default: Auto-detect certificate sessions (Infosys, etc.)
            sessionQuery.$or = [
                { title: { $regex: /certificate/i } },
                { title: { $regex: /infosys/i } },
                { isCertificateUploadOpen: true }
            ];
        }

        const sessions = await Session.find(sessionQuery).populate('dayId').sort({ createdAt: 1 });

        if (sessions.length === 0) {
            return res.status(404).json({ message: 'No certificate sessions found' });
        }

        const sessionIds = sessions.map(s => s._id);

        // Find submissions
        const allCertificates = await AssignmentSubmission.find({
            sessionId: { $in: sessionIds }
        }).lean();

        const certMap = new Map();
        allCertificates.forEach(c => certMap.set(`${c.registerNumber}|${c.sessionId.toString()}`, c));

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Certificates');

        worksheet.columns = [
            { header: 'Reg Number', key: 'reg', width: 15 },
            { header: 'Student Name', key: 'name', width: 25 },
            { header: 'Day', key: 'day', width: 10 },
            { header: 'Session', key: 'session', width: 30 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Update Count', key: 'updateCount', width: 15 },
            { header: 'Submitted At', key: 'submittedAt', width: 20 },
            { header: 'Certificate Link', key: 'link', width: 50 },
            { header: 'File Type', key: 'fileType', width: 10 }
        ];

        for (const student of students) {
            for (const session of sessions) {
                const cert = certMap.get(`${student.registerNumber}|${session._id.toString()}`);

                let fileLink = '-';
                let fileType = '-';

                if (cert) {
                    if (cert.assignmentType === 'link' || cert.assignmentType === 'certificate') {
                        fileLink = cert.response || (cert.files && cert.files.length > 0 ? cert.files[0] : '-');
                        fileType = cert.assignmentType === 'link' ? 'LINK' : 'FILE';
                    } else if (cert.files && cert.files.length > 0) {
                        fileLink = cert.files[0];
                        fileType = 'FILE';
                    }
                }

                worksheet.addRow({
                    reg: student.registerNumber,
                    name: student.name,
                    day: session.dayId?.dayNumber || '-',
                    session: session.title,
                    status: cert ? 'UPLOADED' : 'PENDING',
                    updateCount: cert ? (cert.updateCount || 0) : 0,
                    submittedAt: cert ? new Date(cert.submittedAt).toLocaleString() : '-',
                    link: fileLink,
                    fileType: fileType
                });
            }
        }

        // Styling
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD1FAE5' }
        };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Robust filename generation
        let filename = 'certificates_report';
        if (sessionId && sessions.length > 0) {
            filename = `certificates_${sessions[0].title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
        } else if (dayId && sessions.length > 0) {
            filename = `certificates_day_${sessions[0].dayId?.dayNumber || 'filtered'}`;
        } else {
            filename = 'certificates_infosys_all';
        }

        res.setHeader('Content-Disposition', `attachment; filename="${filename}_${Date.now()}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Export certificates error:', error);
        res.status(500).json({ message: 'Export failed' });
    }
};

// @desc    Toggle certificate upload window
// @route   PUT /api/admin/sessions/:id/certificate-upload
// @access  Private/Admin
// @desc    Toggle certificate upload window
// @route   PUT /api/admin/sessions/:id/certificate-upload
// @access  Private/Admin
export const toggleCertificateUpload = async (req, res) => {
    try {
        const { isOpen } = req.body;
        const session = await Session.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        session.isCertificateUploadOpen = isOpen;
        await session.save();

        // Clear caches
        clearCache('admin-sessions');
        clearCache('student-sessions');

        res.json({
            message: `Certificate uploads ${isOpen ? 'opened' : 'closed'}`,
            session
        });
    } catch (error) {
        console.error('Toggle certificate upload error:', error);
        res.status(500).json({ message: 'Server error updating certificate upload status' });
    }
};

// @desc    Export assessments to Excel
// @route   GET /api/admin/export/assessments
// @access  Private/Admin
// @desc    Export assessments to Excel
// @route   GET /api/admin/export/assessments
// @access  Private/Admin
export const exportAssessments = async (req, res) => {
    try {
        const { dayId, sessionId } = req.query;

        const students = await User.find({ role: 'student' }).select('-password').sort({ registerNumber: 1 });

        // Filter sessions that are assessments
        let sessionQuery = {
            title: { $regex: /assessment/i }
        };

        if (sessionId) {
            sessionQuery._id = sessionId;
        } else if (dayId) {
            sessionQuery.dayId = dayId;
        }

        const sessions = await Session.find(sessionQuery).populate('dayId').sort({ createdAt: 1 });

        if (sessions.length === 0) {
            // Try to find ANY assessment if strict filter failed
            if (sessionId || dayId) {
                return res.status(404).json({ message: 'No assessment sessions found for this filter' });
            }
        }

        const sessionIds = sessions.map(s => s._id);
        const allSubmissions = await AssignmentSubmission.find({
            sessionId: { $in: sessionIds }
        }).lean();

        const subMap = new Map();
        allSubmissions.forEach(s => {
            // Store by RegNum|SessionId|Title to handle multiple q's if needed, 
            // but effectively we just need the main proof for the new format.
            const key = `${s.registerNumber}|${s.sessionId.toString()}|${s.assignmentTitle}`;
            subMap.set(key, s);
            // Also map by just RegNum|SessionId for easier lookup if title varies
            const fallbackKey = `${s.registerNumber}|${s.sessionId.toString()}`;
            if (!subMap.has(fallbackKey)) subMap.set(fallbackKey, s);
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Assessment Submissions');

        worksheet.columns = [
            { header: 'Reg Number', key: 'reg', width: 15 },
            { header: 'Student Name', key: 'name', width: 25 },
            { header: 'Day', key: 'day', width: 10 },
            { header: 'Session', key: 'session', width: 30 },
            { header: 'Assessment Link / Proof', key: 'proof', width: 50 },
            { header: 'Submitted At', key: 'submittedAt', width: 20 },
            { header: 'Status', key: 'status', width: 15 }
        ];

        for (const student of students) {
            for (const session of sessions) {
                // Priority: 'Assessment Proof' -> 'Question 01' -> Any submission for this session
                let submission = subMap.get(`${student.registerNumber}|${session._id.toString()}|Assessment Proof`);

                if (!submission) {
                    submission = subMap.get(`${student.registerNumber}|${session._id.toString()}|Question 01`);
                }

                if (!submission) {
                    // Fallback: any submission for this user+session
                    submission = subMap.get(`${student.registerNumber}|${session._id.toString()}`);
                }

                worksheet.addRow({
                    reg: student.registerNumber,
                    name: student.name,
                    day: session.dayId?.dayNumber || '-',
                    session: session.title,
                    proof: submission ? (submission.response || (submission.files?.[0] || '-')) : '-',
                    submittedAt: submission ? new Date(submission.submittedAt).toLocaleString() : '-',
                    status: submission ? 'SUBMITTED' : 'PENDING'
                });
            }
        }

        // Apply formatting
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD1FAE5' } // Custom color
        };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        let filename = 'assessment_report';
        if (sessions.length > 0) {
            if (sessionId) filename = `assessment_${sessions[0].title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
            else if (dayId) filename = `assessment_day_${sessions[0].dayId?.dayNumber || 'filtered'}`;
        }

        res.setHeader('Content-Disposition', `attachment; filename="${filename}_${Date.now()}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Export assessment error:', error);
        res.status(500).json({ message: 'Export failed' });
    }
};

// @desc    Get detailed assessment submissions for a session (Real-time tracking)
// @route   GET /api/admin/assessment-details/:sessionId
// @access  Private/Admin
export const getCertificateSubmissions = async (req, res) => {
    try {
        const { search = '' } = req.query;

        // Find the certificate session
        const session = await Session.findOne({
            $or: [
                { title: /certificate/i },
                { title: /Infosys Certified Course/i }
            ]
        });

        if (!session) {
            return res.status(404).json({ message: 'Certificate session not found' });
        }

        const studentQuery = { role: 'student' };
        if (search) {
            studentQuery.$or = [
                { name: { $regex: search, $options: 'i' } },
                { registerNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const students = await User.find(studentQuery).select('-password').sort({ registerNumber: 1 });

        // Find all submissions for certificate (by title or type)
        const submissions = await AssignmentSubmission.find({
            $or: [
                { sessionId: session._id },
                { assignmentType: 'certificate' },
                { assignmentTitle: /certificate/i }
            ]
        }).lean();

        const subMap = new Map();
        submissions.forEach(s => {
            // Keep the most recent if multiple (though findOneAndUpdate should prevent multiples)
            subMap.set(s.registerNumber, s);
        });

        const data = students.map(student => ({
            name: student.name,
            registerNumber: student.registerNumber,
            collegeEmail: student.collegeEmail,
            hasSubmitted: subMap.has(student.registerNumber),
            submission: subMap.get(student.registerNumber) || null
        }));

        res.json({
            session: {
                _id: session._id,
                title: session.title,
                isUploadOpen: session.isCertificateUploadOpen
            },
            students: data,
            stats: {
                total: students.length,
                submitted: submissions.length,
                pending: students.length - submissions.length
            }
        });

    } catch (error) {
        console.error('Get certificate tracking error:', error);
        res.status(500).json({ message: 'Server error fetching certificate details' });
    }
};

export const getDetailedAssessmentSubmissions = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { search = '' } = req.query;

        const session = await Session.findById(sessionId).populate('dayId');
        if (!session) {
            // Log for debugging 404
            console.warn(`[adminController] Detailed Assessment: Session ${sessionId} NOT FOUND`);
            return res.status(404).json({ message: 'Session not found' });
        }

        const studentQuery = { role: 'student' };
        if (search) {
            studentQuery.$or = [
                { name: { $regex: search, $options: 'i' } },
                { registerNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const students = await User.find(studentQuery).select('-password').sort({ registerNumber: 1 });
        const submissions = await AssignmentSubmission.find({ sessionId }).lean();

        const subMap = new Map();
        submissions.forEach(s => {
            const key = `${s.registerNumber}|${s.assignmentTitle}`;
            subMap.set(key, s);
        });

        const questions = ['Assessment Proof'];

        const data = students.map(student => {
            const row = {
                name: student.name,
                registerNumber: student.registerNumber,
                responses: questions.map(q => {
                    // Check for new format first, then legacy Q1 if not found
                    let sub = subMap.get(`${student.registerNumber}|${q}`);
                    if (!sub && q === 'Assessment Proof') {
                        sub = subMap.get(`${student.registerNumber}|Question 01`);
                    }

                    return {
                        title: q,
                        response: sub ? sub.response : null,
                        submittedAt: sub ? sub.submittedAt : null
                    };
                }),
                totalSubmitted: subMap.has(`${student.registerNumber}|Assessment Proof`) || subMap.has(`${student.registerNumber}|Question 01`) ? 1 : 0
            };
            return row;
        });

        res.json({
            session: {
                title: session.title,
                dayNumber: session.dayId?.dayNumber
            },
            students: data
        });

    } catch (error) {
        console.error('Get detailed assessment submissions error:', error);
        res.status(500).json({ message: 'Server error fetching assessment details' });
    }
};

export const runAutoCloseJob = async (req, res) => {
    try {
        const now = new Date();
        const result = await Session.updateMany(
            { attendanceOpen: true, attendanceEndTime: { $lt: now } },
            { $set: { attendanceOpen: false } }
        );
        if (res) res.json({ message: `Closed ${result.modifiedCount} sessions` });
    } catch (error) {
        if (res) res.status(500).json({ message: 'Cron job failed' });
    }
};
