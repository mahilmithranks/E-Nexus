const fs = require('fs');
const enc = 'utf8';
const file = 'd:/Project/E-Nexus/frontend/src/components/StudentDashboard.jsx';
let c = fs.readFileSync(file, enc);

// The issue: fetchAttendanceSummary is defined AFTER it's called in useEffect
// AND it's indented incorrectly (inside the useEffect closure)
// Current broken structure (from LF perspective):
//   useEffect(() => { fetchDays(); fetchAttendanceSummary(); }, []);
//         const fetchAttendanceSummary = ...   <-- inside the block! (indented wrong)

// Show around lines 55-78 (index based)
const lines = c.split('\n');
for (let i = 52; i < 82; i++) {
    console.log(`L${i + 1}: ${lines[i]}`);
}
