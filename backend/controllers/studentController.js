import Day from '../models/Day.js';
import Session from '../models/Session.js';
import Attendance from '../models/Attendance.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';
import User from '../models/User.js';
import { clearCache } from '../middleware/cache.js';

// @desc    Get enabled days only
// @route   GET /api/student/days
// @access  Private/Student
export const getEnabledDays = async (req, res) => {
    try {
        // Return all days so they can be displayed (even if locked)
        const days = await Day.find().sort({ dayNumber: 1 });
        res.json(days);
    } catch (error) {
        console.error('Get enabled days error:', error);
        res.status(500).json({ message: 'Server error fetching days' });
    }
};

// @desc    Get sessions for a specific day
// @route   GET /api/student/sessions/:dayId
// @access  Private/Student
export const getSessionsForDay = async (req, res) => {
    try {
        const { dayId } = req.params;

        // Verify day exists and is open
        const day = await Day.findById(dayId).lean();
        if (!day) {
            return res.status(404).json({ message: 'Day not found' });
        }

        if (day.status === 'LOCKED') {
            return res.status(403).json({ message: 'This day is not accessible yet' });
        }

        // LAZY CLOSING: Automatically close expired sessions for this day
        const now = new Date();
        const expiredResult = await Session.updateMany(
            { dayId, attendanceOpen: true, attendanceEndTime: { $lt: now } },
            { $set: { attendanceOpen: false } }
        );

        if (expiredResult.modifiedCount > 0) {
            console.log(`Lazy-closed ${expiredResult.modifiedCount} expired sessions for day ${dayId}`);
            clearCache('admin-sessions');
            clearCache('student-sessions');
            clearCache('admin-progress');
        }

        // Fetch all sessions for determination
        const sessions = await Session.find({ dayId }).sort({ createdAt: 1 }).lean();
        const sessionIds = sessions.map(s => s._id);

        // Batch fetch attendance and submissions
        const [attendances, submissions] = await Promise.all([
            Attendance.find({
                registerNumber: req.user.registerNumber,
                sessionId: { $in: sessionIds }
            }).lean(),
            AssignmentSubmission.find({
                registerNumber: req.user.registerNumber,
                sessionId: { $in: sessionIds }
            }).lean()
        ]);

        // Create lookups for faster access
        const attendanceMap = new Map(attendances.map(a => [a.sessionId.toString(), a]));
        const submissionMap = new Map();

        submissions.forEach(s => {
            const sessId = s.sessionId.toString();
            if (!submissionMap.has(sessId)) {
                submissionMap.set(sessId, new Set());
            }
            submissionMap.get(sessId).add(s.assignmentTitle);
        });

        const sessionsWithStatus = sessions.map((session) => {
            try {
                const sessId = session._id.toString();
                const attendance = attendanceMap.get(sessId);
                const submittedTitles = submissionMap.get(sessId) || new Set();

                // Determine attendance window status
                let attendanceWindowStatus = 'not_started';
                if (session.attendanceOpen) {
                    attendanceWindowStatus = 'active';
                } else if (session.attendanceStartTime && session.attendanceEndTime && new Date() > new Date(session.attendanceEndTime)) {
                    attendanceWindowStatus = 'closed';
                }

                // Safety checks for methods and properties
                // For lean objects, we use the property directly if the method was pre-calculated or not available
                const isAttendanceActive = !!(session.attendanceOpen &&
                    session.attendanceStartTime &&
                    session.attendanceEndTime &&
                    new Date() >= new Date(session.attendanceStartTime) &&
                    new Date() <= new Date(session.attendanceEndTime));

                const assignmentsCount = Array.isArray(session.assignments)
                    ? session.assignments.length
                    : 0;

                return {
                    ...session,
                    hasAttendance: !!attendance,
                    attendanceStatus: attendanceWindowStatus,
                    isAttendanceActive: isAttendanceActive,
                    attendanceEndTime: session.attendanceEndTime,
                    assignmentsSubmitted: Array.from(submittedTitles),
                    totalAssignments: assignmentsCount
                };
            } catch (err) {
                console.error(`Error processing session ${session._id}:`, err);
                return {
                    ...session,
                    hasAttendance: false,
                    attendanceStatus: 'error',
                    isAttendanceActive: false,
                    assignmentsSubmitted: 0,
                    totalAssignments: 0
                };
            }
        });

        res.json(sessionsWithStatus);
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ message: 'Server error fetching sessions', error: error.message });
    }
};

// @desc    Get single session details
// @route   GET /api/student/session/:sessionId
// @access  Private/Student
export const getSession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await Session.findById(sessionId).populate('dayId');
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        // Check availability logic
        if (session.dayId.status === 'LOCKED') {
            return res.status(403).json({ message: 'This session is not currently accessible' });
        }

        // Get student status
        const attendance = await Attendance.findOne({
            registerNumber: req.user.registerNumber,
            sessionId
        });

        const submissions = await AssignmentSubmission.find({
            registerNumber: req.user.registerNumber,
            sessionId
        });

        const sessionData = {
            ...session.toObject(),
            hasAttendance: !!attendance,
            attendanceStatus: attendance ? attendance.status : null,
            isAttendanceActive: session.isAttendanceActive(),
            assignmentsSubmitted: submissions.map(s => s.assignmentTitle),
            submissions: submissions
        };

        res.json(sessionData);
    } catch (error) {
        console.error('Get session error:', error);
        res.status(500).json({ message: 'Server error fetching session' });
    }
};

// @desc    Mark attendance with photo
// @route   POST /api/student/attendance
// @access  Private/Student
export const markAttendance = async (req, res) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({ message: 'Session ID is required' });
        }

        // Get session
        const session = await Session.findById(sessionId).populate('dayId');
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        // Check if day is open
        if (session.dayId.status !== 'OPEN') {
            return res.status(403).json({ message: 'This day is not open for attendance' });
        }

        // Check if attendance window is active (be permissive: allow if flag is true OR time is within window)
        if (!session.attendanceOpen && !session.isAttendanceActive()) {
            return res.status(403).json({
                message: 'Attendance window is not active for this session'
            });
        }

        // Check if already marked
        const existingAttendance = await Attendance.findOne({
            registerNumber: req.user.registerNumber,
            sessionId
        });

        if (existingAttendance) {
            return res.status(400).json({ message: 'Attendance already marked for this session' });
        }

        // Check if photo was uploaded
        if (!req.file) {
            return res.status(400).json({ message: 'Photo is required for attendance' });
        }

        let photoPath = null;

        // Upload to Cloudinary (required for Vercel serverless)
        try {
            const cloudinary = (await import('../config/cloudinary.js')).default;

            // Convert buffer to base64 for Cloudinary upload
            const b64 = Buffer.from(req.file.buffer).toString('base64');
            const dataURI = `data:${req.file.mimetype};base64,${b64}`;

            const result = await cloudinary.uploader.upload(dataURI, {
                folder: 'e-nexus/attendance',
                resource_type: 'image',
                transformation: [
                    { width: 800, height: 800, crop: 'limit' },
                    { quality: 'auto' }
                ]
            });

            photoPath = result.secure_url;
            console.log('Photo uploaded to Cloudinary:', photoPath);
        } catch (cloudinaryError) {
            console.error('Cloudinary upload failed:', cloudinaryError);
            return res.status(500).json({
                message: 'Failed to upload photo. Please try again.'
            });
        }

        // Create attendance record
        const attendance = await Attendance.create({
            registerNumber: req.user.registerNumber,
            sessionId,
            status: 'PRESENT',
            photoPath: photoPath,
            timestamp: new Date()
        });

        // Clear admin progress cache
        clearCache('admin-progress');

        res.status(201).json({
            message: 'Attendance marked successfully',
            attendance
        });
    } catch (error) {
        console.error('Mark attendance error stack:', error.stack);
        console.error('Mark attendance full error:', error);

        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Attendance already marked for this session' });
        }

        res.status(500).json({
            message: 'Server error marking attendance',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// @desc    Submit assignment
// @route   POST /api/student/assignment
// @access  Private/Student
export const submitAssignment = async (req, res) => {
    try {
        const { sessionId, assignmentTitle, assignmentType, response } = req.body;

        if (!sessionId || !assignmentTitle || !assignmentType) {
            return res.status(400).json({
                message: 'Session ID, assignment title, and type are required'
            });
        }

        // Verify session exists
        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        // Check if student has marked attendance for this session (skip for certificate)
        if (assignmentType !== 'certificate') {
            const attendance = await Attendance.findOne({
                registerNumber: req.user.registerNumber,
                sessionId,
                status: 'PRESENT'
            });

            if (!attendance) {
                return res.status(403).json({
                    message: 'You must mark attendance before submitting assignments'
                });
            }
        }

        // Handle file upload for file type assignments or certificates
        let finalResponse = response;
        let filePaths = [];

        if (assignmentType === 'file' || assignmentType === 'certificate') {
            const filesToUpload = req.files || (req.file ? [req.file] : []);

            if (filesToUpload.length > 0) {
                try {
                    const cloudinary = (await import('../config/cloudinary.js')).default;

                    for (const file of filesToUpload) {
                        // Use buffer for memory storage (which is likely what multer is using here based on previous code)
                        // If previous code was using req.file.path it would be different, but it used buffer.
                        if (!file.buffer) continue;

                        const b64 = Buffer.from(file.buffer).toString('base64');
                        const dataURI = `data:${file.mimetype};base64,${b64}`;

                        const result = await cloudinary.uploader.upload(dataURI, {
                            folder: assignmentType === 'certificate' ? 'e-nexus/certificates' : 'e-nexus/assignments',
                            resource_type: 'auto'
                        });

                        filePaths.push(result.secure_url);
                    }
                    if (filePaths.length > 0) {
                        finalResponse = filePaths[0]; // Set first file as response for backward compatibility
                    }
                } catch (cloudinaryError) {
                    console.error('Cloudinary assignment upload failed:', cloudinaryError);
                    return res.status(500).json({ message: 'Failed to upload assignment files' });
                }
            }
        }

        if (!finalResponse && filePaths.length === 0) {
            return res.status(400).json({ message: 'Assignment response is required' });
        }

        // Create assignment submission
        const submission = await AssignmentSubmission.create({
            registerNumber: req.user.registerNumber,
            sessionId,
            assignmentTitle,
            assignmentType,
            response: finalResponse,
            files: filePaths,
            submittedAt: new Date()
        });

        // Clear admin progress cache
        clearCache('admin-progress');

        res.status(201).json({
            message: 'Assignment submitted successfully',
            submission
        });
    } catch (error) {
        console.error('Submit assignment error:', error);
        res.status(500).json({ message: 'Server error submitting assignment' });
    }
};

// @desc    Get student profile and progress
// @route   GET /api/student/profile
// @access  Private/Student
export const getProfile = async (req, res) => {
    try {
        const student = await User.findById(req.user.id).select('-password');

        // Get attendance records
        const attendanceRecords = await Attendance.find({
            registerNumber: req.user.registerNumber
        }).populate('sessionId');

        // Get assignment submissions
        const submissions = await AssignmentSubmission.find({
            registerNumber: req.user.registerNumber
        }).populate('sessionId');

        res.json({
            student,
            attendanceCount: attendanceRecords.length,
            assignmentsSubmitted: submissions.length,
            attendanceRecords,
            submissions
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error fetching profile' });
    }
};
