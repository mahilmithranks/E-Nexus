const fs = require('fs');
const enc = 'utf8';
const file = 'd:/Project/E-Nexus/backend/controllers/studentController.js';
let c = fs.readFileSync(file, enc);

// Replace entire getAttendanceSummary body with a new robust version using regex
const newFn = `export const getAttendanceSummary = async (req, res) => {
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
};`;

// Replace the entire function using regex
const fnRegex = /export const getAttendanceSummary = async[\s\S]*?^};/m;
if (fnRegex.test(c)) {
    c = c.replace(fnRegex, newFn);
    console.log('✅ Function replaced via regex');
} else {
    // If above fails, find by function start and next exported function
    const start = c.indexOf('\nexport const getAttendanceSummary');
    const end = c.indexOf('\nexport const getProfile');
    if (start >= 0 && end >= 0) {
        c = c.substring(0, start + 1) + newFn + '\n\n' + c.substring(end + 1);
        console.log('✅ Function replaced by index-based splice');
    } else {
        console.log('❌ Could not find markers');
        console.log('start:', start, 'end:', end);
    }
}

fs.writeFileSync(file, c, enc);
const v = fs.readFileSync(file, enc);
console.log('PRESENT filter:', v.includes("status: 'PRESENT'"));
console.log('dayNumber >= 1:', v.includes('dayNumber: { $gte: 1 }'));
console.log('Function still exists:', v.includes('getAttendanceSummary'));
