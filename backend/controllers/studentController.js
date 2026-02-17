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
        const days = await Day.find().select('dayNumber title status date').sort({ dayNumber: 1 }).lean();
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
        const day = await Day.findById(dayId).select('status dayNumber').lean();
        if (!day) {
            return res.status(404).json({ message: 'Day not found' });
        }

        if (day.status === 'LOCKED') {
            return res.status(403).json({ message: 'This day is not accessible yet' });
        }

        // OPTIMIZATION: Removed blocking lazy-close. Background job (server.js/cron) handles this.

        // Fetch all sessions for determination
        const sessions = await Session.find({ dayId }).sort({ createdAt: 1 }).lean();
        const sessionIds = sessions.map(s => s._id);

        // Batch fetch attendance and submissions
        const [attendances, submissions] = await Promise.all([
            Attendance.find({
                registerNumber: req.user.registerNumber,
                sessionId: { $in: sessionIds }
            }).select('sessionId status').lean(),
            AssignmentSubmission.find({
                registerNumber: req.user.registerNumber,
                sessionId: { $in: sessionIds }
            }).select('sessionId assignmentTitle response updateCount').lean()
        ]);

        // Create lookups for faster access
        const attendanceMap = new Map();
        attendances.forEach(a => attendanceMap.set(a.sessionId.toString(), a));

        const submissionMap = new Map();
        submissions.forEach(s => {
            const sessId = s.sessionId.toString();
            if (!submissionMap.has(sessId)) {
                submissionMap.set(sessId, { titles: new Set(), details: [] });
            }
            submissionMap.get(sessId).titles.add(s.assignmentTitle);
            submissionMap.get(sessId).details.push({
                title: s.assignmentTitle,
                response: s.response,
                updateCount: s.updateCount || 0
            });
        });

        const now = new Date();

        const sessionsWithStatus = sessions.map((session) => {
            try {
                const sessId = session._id.toString();
                const attendance = attendanceMap.get(sessId);
                const submissionData = submissionMap.get(sessId) || { titles: new Set(), details: [] };
                const submittedTitles = submissionData.titles;

                // SPECIAL RULE: Day 1 Assessment is always "completed" for everyone
                if (day.dayNumber === 1 && session.title.toLowerCase().includes('assessment')) {
                    submittedTitles.add('Assessment');
                }

                // Determine attendance window status
                let attendanceWindowStatus = 'not_started';

                if (session.attendanceOpen) {
                    attendanceWindowStatus = 'active';
                } else if (session.attendanceEndTime && now > new Date(session.attendanceEndTime)) {
                    attendanceWindowStatus = 'closed';
                }

                // If marked attendance, it's always 'active' from student perspective (or 'marked')
                // but let's stick to the window status and let frontend handle 'hasAttendance'
                const isAttendanceActive = session.attendanceOpen && (
                    !session.attendanceEndTime ||
                    (now >= new Date(session.attendanceStartTime) && now <= new Date(session.attendanceEndTime))
                );

                const assignmentsCount = Array.isArray(session.assignments)
                    ? session.assignments.length
                    : 0;

                return {
                    ...session,
                    hasAttendance: !!attendance,
                    attendanceStatus: attendanceWindowStatus,
                    isAttendanceActive: isAttendanceActive,
                    assignmentsSubmitted: Array.from(submittedTitles),
                    submissionDetails: submissionData.details,
                    totalAssignments: assignmentsCount,
                    isCertificateUploadOpen: session.title === "Infosys Certified Course" ? session.isCertificateUploadOpen : false
                };
            } catch (err) {
                console.error(`Error processing session ${session._id}:`, err);
                return session;
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

        // Use lean for performance
        const session = await Session.findById(sessionId).populate('dayId', 'status dayNumber').lean();
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        if (session.dayId.status === 'LOCKED') {
            return res.status(403).json({ message: 'This session is not currently accessible' });
        }

        const [attendance, submissions] = await Promise.all([
            Attendance.findOne({
                registerNumber: req.user.registerNumber,
                sessionId
            }).select('status').lean(),
            AssignmentSubmission.find({
                registerNumber: req.user.registerNumber,
                sessionId
            }).lean()
        ]);

        if (session.title.toLowerCase().includes('assessment') && !attendance) {
            return res.status(403).json({
                message: 'Identity verification required. Please mark your attendance first to access this assessment.',
                hasAttendance: false
            });
        }

        // Re-construct logic for lean object
        const now = new Date();
        const isAttendanceActive = session.attendanceOpen && (
            !session.attendanceEndTime || (now >= new Date(session.attendanceStartTime) && now <= new Date(session.attendanceEndTime))
        );

        // SPECIAL RULE: Day 1 Assessment is always "completed" for everyone
        const effectiveSubmissions = [...submissions];
        if (session.dayId.dayNumber === 1 && session.title.toLowerCase().includes('assessment')) {
            if (!effectiveSubmissions.some(s => s.assignmentTitle === 'Assessment')) {
                effectiveSubmissions.push({ assignmentTitle: 'Assessment' });
            }
        }

        const sessionData = {
            ...session,
            hasAttendance: !!attendance,
            attendanceStatus: attendance ? attendance.status : null,
            isAttendanceActive,
            assignmentsSubmitted: effectiveSubmissions.map(s => s.assignmentTitle),
            submissions: effectiveSubmissions
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

        if (!sessionId) return res.status(400).json({ message: 'Session ID is required' });
        if (!req.file) return res.status(400).json({ message: 'Photo is required' });

        // Parallel fetch with LEAN
        const [session, existingAttendance] = await Promise.all([
            Session.findById(sessionId).populate('dayId', 'status').lean(),
            Attendance.findOne({
                registerNumber: req.user.registerNumber,
                sessionId
            }).select('_id').lean()
        ]);

        if (!session) return res.status(404).json({ message: 'Session not found' });
        if (existingAttendance) return res.status(400).json({ message: 'Attendance already marked' });
        if (session.dayId.status !== 'OPEN') return res.status(403).json({ message: 'Day not open' });

        // Logic check for active window
        const now = new Date();
        const isAttendanceActive = session.attendanceOpen && (
            !session.attendanceEndTime || (now >= new Date(session.attendanceStartTime) && now <= new Date(session.attendanceEndTime))
        );

        if (!session.attendanceOpen && !isAttendanceActive) {
            return res.status(403).json({ message: 'Attendance window closed' });
        }

        // Upload
        let photoPath = null;
        try {
            const cloudinary = (await import('../config/cloudinary.js')).default;
            const b64 = Buffer.from(req.file.buffer).toString('base64');
            const dataURI = `data:${req.file.mimetype};base64,${b64}`;

            const result = await cloudinary.uploader.upload(dataURI, {
                folder: 'e-nexus/attendance',
                resource_type: 'image',
                transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }]
            });
            photoPath = result.secure_url;
        } catch (err) {
            console.error('Cloudinary error:', err);
            return res.status(500).json({ message: 'Photo upload failed' });
        }

        // Create record
        const attendance = await Attendance.create({
            registerNumber: req.user.registerNumber,
            sessionId,
            status: 'PRESENT',
            photoPath: photoPath,
            timestamp: now
        });

        clearCache('admin-progress');

        res.status(201).json({
            message: 'Attendance marked successfully',
            attendance
        });
    } catch (error) {
        console.error('Mark attendance error:', error);
        if (error.code === 11000) return res.status(400).json({ message: 'Attendance already marked' });
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

        // Finality & Limit Check
        const isInfosys = session.title === "Infosys Certified Course";
        const existingSubmission = await AssignmentSubmission.findOne({
            registerNumber: req.user.registerNumber,
            sessionId,
            assignmentTitle
        });

        if (existingSubmission) {
            if (!isInfosys) {
                const typeLabel = session.title.toLowerCase().includes('assessment') ? 'assessment' : 'assignment';
                return res.status(403).json({
                    message: `This ${typeLabel} response has already been submitted and cannot be edited.`
                });
            } else if (existingSubmission.updateCount >= 1) {
                return res.status(403).json({
                    message: "You have already used your one-time edit for this certificate."
                });
            }
        }

        // Handle file upload for file type assignments only (certificates use Drive links)
        let finalResponse = response;
        let filePaths = [];

        if (assignmentType === 'file') {
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
                            folder: 'e-nexus/assignments',
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
        } else if (assignmentType === 'certificate' || assignmentType === 'link') {
            // For certificates and links, use the provided response (Drive link)
            finalResponse = response;
        }

        if (!finalResponse && filePaths.length === 0) {
            return res.status(400).json({ message: 'Assignment response is required' });
        }

        // Use findOneAndUpdate to allow limited re-submissions
        const submission = await AssignmentSubmission.findOneAndUpdate(
            {
                registerNumber: req.user.registerNumber,
                sessionId,
                assignmentTitle
            },
            {
                assignmentType,
                response: finalResponse,
                files: filePaths,
                submittedAt: new Date(),
                $inc: { updateCount: existingSubmission ? 1 : 0 }
            },
            { new: true, upsert: true }
        );

        // Clear admin progress cache
        clearCache('admin-progress');
        clearCache('student-sessions');

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
