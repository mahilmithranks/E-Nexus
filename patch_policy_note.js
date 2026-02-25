const fs = require('fs');
const enc = 'utf8';
const file = 'd:/Project/E-Nexus/frontend/src/components/StudentDashboard.jsx';
let c = fs.readFileSync(file, enc);

// Find the "Got it" button in the policy modal and insert the note before it
const oldClose = `                        <button
                            onClick={() => setShowPolicyModal(false)}
                            className="mt-6 w-full py-3.5 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-black text-sm uppercase tracking-widest transition-colors"
                        >
                            Got it
                        </button>`;

const newClose = `                        {/* Upcoming sessions note */}
                        <div className="mt-5 p-3.5 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3 items-start">
                            <span className="text-blue-500 text-base shrink-0 mt-0.5">&#9432;</span>
                            <p className="text-xs text-blue-700 font-medium leading-relaxed">
                                <strong className="font-black">Don't worry about future sessions!</strong> Your percentage will automatically update as you attend upcoming sessions. The total includes all Day 1–8 sessions so your score improves with each session you attend.
                            </p>
                        </div>

                        <button
                            onClick={() => setShowPolicyModal(false)}
                            className="mt-4 w-full py-3.5 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-black text-sm uppercase tracking-widest transition-colors"
                        >
                            Got it
                        </button>`;

if (c.includes(oldClose)) {
    c = c.replace(oldClose, newClose);
    console.log('✅ Note added before Got it button');
} else {
    // Try without exact whitespace - find "Got it" button and insert before it
    const gotItBtn = c.indexOf('"Got it"');
    if (gotItBtn >= 0) {
        // Find the opening <button before "Got it"
        const btnStart = c.lastIndexOf('<button', gotItBtn);
        const note = `                        {/* Upcoming sessions note */}\r\n                        <div className="mt-5 p-3.5 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3 items-start">\r\n                            <span className="text-blue-500 text-base shrink-0 mt-0.5">&#9432;</span>\r\n                            <p className="text-xs text-blue-700 font-medium leading-relaxed">\r\n                                <strong className="font-black">Don't worry about future sessions!</strong> Your percentage will automatically update as you attend upcoming sessions. The total includes all Day 1\u20138 sessions so your score improves with each session you attend.\r\n                            </p>\r\n                        </div>\r\n\r\n                        `;
        c = c.substring(0, btnStart) + note + c.substring(btnStart);
        console.log('✅ Note added via index method');
    } else {
        console.log('❌ Could not find Got it button');
    }
}

fs.writeFileSync(file, c, enc);
console.log('Note present:', fs.readFileSync(file, enc).includes("Don't worry about future sessions"));
