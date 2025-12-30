import Day from '../models/Day.js';
import Session from '../models/Session.js';
import Attendance from '../models/Attendance.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';
import User from '../models/User.js';

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
        const day = await Day.findById(dayId);
        if (!day) {
            return res.status(404).json({ message: 'Day not found' });
        }

        if (day.status !== 'OPEN') {
            return res.status(403).json({ message: 'This day is not accessible' });
        }

        const sessions = await Session.find({ dayId }).sort({ createdAt: 1 });

        // For each session, check if student has marked attendance
        const sessionsWithStatus = await Promise.all(
            sessions.map(async (session) => {
                const attendance = await Attendance.findOne({
                    registerNumber: req.user.registerNumber,
                    sessionId: session._id
                });

                const submissions = await AssignmentSubmission.find({
                    registerNumber: req.user.registerNumber,
                    sessionId: session._id
                });

                // Get unique submitted assignment titles
                const uniqueTitles = new Set(submissions.map(s => s.assignmentTitle));

                // Determine attendance window status
                let attendanceWindowStatus = 'not_started';
                if (session.attendanceOpen) {
                    attendanceWindowStatus = 'active';
                } else if (session.attendanceEndTime && new Date() > new Date(session.attendanceEndTime)) {
                    attendanceWindowStatus = 'closed';
                }

                return {
                    ...session.toObject(),
                    hasAttendance: !!attendance,
                    attendanceStatus: attendanceWindowStatus,
                    isAttendanceActive: session.isAttendanceActive(),
                    attendanceEndTime: session.attendanceEndTime,
                    assignmentsSubmitted: uniqueTitles.size,
                    totalAssignments: session.assignments.length
                };
            })
        );

        res.json(sessionsWithStatus);
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ message: 'Server error fetching sessions' });
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
        if (session.dayId.status !== 'OPEN') {
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

        // Check if attendance window is active
        if (!session.isAttendanceActive()) {
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

        let photoPath = req.file.path; // Default to local path

        // Try to upload to Cloudinary if configured
        try {
            if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
                const cloudinary = (await import('../config/cloudinary.js')).default;
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'e-nexus/attendance',
                    resource_type: 'image',
                    transformation: [
                        { width: 800, height: 800, crop: 'limit' },
                        { quality: 'auto' }
                    ]
                });
                photoPath = result.secure_url; // Use Cloudinary URL
                console.log('Photo uploaded to Cloudinary:', photoPath);
            } else {
                console.log('Cloudinary not configured, using local storage');
            }
        } catch (cloudinaryError) {
            console.error('Cloudinary upload failed, falling back to local storage:', cloudinaryError.message);
            // Continue with local path
        }

        // Create attendance record
        const attendance = await Attendance.create({
            registerNumber: req.user.registerNumber,
            sessionId,
            status: 'PRESENT',
            photoPath: photoPath,
            timestamp: new Date()
        });

        res.status(201).json({
            message: 'Attendance marked successfully',
            attendance
        });
    } catch (error) {
        console.error('Mark attendance error:', error);

        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Attendance already marked for this session' });
        }

        res.status(500).json({ message: 'Server error marking attendance' });
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

        // Check if student has marked attendance for this session
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

        // Handle file upload for file type assignments
        let finalResponse = response;
        let filePaths = [];

        if (assignmentType === 'file') {
            if (req.files && req.files.length > 0) {
                filePaths = req.files.map(file => file.path);
                finalResponse = 'Multiple Files Submitted'; // Or just a placeholder
            } else if (req.file) {
                // Fallback for single file upload if route wasn't updated yet (safety)
                filePaths = [req.file.path];
                finalResponse = req.file.path;
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
