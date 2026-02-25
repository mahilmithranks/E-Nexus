const fs = require('fs');
const enc = 'utf8';
const file = 'd:/Project/E-Nexus/frontend/src/components/StudentDashboard.jsx';
let c = fs.readFileSync(file, enc);

const lines = c.split('\n');
for (let i = 52; i < 82; i++) {
    process.stdout.write(`L${i + 1}: `);
    process.stdout.write(JSON.stringify(lines[i]));
    process.stdout.write('\n');
}
