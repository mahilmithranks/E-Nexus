const fs = require('fs');
const path = require('path');

const enc = 'utf8';
const adminFile = path.join(__dirname, 'frontend/src/components/AdminDashboard.jsx');
const studentFile = path.join(__dirname, 'frontend/src/components/StudentDashboard.jsx');

// ── PATCH 1: Fix getOverallAttendance to use correct total (all eligible sessions)
let adminContent = fs.readFileSync(adminFile, enc);

const oldHelper = `    // Helper: compute overall attendance % for a student from progressData
    const getOverallAttendance = (student) => {
        const attSessIds = new Set(attendanceSessions.map(s => s._id));
        const relevant = student.sessions.filter(s => attSessIds.has(s.sessionId));
        const total = relevant.length;
        const attended = relevant.filter(s => s.attendance?.status === 'PRESENT').length;
        if (total === 0) return null;
        return { attended, total, pct: Math.round((attended / total) * 100) };
    };`;

const newHelper = `    // Helper: compute overall attendance % for a student
    // total = ALL eligible sessions Day 1-8 (including non-opened/future days)
    // attended = sessions where student is PRESENT
    const getOverallAttendance = (student) => {
        const total = attendanceSessions.length; // full denominator — all eligible sessions
        if (total === 0) return null;
        const attSessIds = new Set(attendanceSessions.map(s => s._id));
        const attended = student.sessions.filter(s =>
            attSessIds.has(s.sessionId) && s.attendance?.status === 'PRESENT'
        ).length;
        return { attended, total, pct: Math.round((attended / total) * 100) };
    };`;

if (adminContent.includes(oldHelper)) {
    adminContent = adminContent.replace(oldHelper, newHelper);
    console.log('✅ Admin: getOverallAttendance fixed to use full session total');
} else {
    console.log('❌ Admin: helper not found — checking raw content');
    const idx = adminContent.indexOf('const getOverallAttendance');
    if (idx >= 0) console.log('Found at:', adminContent.substring(idx, idx + 400));
}

// ── PATCH 2: Add 5s polling for attendance tab in admin (if not already present)
if (!adminContent.includes('setInterval(() => fetchProgress')) {
    const pollTarget = '    }, [activeTab, searchTerm]);\n\n    // Auto-close polling';
    const pollReplacement = `    }, [activeTab, searchTerm]);

    // Real-time polling: refresh attendance data every 5s when on attendance tab
    useEffect(() => {
        if (activeTab !== 'attendance') return;
        const iv = setInterval(() => fetchProgress(pagination.currentPage, searchTerm), 5000);
        return () => clearInterval(iv);
    }, [activeTab, pagination.currentPage, searchTerm]);

    // Auto-close polling`;

    if (adminContent.includes(pollTarget)) {
        adminContent = adminContent.replace(pollTarget, pollReplacement);
        console.log('✅ Admin: 5s polling added');
    } else {
        // Try CRLF version
        const pollTargetCRLF = '    }, [activeTab, searchTerm]);\r\n\r\n    // Auto-close polling';
        const pollReplacementCRLF = `    }, [activeTab, searchTerm]);\r\n\r\n    // Real-time polling: refresh attendance data every 5s when on attendance tab\r\n    useEffect(() => {\r\n        if (activeTab !== 'attendance') return;\r\n        const iv = setInterval(() => fetchProgress(pagination.currentPage, searchTerm), 5000);\r\n        return () => clearInterval(iv);\r\n    }, [activeTab, pagination.currentPage, searchTerm]);\r\n\r\n    // Auto-close polling`;
        if (adminContent.includes(pollTargetCRLF)) {
            adminContent = adminContent.replace(pollTargetCRLF, pollReplacementCRLF);
            console.log('✅ Admin: 5s polling added (CRLF)');
        } else {
            console.log('⚠️  Admin: poll target not found, skipping');
        }
    }
} else {
    console.log('✅ Admin: polling already present');
}

fs.writeFileSync(adminFile, adminContent, enc);
console.log('✅ Admin file saved');

// ── PATCH 3: Add 5s polling for student fetchAttendanceSummary
let studentContent = fs.readFileSync(studentFile, enc);

if (!studentContent.includes('fetchAttendanceSummary interval') && !studentContent.includes('fetchAttendanceSummary, 5000')) {
    // Add a polling useEffect right after the existing fetchAttendanceSummary function
    const pollTarget = `    const fetchAttendanceSummary = async () => {
        try {
            const response = await api.get('/student/attendance-summary');
            setAttendanceSummary(response.data);
        } catch (err) {
            console.warn('Could not fetch attendance summary:', err);
        }
    };`;

    const pollReplacement = `    const fetchAttendanceSummary = async () => {
        try {
            const response = await api.get('/student/attendance-summary');
            setAttendanceSummary(response.data);
        } catch (err) {
            console.warn('Could not fetch attendance summary:', err);
        }
    };

    // Poll attendance summary every 5s for real-time updates
    useEffect(() => {
        const iv = setInterval(fetchAttendanceSummary, 5000);
        return () => clearInterval(iv);
    }, []);`;

    if (studentContent.includes(pollTarget)) {
        studentContent = studentContent.replace(pollTarget, pollReplacement);
        console.log('✅ Student: 5s attendance polling added');
    } else {
        // Try CRLF
        const pollTargetCRLF = `    const fetchAttendanceSummary = async () => {\r\n        try {\r\n            const response = await api.get('/student/attendance-summary');\r\n            setAttendanceSummary(response.data);\r\n        } catch (err) {\r\n            console.warn('Could not fetch attendance summary:', err);\r\n        }\r\n    };`;
        const pollReplacementCRLF = pollTargetCRLF + `\r\n\r\n    // Poll attendance summary every 5s for real-time updates\r\n    useEffect(() => {\r\n        const iv = setInterval(fetchAttendanceSummary, 5000);\r\n        return () => clearInterval(iv);\r\n    }, []);`;
        if (studentContent.includes(pollTargetCRLF)) {
            studentContent = studentContent.replace(pollTargetCRLF, pollReplacementCRLF);
            console.log('✅ Student: 5s attendance polling added (CRLF)');
        } else {
            console.log('⚠️  Student: poll target not found');
            const idx = studentContent.indexOf('fetchAttendanceSummary');
            if (idx >= 0) console.log('Found fetchAttendanceSummary at:', studentContent.substring(idx, idx + 300));
        }
    }
} else {
    console.log('✅ Student: polling already present');
}

fs.writeFileSync(studentFile, studentContent, enc);
console.log('✅ Student file saved');
console.log('\n🎉 All patches applied!');
