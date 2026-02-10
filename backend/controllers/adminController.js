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
        res.status(500).json({ message: 'Error fetching stats' });
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
        res.status(500).json({ message: 'Server error fetching days', error: error.message });
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
        const sessions = await Session.find().populate('dayId').sort({ createdAt: 1 }).lean();
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
        const endTime = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes window

        session.attendanceOpen = true;
        session.attendanceStartTime = now;
        session.attendanceEndTime = endTime;

        await session.save();

        // Clear caches so everyone sees the update immediately
        clearCache('admin-sessions');
        clearCache('student-sessions');
        clearCache('admin-progress');

        res.json({
            message: 'Attendance started',
            session,
            windowEndsAt: endTime
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
            .select('title dayId assignments')
            .sort({ createdAt: 1 })
            .lean();
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

        const sessions = await Session.find(sessionQuery).populate('dayId').sort({ createdAt: 1 });
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
                worksheet.addRow({
                    reg: student.registerNumber,
                    name: student.name,
                    day: session.dayId?.dayNumber || '-',
                    session: session.title,
                    status: att ? 'PRESENT' : 'ABSENT',
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
        res.setHeader('Content-Disposition', `attachment; filename=${filename}_${Date.now()}.xlsx`);
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

        res.setHeader('Content-Disposition', `attachment; filename=${filename}_${Date.now()}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ message: 'Export failed' });
    }
};

// @desc    Cron job logic
// @access  Public/Admin
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
