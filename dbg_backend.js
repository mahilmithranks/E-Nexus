const fs = require('fs');
const enc = 'utf8';
const file = 'd:/Project/E-Nexus/backend/controllers/studentController.js';
let c = fs.readFileSync(file, enc);

// Show current getAttendanceSummary function start
const fnIdx = c.indexOf('export const getAttendanceSummary');
console.log('Function found at index:', fnIdx);
if (fnIdx >= 0) {
    console.log('First 1500 chars of fn:');
    console.log(JSON.stringify(c.substring(fnIdx, fnIdx + 1500)));
}
