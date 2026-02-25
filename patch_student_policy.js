const fs = require('fs');
const path = require('path');
const enc = 'utf8';

const studentFile = path.join(__dirname, 'frontend/src/components/StudentDashboard.jsx');
let c = fs.readFileSync(studentFile, enc);

// ── 1. Add showPolicyModal state after attendanceSummary state
c = c.replace(
    /const \[attendanceSummary, setAttendanceSummary\] = useState\(null\);/,
    `const [attendanceSummary, setAttendanceSummary] = useState(null);
    const [showPolicyModal, setShowPolicyModal] = useState(false);`
);
console.log('State added:', c.includes('showPolicyModal'));

// ── 2. Replace the entire attendance card block with an enhanced version
const oldCard = /\{\/\* Overall Attendance \*\/\}\s*\{attendanceSummary !== null && \(\s*<div className="p-5 sm:p-6 rounded-2xl sm:rounded-\[2rem\] bg-white\/70 backdrop-blur-xl border border-white\/40 shadow-xl shadow-zinc-200\/50">\s*<p className="text-\[10px\] font-black text-zinc-400 uppercase tracking-\[0\.2em\] mb-3">Overall Attendance<\/p>\s*<div className="flex items-baseline gap-2">\s*<span className=\{[\s\S]*?\}>\s*\{attendanceSummary\.percentage\}%\s*<\/span>\s*<span className="text-sm text-zinc-400 font-semibold">\s*\{attendanceSummary\.attended\}\/\{attendanceSummary\.total\} sessions\s*<\/span>\s*<\/div>\s*<div className="mt-3 w-full h-1\.5 bg-zinc-100 rounded-full overflow-hidden">\s*<div className=\{[\s\S]*?\} style=\{\{[\s\S]*?\}\} \/>\s*<\/div>\s*<p className="text-\[9px\] text-zinc-400 mt-2">\* Day 0 &amp; Infosys sessions excluded<\/p>\s*<\/div>\s*\)\}/;

const newCard = `{/* Overall Attendance */}
                            {attendanceSummary !== null && (
                                <div className="p-5 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl shadow-zinc-200/50">
                                    {/* Header row */}
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Overall Attendance</p>
                                        <span className={\`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border \${
                                            attendanceSummary.percentage >= 75
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                : attendanceSummary.percentage >= 50
                                                ? 'bg-amber-50 text-amber-600 border-amber-200'
                                                : 'bg-red-50 text-red-500 border-red-200'
                                        }\`}>
                                            {attendanceSummary.percentage >= 75 ? 'Good Standing' : attendanceSummary.percentage >= 50 ? 'Needs Improvement' : 'Critical'}
                                        </span>
                                    </div>

                                    {/* Big percentage */}
                                    <div className="flex items-baseline gap-2 mb-3">
                                        <span className={\`text-5xl font-black \${
                                            attendanceSummary.percentage >= 75 ? 'text-emerald-600'
                                            : attendanceSummary.percentage >= 50 ? 'text-amber-500'
                                            : 'text-red-500'
                                        }\`}>
                                            {attendanceSummary.percentage}%
                                        </span>
                                        <span className="text-sm text-zinc-400 font-semibold">
                                            {attendanceSummary.attended}/{attendanceSummary.total} sessions
                                        </span>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden mb-3">
                                        <div
                                            className={\`h-full rounded-full transition-all duration-1000 \${
                                                attendanceSummary.percentage >= 75 ? 'bg-emerald-500'
                                                : attendanceSummary.percentage >= 50 ? 'bg-amber-400'
                                                : 'bg-red-500'
                                            }\`}
                                            style={{width: \`\${attendanceSummary.percentage}%\`}}
                                        />
                                    </div>

                                    {/* Sessions note + policy button */}
                                    <div className="flex items-center justify-between">
                                        <p className="text-[9px] text-zinc-400">* Day 0 &amp; Infosys sessions excluded</p>
                                        <button
                                            onClick={() => setShowPolicyModal(true)}
                                            className="text-[9px] font-black text-indigo-500 uppercase tracking-wider hover:text-indigo-700 transition-colors flex items-center gap-1 underline underline-offset-2"
                                        >
                                            Calculation Policy
                                        </button>
                                    </div>
                                </div>
                            )}`;

if (oldCard.test(c)) {
    c = c.replace(oldCard, newCard);
    console.log('✅ Attendance card replaced with enhanced version');
} else {
    console.log('❌ Card pattern not matched, trying simpler replacement...');
    // Simpler: just add the policy button + status badge before </div> of card
    c = c.replace(
        `<p className="text-[9px] text-zinc-400 mt-2">* Day 0 &amp; Infosys sessions excluded</p>\r\n                                </div>\r\n                            )}`,
        `<div className="flex items-center justify-between mt-2">
                                        <p className="text-[9px] text-zinc-400">* Day 0 &amp; Infosys sessions excluded</p>
                                        <button onClick={() => setShowPolicyModal(true)} className="text-[9px] font-black text-indigo-500 uppercase tracking-wider hover:text-indigo-700 transition-colors underline underline-offset-2">Calculation Policy</button>
                                    </div>
                                </div>
                            )}`
    );
    console.log('Applied simple policy button addition');
}

// ── 3. Add the Policy Modal just before the final return closing  
// Find the closing of the component return and inject modal before it
const modalCode = `
            {/* Attendance Calculation Policy Modal */}
            {showPolicyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowPolicyModal(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl border border-zinc-100 max-w-md w-full p-7" onClick={e => e.stopPropagation()}>
                        <div className="flex items-start justify-between mb-5">
                            <div>
                                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1">Bootcamp Attendance</p>
                                <h2 className="text-xl font-black text-zinc-900">Calculation Policy</h2>
                            </div>
                            <button onClick={() => setShowPolicyModal(false)} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-colors text-sm font-bold">✕</button>
                        </div>

                        <div className="space-y-4 text-sm text-zinc-600">
                            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                <p className="font-black text-indigo-700 text-xs uppercase tracking-wider mb-1">Formula</p>
                                <p className="text-indigo-900 font-bold text-base">Attended Sessions ÷ Total Sessions × 100</p>
                            </div>

                            <div className="space-y-2">
                                <p className="font-black text-zinc-700 text-xs uppercase tracking-wider">What is counted?</p>
                                <ul className="space-y-1.5">
                                    <li className="flex gap-2"><span className="text-emerald-500 font-bold mt-0.5">✓</span><span>All sessions across <strong>Day 1 to Day 8</strong> count in the total — including days not yet started.</span></li>
                                    <li className="flex gap-2"><span className="text-emerald-500 font-bold mt-0.5">✓</span><span>You must mark attendance via the <strong>camera verification system</strong> within the open window.</span></li>
                                    <li className="flex gap-2"><span className="text-emerald-500 font-bold mt-0.5">✓</span><span>Admin <strong>override</strong> marks count as attended.</span></li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <p className="font-black text-zinc-700 text-xs uppercase tracking-wider">What is excluded?</p>
                                <ul className="space-y-1.5">
                                    <li className="flex gap-2"><span className="text-red-400 font-bold mt-0.5">✗</span><span><strong>Day 0</strong> (orientation) — not counted.</span></li>
                                    <li className="flex gap-2"><span className="text-red-400 font-bold mt-0.5">✗</span><span><strong>Infosys Certified Course</strong> sessions — self-paced, not counted.</span></li>
                                    <li className="flex gap-2"><span className="text-red-400 font-bold mt-0.5">✗</span><span><strong>Break</strong> sessions — not counted.</span></li>
                                </ul>
                            </div>

                            <div className="grid grid-cols-3 gap-2 pt-1">
                                <div className="p-2.5 bg-emerald-50 rounded-xl text-center border border-emerald-100">
                                    <p className="text-emerald-600 font-black text-sm">≥ 75%</p>
                                    <p className="text-emerald-600 text-[10px] font-semibold">Good Standing</p>
                                </div>
                                <div className="p-2.5 bg-amber-50 rounded-xl text-center border border-amber-100">
                                    <p className="text-amber-600 font-black text-sm">50–74%</p>
                                    <p className="text-amber-600 text-[10px] font-semibold">Needs Improvement</p>
                                </div>
                                <div className="p-2.5 bg-red-50 rounded-xl text-center border border-red-100">
                                    <p className="text-red-500 font-black text-sm">&lt; 50%</p>
                                    <p className="text-red-500 text-[10px] font-semibold">Critical</p>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => setShowPolicyModal(false)} className="mt-6 w-full py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-black text-sm uppercase tracking-wider transition-colors">Got it</button>
                    </div>
                </div>
            )}`;

// Insert before the last </div>\n        </div>\n    );\n} pattern (end of component)
const endPattern = /(\s*<\/div>\s*<\/div>\s*\);\s*}\s*$)/;
if (endPattern.test(c)) {
    c = c.replace(endPattern, modalCode + '$1');
    console.log('✅ Policy modal injected');
} else {
    // Try simpler: find last occurrence of closing tags
    const lastDiv = c.lastIndexOf('\n        </div>\n    );\n}');
    if (lastDiv >= 0) {
        c = c.substring(0, lastDiv) + '\n' + modalCode + c.substring(lastDiv);
        console.log('✅ Policy modal injected (fallback method)');
    } else {
        console.log('❌ Could not find end of component to inject modal');
    }
}

fs.writeFileSync(studentFile, c, enc);
console.log('✅ Student file saved');

// Verify
const verify = fs.readFileSync(studentFile, enc);
console.log('\n--- Verification ---');
console.log('showPolicyModal state:', verify.includes('showPolicyModal'));
console.log('Calculation Policy button:', verify.includes('Calculation Policy'));
console.log('Policy modal:', verify.includes('Bootcamp Attendance'));
console.log('Formula text:', verify.includes('Attended Sessions'));
