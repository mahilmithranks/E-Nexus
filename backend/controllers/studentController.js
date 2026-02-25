import Day from '../models/Day.js';
import Session from '../models/Session.js';
import Attendance from '../models/Attendance.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';
import User from '../models/User.js';
import { clearCache } from '../middleware/cache.js';
// Pre-import cloudinary at module load time instead of dynamic import per-request
import cloudinary from '../config/cloudinary.js';

// @desc    Get enabled days only
// @route   GET /api/student/days
// @access  Private/Student
export const getEnabledDays = async (req, res) => {
    try {
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

        // Parallel: fetch day + sessions simultaneously
        const [day, sessions] = await Promise.all([
            Day.findById(dayId).select('status dayNumber').lean(),
            Session.find({ dayId })
                .populate('dayId', 'dayNumber title')
                .select('title description mode type dayId assignments attendanceOpen attendanceStartTime attendanceEndTime isCertificateUploadOpen startTime endTime')
                .sort({ createdAt: 1 })
                .lean()
        ]);

        if (!day) return res.status(404).json({ message: 'Day not found' });
        if (day.status === 'LOCKED') {
            return res.status(403).json({ message: 'This day is not accessible yet' });
        }

        const sessionIds = sessions.map(s => s._id);

        // Batch fetch attendance and submissions in parallel
        const [attendances, submissions] = await Promise.all([
            Attendance.find({
            registerNumber: req.user.registerNumber,
            sessionId: { $in: sessionIds },
            status: 'PRESENT'
        }).select('sessionId').lean(),
            AssignmentSubmission.find({
                registerNumber: req.user.registerNumber,
                sessionId: { $in: sessionIds }
            }).select('sessionId assignmentTitle response updateCount').lean()
        ]);

        // Create lookups
        const attendanceSet = new Set(attendances.map(a => a.sessionId.toString()));
        const submissionMap = new Map();

        for (const s of submissions) {
            const sessId = s.sessionId.toString();
            if (!submissionMap.has(sessId)) {
                submissionMap.set(sessId, { titles: new Set(), details: [] });
            }
            const item = submissionMap.get(sessId);
            item.titles.add(s.assignmentTitle);
            item.details.push({
                title: s.assignmentTitle,
                response: s.response,
                updateCount: s.updateCount || 0
            });
        }

        const now = new Date();
        const isDay1 = day.dayNumber === 1;

        const sessionsWithStatus = sessions.map((session) => {
            const sessId = session._id.toString();
            const hasAttendance = attendanceSet.has(sessId);
            const submissionData = submissionMap.get(sessId) || { titles: new Set(), details: [] };
            const submittedTitles = Array.from(submissionData.titles);

            // SPECIAL RULE: Day 1 Assessment is always completed
            if (isDay1 && session.title.toLowerCase().includes('assessment')) {
                if (!submittedTitles.includes('Assessment')) submittedTitles.push('Assessment');
            }

            let attendanceWindowStatus = 'not_started';
            if (session.attendanceOpen) {
                attendanceWindowStatus = 'active';
            } else if (session.attendanceStartTime && session.attendanceEndTime && now > new Date(session.attendanceEndTime)) {
                attendanceWindowStatus = 'closed';
            }

            const isAttendanceActive = session.attendanceOpen && (
                !session.attendanceEndTime ||
                (now >= new Date(session.attendanceStartTime) && now <= new Date(session.attendanceEndTime))
            );

            return {
                ...session,
                hasAttendance,
                attendanceStatus: attendanceWindowStatus,
                isAttendanceActive,
                assignmentsSubmitted: submittedTitles,
                submissionDetails: submissionData.details,
                totalAssignments: session.assignments?.length || 0,
                isCertificateUploadOpen: session.title === 'Infosys Certified Course' ? session.isCertificateUploadOpen : false
            };
        });

        res.json(sessionsWithStatus);
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get single session details
// @route   GET /api/student/session/:sessionId
// @access  Private/Student
export const getSession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        // Parallel: session + attendance + submissions
        const [session, attendance, submissions] = await Promise.all([
            Session.findById(sessionId).populate('dayId', 'status dayNumber').lean(),
            Attendance.findOne({
                registerNumber: req.user.registerNumber,
                sessionId
            }).select('status').lean(),
            AssignmentSubmission.find({
                registerNumber: req.user.registerNumber,
                sessionId
            }).lean()
        ]);

        if (!session) return res.status(404).json({ message: 'Session not found' });
        if (session.dayId.status === 'LOCKED') {
            return res.status(403).json({ message: 'This session is not currently accessible' });
        }

        if (session.title.toLowerCase().includes('assessment') && !attendance) {
            return res.status(403).json({
                message: 'Identity verification required. Please mark your attendance first to access this assessment.',
                hasAttendance: false
            });
        }

        const now = new Date();
        const isAttendanceActive = session.attendanceOpen && (
            !session.attendanceEndTime || (now >= new Date(session.attendanceStartTime) && now <= new Date(session.attendanceEndTime))
        );

        // SPECIAL RULE: Day 1 Assessment is always "completed"
        const effectiveSubmissions = [...submissions];
        if (session.dayId.dayNumber === 1 && session.title.toLowerCase().includes('assessment')) {
            if (!effectiveSubmissions.some(s => s.assignmentTitle === 'Assessment')) {
                effectiveSubmissions.push({ assignmentTitle: 'Assessment' });
            }
        }

        res.json({
            ...session,
            hasAttendance: !!attendance,
            attendanceStatus: attendance ? attendance.status : null,
            isAttendanceActive,
            assignmentsSubmitted: effectiveSubmissions.map(s => s.assignmentTitle),
            submissions: effectiveSubmissions
        });
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

        // Parallel fetch session + existing attendance record
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

        const now = new Date();
        const isAttendanceActive = session.attendanceOpen && (
            !session.attendanceEndTime || (now >= new Date(session.attendanceStartTime) && now <= new Date(session.attendanceEndTime))
        );

        if (!session.attendanceOpen && !isAttendanceActive) {
            return res.status(403).json({ message: 'Attendance window closed' });
        }

        // Upload to Cloudinary (pre-imported module)
        let photoPath = null;
        try {
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

        const attendance = await Attendance.create({
            registerNumber: req.user.registerNumber,
            sessionId,
            status: 'PRESENT',
            photoPath,
            timestamp: now
        });

        clearCache('admin-progress');

        res.status(201).json({ message: 'Attendance marked successfully', attendance });
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
            return res.status(400).json({ message: 'Session ID, assignment title, and type are required' });
        }

        // Parallel: fetch session + existing submission (and attendance for non-cert)
        const isCertificate = assignmentType === 'certificate';

        const [session, existingSubmission, attendance] = await Promise.all([
            Session.findById(sessionId).select('title assignments isCertificateUploadOpen').lean(),
            AssignmentSubmission.findOne({
                registerNumber: req.user.registerNumber,
                sessionId,
                assignmentTitle
            }).lean(),
            // Only query attendance if needed (not certificate type)
            isCertificate
                ? Promise.resolve(null)
                : Attendance.findOne({
                    registerNumber: req.user.registerNumber,
                    sessionId,
                    status: 'PRESENT'
                }).select('_id').lean()
        ]);

        if (!session) return res.status(404).json({ message: 'Session not found' });

        // Attendance check for non-certificate submissions
        if (!isCertificate && !attendance) {
            return res.status(403).json({ message: 'You must mark attendance before submitting assignments' });
        }

        const isInfosys = session.title === 'Infosys Certified Course';

        if (existingSubmission) {
            if (!isInfosys) {
                const typeLabel = session.title.toLowerCase().includes('assessment') ? 'assessment' : 'assignment';
                return res.status(403).json({
                    message: `This ${typeLabel} response has already been submitted and cannot be edited.`
                });
            } else if (existingSubmission.updateCount >= 1) {
                return res.status(403).json({
                    message: 'You have already used your one-time edit for this certificate.'
                });
            }
        }

        let finalResponse = response;
        let filePaths = [];

        if (assignmentType === 'file') {
            const filesToUpload = req.files || (req.file ? [req.file] : []);
            if (filesToUpload.length > 0) {
                try {
                    // Upload all files in parallel instead of sequentially
                    const uploadResults = await Promise.all(
                        filesToUpload
                            .filter(file => file.buffer)
                            .map(file => {
                                const b64 = Buffer.from(file.buffer).toString('base64');
                                const dataURI = `data:${file.mimetype};base64,${b64}`;
                                return cloudinary.uploader.upload(dataURI, {
                                    folder: 'e-nexus/assignments',
                                    resource_type: 'auto'
                                });
                            })
                    );
                    filePaths = uploadResults.map(r => r.secure_url);
                    if (filePaths.length > 0) finalResponse = filePaths[0];
                } catch (cloudinaryError) {
                    console.error('Cloudinary assignment upload failed:', cloudinaryError);
                    return res.status(500).json({ message: 'Failed to upload assignment files' });
                }
            }
        }

        if (!finalResponse && filePaths.length === 0) {
            return res.status(400).json({ message: 'Assignment response is required' });
        }

        const submission = await AssignmentSubmission.findOneAndUpdate(
            { registerNumber: req.user.registerNumber, sessionId, assignmentTitle },
            {
                assignmentType,
                response: finalResponse,
                files: filePaths,
                submittedAt: new Date(),
                $inc: { updateCount: existingSubmission ? 1 : 0 }
            },
            { new: true, upsert: true }
        );

        // Clear caches
        clearCache('admin-progress');
        clearCache('student-sessions');

        res.status(201).json({ message: 'Assignment submitted successfully', submission });
    } catch (error) {
        console.error('Submit assignment error:', error);
        res.status(500).json({ message: 'Server error submitting assignment' });
    }
};

// @desc    Get overall attendance summary (Day 1 to Day 8, excluding Day 0 and Infosys uploads)
// @route   GET /api/student/attendance-summary
// @access  Private/Student
export const getAttendanceSummary = async (req, res) => {
    try {
        // Fetch ALL days (dayNumber >= 1) -- includes non-opened future days
        const days = await Day.find({ dayNumber: { $gte: 1 } })
            .select('_id dayNumber title status')
            .lean();

        const dayIds = days.map(d => d._id);

        // Get all sessions for those days
        const sessions = dayIds.length > 0 ? await Session.find({ dayId: { $in: dayIds } })
            .populate('dayId', 'dayNumber title')
            .select('_id title type dayId')
            .lean() : [];

        // Exclude BREAK, Infosys, certificate sessions
        const attendanceSessions = sessions.filter(s => {
            const t = (s.title || '').toLowerCase();
            return s.type !== 'BREAK' && t !== 'infosys certified course' &&
                !t.includes('certificate') && !t.includes('infosys') && t !== 'lunch';
        });

        const total = attendanceSessions.length;

        if (total === 0) {
            return res.json({ attended: 0, total: 0, percentage: 0, sessionBreakdown: [] });
        }

        const sessionIds = attendanceSessions.map(s => s._id);

        // Count only PRESENT records (camera-verified + admin overrides)
        const attendanceRecords = await Attendance.find({
            registerNumber: req.user.registerNumber,
            sessionId: { $in: sessionIds },
            status: 'PRESENT'
        }).select('sessionId').lean();

        const attendedSet = new Set(attendanceRecords.map(a => a.sessionId.toString()));
        const attended = attendanceRecords.length;
        const percentage = Math.round((attended / total) * 100);

        // Breakdown per day
        const dayMap = {};
        for (const day of days) {
            dayMap[day._id.toString()] = { dayNumber: day.dayNumber, title: day.title, total: 0, attended: 0 };
        }
        for (const session of attendanceSessions) {
            const dayKey = session.dayId?._id?.toString() || session.dayId?.toString();
            if (dayMap[dayKey]) {
                dayMap[dayKey].total++;
                if (attendedSet.has(session._id.toString())) {
                    dayMap[dayKey].attended++;
                }
            }
        }

        const sessionBreakdown = Object.values(dayMap)
            .filter(d => d.total > 0)
            .sort((a, b) => a.dayNumber - b.dayNumber);

        res.json({ attended, total, percentage, sessionBreakdown });
    } catch (error) {
        console.error('Get attendance summary error:', error);
        res.status(500).json({ message: 'Server error fetching attendance summary' });
    }
};

// @desc    Get student profile and progress
// @route   GET /api/student/profile
// @access  Private/Student
export const getProfile = async (req, res) => {
    try {
        // Parallel fetch with lean + minimal field selection
        const [student, attendanceRecords, submissions] = await Promise.all([
            User.findById(req.user.id).select('-password').lean(),
            Attendance.find({ registerNumber: req.user.registerNumber })
                .select('sessionId status timestamp')
                .populate('sessionId', 'title dayId')
                .lean(),
            AssignmentSubmission.find({ registerNumber: req.user.registerNumber })
                .select('sessionId assignmentTitle submittedAt')
                .populate('sessionId', 'title dayId')
                .lean()
        ]);

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
