const fs = require('fs');
const path = require('path');

const adminFile = path.join(__dirname, 'frontend/src/components/AdminDashboard.jsx');
let content = fs.readFileSync(adminFile, 'utf8');

// ── Insert Overall % <td> cell right after the student-info </td> and before {student.sessions.filter
const beforeCell = content.includes('{student.registerNumber}</div>');
console.log('registerNumber div found:', beforeCell);

// Use regex to insert the Overall % cell
const oldPattern = /(\{student\.registerNumber\}<\/div>\r?\n\s*<\/td>)(\r?\n\s*)(\{student\.sessions\.filter)/;

const newCell = `$1$2{(() => {
                                                                             const oa = getOverallAttendance(student);
                                                                             if (!oa) return <td className="p-4 border-r border-white/5 text-center"><span className="text-zinc-600 text-xs">—</span></td>;
                                                                             const color = oa.pct >= 75 ? 'text-emerald-400' : oa.pct >= 50 ? 'text-amber-400' : 'text-red-400';
                                                                             return (
                                                                               <td className="p-4 border-r border-white/5 text-center">
                                                                                 <span className={\`text-base font-black \${color}\`}>{oa.pct}%</span>
                                                                                 <div className="text-[9px] text-zinc-600 mt-0.5">{oa.attended}/{oa.total}</div>
                                                                               </td>
                                                                             );
                                                                           })()}$2$3`;

const matched = oldPattern.test(content);
console.log('Pattern matched:', matched);

if (matched) {
    content = content.replace(oldPattern, newCell);
    fs.writeFileSync(adminFile, content, 'utf8');
    console.log('SUCCESS: Overall % cell inserted in admin table rows');
} else {
    // Debug: find the range around registerNumber
    const idx = content.indexOf('{student.registerNumber}</div>');
    if (idx >= 0) {
        const snippet = content.substring(idx, idx + 300);
        console.log('Snippet after registerNumber:');
        console.log(JSON.stringify(snippet));
    }
}
