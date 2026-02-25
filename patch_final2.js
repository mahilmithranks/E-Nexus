const fs = require('fs');
const path = require('path');
const enc = 'utf8';

// ═══════════════════════════════════
// FIX 1: Backend - filter PRESENT only
// ═══════════════════════════════════
const backendFile = path.join(__dirname, 'backend/controllers/studentController.js');
let bc = fs.readFileSync(backendFile, enc);

const oldQuery = `        // Fetch this student's attendance records for those sessions
        const attendanceRecords = await Attendance.find({
            registerNumber: req.user.registerNumber,
            sessionId: { $in: sessionIds }
        }).select('sessionId').lean();

        const attendedSet = new Set(attendanceRecords.map(a => a.sessionId.toString()));

        const total = attendanceSessions.length;
        const attended = attendanceRecords.length;`;

const newQuery = `        // Fetch this student's PRESENT attendance records for those sessions
        const attendanceRecords = await Attendance.find({
            registerNumber: req.user.registerNumber,
            sessionId: { $in: sessionIds },
            status: 'PRESENT'
        }).select('sessionId').lean();

        const attendedSet = new Set(attendanceRecords.map(a => a.sessionId.toString()));

        const total = attendanceSessions.length;
        const attended = attendanceRecords.length;`;

if (bc.includes(oldQuery.replace(/\r\n/g, '\n'))) {
    bc = bc.replace(oldQuery.replace(/\r\n/g, '\n'), newQuery.replace(/\r\n/g, '\n'));
    console.log('✅ Backend: status PRESENT filter added (LF)');
} else if (bc.includes(oldQuery)) {
    bc = bc.replace(oldQuery, newQuery);
    console.log('✅ Backend: status PRESENT filter added');
} else {
    // Regex approach
    const replaced = bc.replace(
        /Attendance\.find\(\{\s*registerNumber: req\.user\.registerNumber,\s*sessionId: \{ \$in: sessionIds \}\s*\}\)/,
        `Attendance.find({\n            registerNumber: req.user.registerNumber,\n            sessionId: { $in: sessionIds },\n            status: 'PRESENT'\n        })`
    );
    if (replaced !== bc) {
        bc = replaced;
        console.log('✅ Backend: status PRESENT filter added (regex)');
    } else {
        console.log('❌ Backend: could not patch');
    }
}

fs.writeFileSync(backendFile, bc, enc);
console.log('Backend saved. PRESENT filter:', fs.readFileSync(backendFile, enc).includes("status: 'PRESENT'"));

// ═══════════════════════════════════
// FIX 2: Student Dashboard - Policy Modal
// ═══════════════════════════════════
const studentFile = path.join(__dirname, 'frontend/src/components/StudentDashboard.jsx');
let sc = fs.readFileSync(studentFile, enc);

// Already has modal?
if (sc.includes('Bootcamp Attendance')) {
    console.log('✅ Modal already present');
} else {
    // Insert policy modal just before </AnimatePresence>\n        </>\n    );\n}
    const insertBefore = '</AnimatePresence>';
    const insertIdx = sc.lastIndexOf(insertBefore);

    if (insertIdx >= 0) {
        const modalJSX = `{/* Attendance Calculation Policy Modal */}
            {showPolicyModal && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={() => setShowPolicyModal(false)}
                >
                    <div
                        className="bg-white rounded-3xl shadow-2xl border border-zinc-100 max-w-md w-full p-7 max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-5">
                            <div>
                                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1">Bootcamp Attendance</p>
                                <h2 className="text-xl font-black text-zinc-900">Calculation Policy</h2>
                            </div>
                            <button
                                onClick={() => setShowPolicyModal(false)}
                                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 transition-colors text-sm font-bold shrink-0"
                            >
                                &#x2715;
                            </button>
                        </div>

                        <div className="space-y-4 text-sm text-zinc-600">
                            {/* Formula */}
                            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                <p className="font-black text-indigo-700 text-xs uppercase tracking-wider mb-1.5">Formula</p>
                                <p className="text-indigo-900 font-bold text-base">
                                    Attended Sessions &divide; Total Sessions &times; 100
                                </p>
                            </div>

                            {/* Counted */}
                            <div className="space-y-2">
                                <p className="font-black text-zinc-700 text-xs uppercase tracking-wider">What counts?</p>
                                <ul className="space-y-2">
                                    <li className="flex gap-2.5">
                                        <span className="text-emerald-500 font-black shrink-0">&#10003;</span>
                                        <span>All sessions across <strong className="text-zinc-800">Day 1&ndash;Day 8</strong> are in the denominator &mdash; including future/not-yet-started days.</span>
                                    </li>
                                    <li className="flex gap-2.5">
                                        <span className="text-emerald-500 font-black shrink-0">&#10003;</span>
                                        <span>Camera-verified attendance and admin <strong className="text-zinc-800">overrides</strong> both count as Present.</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Not counted */}
                            <div className="space-y-2">
                                <p className="font-black text-zinc-700 text-xs uppercase tracking-wider">What is excluded?</p>
                                <ul className="space-y-2">
                                    <li className="flex gap-2.5"><span className="text-red-400 font-black shrink-0">&#10007;</span><span><strong className="text-zinc-800">Day 0</strong> orientation sessions</span></li>
                                    <li className="flex gap-2.5"><span className="text-red-400 font-black shrink-0">&#10007;</span><span><strong className="text-zinc-800">Infosys Certified Course</strong> (self-paced)</span></li>
                                    <li className="flex gap-2.5"><span className="text-red-400 font-black shrink-0">&#10007;</span><span><strong className="text-zinc-800">Break</strong> sessions</span></li>
                                </ul>
                            </div>

                            {/* Status bands */}
                            <div className="grid grid-cols-3 gap-2 pt-1">
                                <div className="p-3 bg-emerald-50 rounded-2xl text-center border border-emerald-100">
                                    <p className="text-emerald-600 font-black text-sm">&ge; 75%</p>
                                    <p className="text-emerald-600 text-[10px] font-bold mt-0.5">Good Standing</p>
                                </div>
                                <div className="p-3 bg-amber-50 rounded-2xl text-center border border-amber-100">
                                    <p className="text-amber-600 font-black text-sm">50&ndash;74%</p>
                                    <p className="text-amber-600 text-[10px] font-bold mt-0.5">Needs Improvement</p>
                                </div>
                                <div className="p-3 bg-red-50 rounded-2xl text-center border border-red-100">
                                    <p className="text-red-500 font-black text-sm">&lt; 50%</p>
                                    <p className="text-red-500 text-[10px] font-bold mt-0.5">Critical</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowPolicyModal(false)}
                            className="mt-6 w-full py-3.5 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-black text-sm uppercase tracking-widest transition-colors"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}

            `;

        sc = sc.substring(0, insertIdx) + modalJSX + sc.substring(insertIdx);
        console.log('✅ Policy modal injected before AnimatePresence');
    } else {
        console.log('❌ AnimatePresence not found');
    }
}

fs.writeFileSync(studentFile, sc, enc);

// Final verification
const sv = fs.readFileSync(studentFile, enc);
console.log('\n=== FINAL VERIFICATION ===');
console.log('showPolicyModal state:', sv.includes('showPolicyModal'));
console.log('Calculation Policy button:', sv.includes('Calculation Policy'));
console.log('Policy modal (Bootcamp Attendance):', sv.includes('Bootcamp Attendance'));
console.log('Formula text:', sv.includes('Attended Sessions'));
console.log('Good Standing:', sv.includes('Good Standing'));
console.log('5s poll:', sv.includes('fetchAttendanceSummary, 5000'));
console.log('Overall % card:', sv.includes('attendanceSummary.percentage'));
