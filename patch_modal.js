const fs = require('fs');
const path = require('path');
const enc = 'utf8';

const studentFile = path.join(__dirname, 'frontend/src/components/StudentDashboard.jsx');
let c = fs.readFileSync(studentFile, enc);

// Print last 200 chars to understand end structure
console.log('LAST 300 CHARS:');
console.log(JSON.stringify(c.slice(-300)));

const modalCode = `\n            {/* Attendance Calculation Policy Modal */}\n            {showPolicyModal && (\n                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowPolicyModal(false)}>\n                    <div className="bg-white rounded-3xl shadow-2xl border border-zinc-100 max-w-md w-full p-7" onClick={e => e.stopPropagation()}>\n                        <div className="flex items-start justify-between mb-5">\n                            <div>\n                                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1">Bootcamp Attendance</p>\n                                <h2 className="text-xl font-black text-zinc-900">Calculation Policy</h2>\n                            </div>\n                            <button onClick={() => setShowPolicyModal(false)} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-colors text-sm font-bold">\u2715</button>\n                        </div>\n                        <div className="space-y-4 text-sm text-zinc-600">\n                            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">\n                                <p className="font-black text-indigo-700 text-xs uppercase tracking-wider mb-1">Formula</p>\n                                <p className="text-indigo-900 font-bold text-base">Attended Sessions \u00f7 Total Sessions \u00d7 100</p>\n                            </div>\n                            <div className="space-y-2">\n                                <p className="font-black text-zinc-700 text-xs uppercase tracking-wider">What is counted?</p>\n                                <ul className="space-y-1.5">\n                                    <li className="flex gap-2"><span className="text-emerald-500 font-bold">\u2713</span><span>All sessions from <strong>Day 1 to Day 8</strong> are counted in the total \u2014 including days not yet started.</span></li>\n                                    <li className="flex gap-2"><span className="text-emerald-500 font-bold">\u2713</span><span>Camera-verified attendance marks and admin <strong>overrides</strong> both count as attended.</span></li>\n                                </ul>\n                            </div>\n                            <div className="space-y-2">\n                                <p className="font-black text-zinc-700 text-xs uppercase tracking-wider">What is excluded?</p>\n                                <ul className="space-y-1.5">\n                                    <li className="flex gap-2"><span className="text-red-400 font-bold">\u2717</span><span><strong>Day 0</strong> (orientation) sessions</span></li>\n                                    <li className="flex gap-2"><span className="text-red-400 font-bold">\u2717</span><span><strong>Infosys Certified Course</strong> (self-paced upload)</span></li>\n                                    <li className="flex gap-2"><span className="text-red-400 font-bold">\u2717</span><span><strong>Break</strong> sessions</span></li>\n                                </ul>\n                            </div>\n                            <div className="grid grid-cols-3 gap-2">\n                                <div className="p-2.5 bg-emerald-50 rounded-xl text-center border border-emerald-100"><p className="text-emerald-600 font-black text-sm">\u2265 75%</p><p className="text-emerald-600 text-[10px] font-semibold">Good Standing</p></div>\n                                <div className="p-2.5 bg-amber-50 rounded-xl text-center border border-amber-100"><p className="text-amber-600 font-black text-sm">50\u201374%</p><p className="text-amber-600 text-[10px] font-semibold">Needs Improvement</p></div>\n                                <div className="p-2.5 bg-red-50 rounded-xl text-center border border-red-100"><p className="text-red-500 font-black text-sm">&lt; 50%</p><p className="text-red-500 text-[10px] font-semibold">Critical</p></div>\n                            </div>\n                        </div>\n                        <button onClick={() => setShowPolicyModal(false)} className="mt-6 w-full py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-black text-sm uppercase tracking-wider transition-colors">Got it</button>\n                    </div>\n                </div>\n            )}\n`;

// Find the last return statement's closing and inject before it
// The component ends with:  </div>\n        </div>\n    );\n}
// Let's find the last occurrence of the main wrapper close
const insertBefore = '\n    );\n}';
const lastIdx = c.lastIndexOf(insertBefore);
if (lastIdx >= 0) {
    c = c.substring(0, lastIdx) + modalCode + c.substring(lastIdx);
    console.log('✅ Modal injected before end of return');
} else {
    console.log('❌ Could not find insertion point. Trying alternate...');
    const alt = '\n    );\n}\n';
    const altIdx = c.lastIndexOf(alt);
    if (altIdx >= 0) {
        c = c.substring(0, altIdx) + modalCode + c.substring(altIdx);
        console.log('✅ Modal injected (alt)');
    }
}

fs.writeFileSync(studentFile, c, enc);
console.log('✅ Saved');
console.log('Modal present:', fs.readFileSync(studentFile, enc).includes('Calculation Policy'));
console.log('Formula present:', fs.readFileSync(studentFile, enc).includes('Attended Sessions'));
