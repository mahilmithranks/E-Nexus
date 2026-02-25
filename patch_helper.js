const fs = require('fs');
const path = require('path');
const enc = 'utf8';

// ── Fix getOverallAttendance
const adminFile = path.join(__dirname, 'frontend/src/components/AdminDashboard.jsx');
let c = fs.readFileSync(adminFile, enc);

// Match the exact block (handles both LF and CRLF)
const oldHelper = /\/\/ Helper: compute overall attendance % for a student from progressData\r?\n    const getOverallAttendance = \(student\) => \{\r?\n        const attSessIds = new Set\(attendanceSessions\.map\(s => s\._id\)\);\r?\n        const relevant = student\.sessions\.filter\(s => attSessIds\.has\(s\.sessionId\)\);\r?\n        const total = relevant\.length;\r?\n        const attended = relevant\.filter\(s => s\.attendance\?\.status === 'PRESENT'\)\.length;\r?\n        if \(total === 0\) return null;\r?\n        return \{ attended, total, pct: Math\.round\(\(attended \/ total\) \* 100\) \};\r?\n    \};/;

const newHelper = `// Helper: compute overall attendance % for a student
    // total = ALL eligible sessions Day 1-8 (including non-opened/future days)
    const getOverallAttendance = (student) => {
        const total = attendanceSessions.length; // full set incl. future/locked days
        if (total === 0) return null;
        const attSessIds = new Set(attendanceSessions.map(s => s._id));
        const attended = student.sessions.filter(s =>
            attSessIds.has(s.sessionId) && s.attendance?.status === 'PRESENT'
        ).length;
        return { attended, total, pct: Math.round((attended / total) * 100) };
    };`;

if (oldHelper.test(c)) {
    c = c.replace(oldHelper, newHelper);
    console.log('✅ getOverallAttendance fixed — uses full session total');
} else {
    console.log('❌ Regex did not match. Trying simpler replace on line 80-81...');
    // Simpler targeted fix: just change the total line
    c = c.replace(
        /const relevant = student\.sessions\.filter\(s => attSessIds\.has\(s\.sessionId\)\);\r?\n        const total = relevant\.length;\r?\n        const attended = relevant\.filter\(s => s\.attendance\?\.status === 'PRESENT'\)\.length;\r?\n        if \(total === 0\) return null;/,
        `const total = attendanceSessions.length; // all eligible sessions incl. future days\r\n        if (total === 0) return null;\r\n        const attended = student.sessions.filter(s =>\r\n            attSessIds.has(s.sessionId) && s.attendance?.status === 'PRESENT'\r\n        ).length;`
    );
    console.log('Applied targeted fix');
}

fs.writeFileSync(adminFile, c, enc);
console.log('✅ Admin file saved');

// Verify
const check = fs.readFileSync(adminFile, enc);
console.log('attendanceSessions.length present:', check.includes('attendanceSessions.length'));
console.log('relevant.length present (should be false):', check.includes('relevant.length'));
