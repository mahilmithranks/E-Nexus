import User from '../models/User.js';
import Day from '../models/Day.js';
import Session from '../models/Session.js';
import Attendance from '../models/Attendance.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Preload student data
// @route   POST /api/admin/students/preload
// @access  Private/Admin
export const preloadStudents = async (req, res) => {
    try {
        const { students } = req.body;

        if (!students || !Array.isArray(students)) {
            return res.status(400).json({ message: 'Please provide an array of students' });
        }

        const createdStudents = [];
        const errors = [];

        for (const studentData of students) {
            try {
                // Check if student already exists
                const existingStudent = await User.findOne({
                    registerNumber: studentData.registerNumber.toUpperCase()
                });

                if (existingStudent) {
                    errors.push({
                        registerNumber: studentData.registerNumber,
                        error: 'Student already exists'
                    });
                    continue;
                }

                const student = await User.create({
                    registerNumber: studentData.registerNumber.toUpperCase(),
                    password: studentData.dateOfBirth, // Will be hashed by pre-save hook
                    name: studentData.name,
                    yearOfStudy: studentData.yearOfStudy,
                    department: studentData.department || '',
                    role: 'student'
                });

                createdStudents.push(student.registerNumber);
            } catch (error) {
                errors.push({
                    registerNumber: studentData.registerNumber,
                    error: error.message
                });
            }
        }

        res.status(201).json({
            message: 'Student preload completed',
            created: createdStudents.length,
            errors: errors.length,
            createdStudents,
            errors
        });
    } catch (error) {
        console.error('Preload students error:', error);
        res.status(500).json({ message: 'Server error during student preload' });
    }
};

// @desc    Create a new day
// @route   POST /api/admin/days
// @access  Private/Admin
export const createDay = async (req, res) => {
    try {
        const { dayNumber, title, date } = req.body;

        const day = await Day.create({
            dayNumber,
            title,
            date: date || new Date(),
            status: 'LOCKED'
        });

        res.status(201).json(day);
    } catch (error) {
        console.error('Create day error:', error);
        res.status(500).json({ message: 'Server error creating day' });
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
        console.error('Get days error:', error);
        res.status(500).json({ message: 'Server error fetching days' });
    }
};

// @desc    Update day status
// @route   PUT /api/admin/days/:id/status
// @access  Private/Admin
export const updateDayStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['LOCKED', 'OPEN', 'CLOSED'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const day = await Day.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!day) {
            return res.status(404).json({ message: 'Day not found' });
        }

        res.json(day);
    } catch (error) {
        console.error('Update day status error:', error);
        res.status(500).json({ message: 'Server error updating day status' });
    }
};

// @desc    Create a session
// @route   POST /api/admin/sessions
// @access  Private/Admin
export const createSession = async (req, res) => {
    try {
        const { dayId, title, description, assignments } = req.body;

        // Verify day exists
        const day = await Day.findById(dayId);
        if (!day) {
            return res.status(404).json({ message: 'Day not found' });
        }

        const session = await Session.create({
            dayId,
            title,
            description,
            assignments: assignments || [],
            attendanceOpen: false
        });

        res.status(201).json(session);
    } catch (error) {
        console.error('Create session error:', error);
        res.status(500).json({ message: 'Server error creating session' });
    }
};

// @desc    Get all sessions
// @route   GET /api/admin/sessions
// @access  Private/Admin
export const getAllSessions = async (req, res) => {
    try {
        const sessions = await Session.find().populate('dayId').sort({ createdAt: 1 });
        res.json(sessions);
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ message: 'Server error fetching sessions' });
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
        const endTime = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now

        session.attendanceOpen = true;
        session.attendanceStartTime = now;
        session.attendanceEndTime = endTime;

        await session.save();

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

        // Check if student exists
        const student = await User.findOne({ registerNumber: registerNumber.toUpperCase() });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Check if session exists
        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        // Check if attendance already exists
        let attendance = await Attendance.findOne({
            registerNumber: registerNumber.toUpperCase(),
            sessionId
        });

        if (attendance) {
            // Update existing attendance
            attendance.status = 'PRESENT';
            attendance.isOverride = true;
            attendance.overrideComment = comment;
            attendance.overrideBy = req.user.email;
            await attendance.save();
        } else {
            // Create new attendance record
            attendance = await Attendance.create({
                registerNumber: registerNumber.toUpperCase(),
                sessionId,
                status: 'PRESENT',
                isOverride: true,
                overrideComment: comment,
                overrideBy: req.user.email
            });
        }

        res.status(201).json({
            message: 'Attendance override successful',
            attendance
        });
    } catch (error) {
        console.error('Override attendance error:', error);
        res.status(500).json({ message: 'Server error during attendance override' });
    }
};

// @desc    Get progress for all students
// @route   GET /api/admin/progress
// @access  Private/Admin
export const getProgress = async (req, res) => {
    try {
        const students = await User.find({ role: 'student' }).select('-password').sort({ registerNumber: 1 });
        const sessions = await Session.find().populate('dayId').sort({ createdAt: 1 });

        const progressData = [];

        for (const student of students) {
            const studentProgress = {
                registerNumber: student.registerNumber,
                name: student.name,
                yearOfStudy: student.yearOfStudy,
                department: student.department,
                sessions: []
            };

            for (const session of sessions) {
                // Get attendance
                const attendance = await Attendance.findOne({
                    registerNumber: student.registerNumber,
                    sessionId: session._id
                });

                // Get assignment submissions
                const submissions = await AssignmentSubmission.find({
                    registerNumber: student.registerNumber,
                    sessionId: session._id
                });

                // Get unique submitted assignment titles
                const uniqueTitles = new Set(submissions.map(s => s.assignmentTitle));

                studentProgress.sessions.push({
                    sessionId: session._id,
                    sessionTitle: session.title,
                    dayNumber: session.dayId.dayNumber,
                    dayTitle: session.dayId.title,
                    attendance: attendance ? {
                        status: attendance.status,
                        isOverride: attendance.isOverride,
                        timestamp: attendance.timestamp,
                        photoPath: attendance.photoPath
                    } : null,
                    assignmentsCompleted: uniqueTitles.size,
                    totalAssignments: session.assignments.length
                });
            }

            progressData.push(studentProgress);
        }

        res.json(progressData);
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
        const students = await User.find({ role: 'student' }).select('-password').sort({ registerNumber: 1 });
        const days = await Day.find().sort({ dayNumber: 1 });
        const sessions = await Session.find().populate('dayId').sort({ createdAt: 1 });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Attendance Report');

        // Title row
        worksheet.mergeCells('A1:F1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'Workshop Attendance Report';
        titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2C3E50' }
        };
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getRow(1).height = 30;

        // Generated date
        worksheet.mergeCells('A2:F2');
        const dateCell = worksheet.getCell('A2');
        dateCell.value = `Generated on: ${new Date().toLocaleString()}`;
        dateCell.font = { italic: true };
        dateCell.alignment = { horizontal: 'center' };

        let currentRow = 4;

        // Group by Day
        for (const day of days) {
            const daySessions = sessions.filter(s => s.dayId._id.toString() === day._id.toString());

            if (daySessions.length === 0) continue;

            // Day Header
            worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
            const dayHeader = worksheet.getCell(`A${currentRow}`);
            dayHeader.value = `Day ${day.dayNumber}`;
            dayHeader.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
            dayHeader.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF3498DB' }
            };
            dayHeader.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
            worksheet.getRow(currentRow).height = 25;
            currentRow++;

            // Process each session in this day
            for (const session of daySessions) {
                // Session Header
                worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
                const sessionHeader = worksheet.getCell(`A${currentRow}`);
                sessionHeader.value = `  📍 ${session.title}`;
                sessionHeader.font = { size: 12, bold: true };
                sessionHeader.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFECF0F1' }
                };
                sessionHeader.alignment = { vertical: 'middle', horizontal: 'left', indent: 2 };
                worksheet.getRow(currentRow).height = 20;
                currentRow++;

                // Column headers for this session
                const headerRow = worksheet.getRow(currentRow);
                headerRow.values = ['Register Number', 'Student Name', 'Status', 'Override', 'Timestamp', 'Comment'];
                headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                headerRow.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF34495E' }
                };
                headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
                headerRow.height = 20;

                // Set column widths
                worksheet.getColumn(1).width = 20;
                worksheet.getColumn(2).width = 30;
                worksheet.getColumn(3).width = 15;
                worksheet.getColumn(4).width = 12;
                worksheet.getColumn(5).width = 20;
                worksheet.getColumn(6).width = 40;

                currentRow++;

                // Add student data for this session
                for (const student of students) {
                    const attendance = await Attendance.findOne({
                        registerNumber: student.registerNumber,
                        sessionId: session._id
                    });

                    const row = worksheet.getRow(currentRow);
                    row.values = [
                        student.registerNumber,
                        student.name,
                        attendance ? 'PRESENT' : 'ABSENT',
                        attendance?.isOverride ? 'YES' : 'NO',
                        attendance ? attendance.timestamp.toLocaleString() : '-',
                        attendance?.overrideComment || '-'
                    ];

                    // Color coding
                    if (attendance) {
                        if (attendance.isOverride) {
                            // Yellow for override
                            row.getCell(3).fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFFFF3CD' }
                            };
                            row.getCell(3).font = { color: { argb: 'FF856404' }, bold: true };
                        } else {
                            // Green for present
                            row.getCell(3).fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFD4EDDA' }
                            };
                            row.getCell(3).font = { color: { argb: 'FF155724' }, bold: true };
                        }
                    } else {
                        // Red for absent
                        row.getCell(3).fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFF8D7DA' }
                        };
                        row.getCell(3).font = { color: { argb: 'FF721C24' }, bold: true };
                    }

                    row.alignment = { vertical: 'middle' };
                    row.getCell(1).alignment = { horizontal: 'left' };
                    row.getCell(2).alignment = { horizontal: 'left' };
                    row.getCell(3).alignment = { horizontal: 'center' };
                    row.getCell(4).alignment = { horizontal: 'center' };
                    row.getCell(5).alignment = { horizontal: 'center' };
                    row.getCell(6).alignment = { horizontal: 'left' };

                    currentRow++;
                }

                // Add spacing after each session
                currentRow++;
            }

            // Add spacing after each day
            currentRow++;
        }

        // Add borders to all cells
        for (let i = 1; i <= currentRow; i++) {
            const row = worksheet.getRow(i);
            for (let j = 1; j <= 6; j++) {
                const cell = row.getCell(j);
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                    left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                    bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                    right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
                };
            }
        }

        // Set response headers
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=attendance_report_${Date.now()}.xlsx`
        );

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Export attendance error:', error);
        res.status(500).json({ message: 'Server error exporting attendance' });
    }
};

// @desc    Export assignment responses to Excel
// @route   GET /api/admin/export/assignments
// @access  Private/Admin
export const exportAssignments = async (req, res) => {
    try {
        const students = await User.find({ role: 'student' }).select('-password').sort({ registerNumber: 1 });
        const days = await Day.find().sort({ dayNumber: 1 });
        const sessions = await Session.find().populate('dayId').sort({ createdAt: 1 });

        // OPTIMIZATION: Pre-fetch ALL submissions at once for performance (instead of querying in loops)
        const allSubmissions = await AssignmentSubmission.find();

        // Create a Map for O(1) lookup: key = "registerNumber|sessionId|assignmentTitle"
        const submissionMap = new Map();
        allSubmissions.forEach(sub => {
            const key = `${sub.registerNumber}|${sub.sessionId}|${sub.assignmentTitle}`;
            submissionMap.set(key, sub);
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Assignment Report');

        // Title row
        worksheet.mergeCells('A1:F1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'Workshop Assignment Report';
        titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF27AE60' }
        };
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getRow(1).height = 30;

        // Generated date
        worksheet.mergeCells('A2:F2');
        const dateCell = worksheet.getCell('A2');
        dateCell.value = `Generated on: ${new Date().toLocaleString()}`;
        dateCell.font = { italic: true };
        dateCell.alignment = { horizontal: 'center' };

        let currentRow = 4;

        // Group by Day
        for (const day of days) {
            const daySessions = sessions.filter(s => s.dayId._id.toString() === day._id.toString());

            if (daySessions.length === 0) continue;

            // Day Header
            worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
            const dayHeader = worksheet.getCell(`A${currentRow}`);
            dayHeader.value = `Day ${day.dayNumber}`;
            dayHeader.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
            dayHeader.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF16A085' }
            };
            dayHeader.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
            worksheet.getRow(currentRow).height = 25;
            currentRow++;

            // Process each session in this day
            for (const session of daySessions) {
                if (session.assignments.length === 0) continue;

                // Session Header
                worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
                const sessionHeader = worksheet.getCell(`A${currentRow}`);
                sessionHeader.value = `  📝 ${session.title}`;
                sessionHeader.font = { size: 12, bold: true };
                sessionHeader.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFD5F4E6' }
                };
                sessionHeader.alignment = { vertical: 'middle', horizontal: 'left', indent: 2 };
                worksheet.getRow(currentRow).height = 20;
                currentRow++;

                // Process each assignment in this session
                for (const assignment of session.assignments) {
                    // Assignment Title Header
                    worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
                    const assignmentHeader = worksheet.getCell(`A${currentRow}`);
                    assignmentHeader.value = `    ▸ ${assignment.title}`;
                    assignmentHeader.font = { size: 11, bold: true, italic: true };
                    assignmentHeader.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF0F0F0' }
                    };
                    assignmentHeader.alignment = { vertical: 'middle', horizontal: 'left', indent: 3 };
                    currentRow++;

                    // Column headers for this assignment
                    const headerRow = worksheet.getRow(currentRow);
                    headerRow.values = ['Register Number', 'Student Name', 'Status', 'Response Type', 'Response', 'Submitted At'];
                    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                    headerRow.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FF34495E' }
                    };
                    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
                    headerRow.height = 20;

                    // Set column widths
                    worksheet.getColumn(1).width = 20;
                    worksheet.getColumn(2).width = 30;
                    worksheet.getColumn(3).width = 15;
                    worksheet.getColumn(4).width = 15;
                    worksheet.getColumn(5).width = 50;
                    worksheet.getColumn(6).width = 20;

                    currentRow++;

                    // Add student data for this assignment (optimized with Map lookup)
                    for (const student of students) {
                        // O(1) lookup instead of database query
                        const lookupKey = `${student.registerNumber}|${session._id}|${assignment.title}`;
                        const submission = submissionMap.get(lookupKey);

                        const row = worksheet.getRow(currentRow);
                        row.values = [
                            student.registerNumber,
                            student.name,
                            submission ? 'SUBMITTED' : 'NOT SUBMITTED',
                            submission && submission.responseType ? submission.responseType.toUpperCase() : '-',
                            submission ? (submission.responseType === 'file' ? 'Image Attached' : (submission.response || '-')) : '-',
                            submission && submission.submittedAt ? submission.submittedAt.toLocaleString() : '-'
                        ];

                        // Color coding
                        if (submission) {
                            // Green for submitted
                            row.getCell(3).fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFD4EDDA' }
                            };
                            row.getCell(3).font = { color: { argb: 'FF155724' }, bold: true };

                            // Embed image if it's a file submission
                            if (submission.responseType === 'file' && submission.response) {
                                try {
                                    // Handle both absolute and relative paths
                                    const imagePath = submission.response.startsWith('http')
                                        ? null // Skip cloud URLs for now (complex to download in Excel)
                                        : path.join(__dirname, '..', submission.response.startsWith('/') ? submission.response.substring(1) : submission.response);

                                    if (imagePath && fs.existsSync(imagePath)) {
                                        const imageBuffer = fs.readFileSync(imagePath);
                                        let extension = path.extname(imagePath).substring(1).toLowerCase();
                                        if (extension === 'jpg') extension = 'jpeg';

                                        const imageId = workbook.addImage({
                                            buffer: imageBuffer,
                                            extension: extension,
                                        });

                                        worksheet.addImage(imageId, {
                                            tl: { col: 6, row: currentRow - 1 }, // Column G (which is index 6)
                                            ext: { width: 100, height: 100 },
                                            editAs: 'oneCell'
                                        });
                                        row.height = 80;
                                    } else if (imagePath) {
                                        row.getCell(5).value = `Image Missing`;
                                    }
                                } catch (imgError) {
                                    console.error('Error embedding image:', imgError);
                                }
                            }
                        } else {
                            // Red for not submitted
                            row.getCell(3).fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFF8D7DA' }
                            };
                            row.getCell(3).font = { color: { argb: 'FF721C24' }, bold: true };
                        }

                        row.alignment = { vertical: 'middle' };
                        row.getCell(1).alignment = { horizontal: 'left' };
                        row.getCell(2).alignment = { horizontal: 'left' };
                        row.getCell(3).alignment = { horizontal: 'center' };
                        row.getCell(4).alignment = { horizontal: 'center' };
                        row.getCell(5).alignment = { horizontal: 'left' };
                        row.getCell(6).alignment = { horizontal: 'center' };

                        currentRow++;
                    }

                    // Add spacing after each assignment
                    currentRow++;
                }

                // Add spacing after each session
                currentRow++;
            }

            // Add spacing after each day
            currentRow++;
        }

        // Add borders to all cells
        for (let i = 1; i <= currentRow; i++) {
            const row = worksheet.getRow(i);
            for (let j = 1; j <= 6; j++) {
                const cell = row.getCell(j);
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                    left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                    bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                    right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
                };
            }
        }

        // Set response headers
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=assignment_report_${Date.now()}.xlsx`
        );

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Export assignments error:', error);
        res.status(500).json({ message: 'Server error exporting assignments' });
    }
};

// @desc    Run auto-close job (Cron/Manual)
// @route   GET /api/admin/cron/auto-close
// @access  Public (protected by secret in Vercel) or Admin
export const runAutoCloseJob = async (req, res) => {
    try {
        const now = new Date();
        const result = await Session.updateMany(
            {
                attendanceOpen: true,
                attendanceEndTime: { $lt: now }
            },
            {
                $set: { attendanceOpen: false }
            }
        );

        const message = result.modifiedCount > 0
            ? `Auto-closed ${result.modifiedCount} expired session(s).`
            : 'No expired sessions found.';

        console.log(`[Cron] ${message}`);

        if (res) {
            res.status(200).json({ message, modified: result.modifiedCount });
        } else {
            return result;
        }
    } catch (error) {
        console.error('Error in auto-close job:', error);
        if (res) {
            res.status(500).json({ message: 'Error running auto-close job' });
        }
    }
};
