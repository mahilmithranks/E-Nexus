$adminFile = 'd:\Project\E-Nexus\frontend\src\components\AdminDashboard.jsx'
$content = [System.IO.File]::ReadAllText($adminFile, [System.Text.Encoding]::UTF8)

# ---- 1. Add Overall % column header ----
$oldH = 'Student Information</th>'
$newH = 'Student Information</th>' + "`r`n" + '                                                                 <th className="p-5 text-[10px] font-black text-emerald-400/80 uppercase tracking-[0.15em] whitespace-nowrap text-center border-r border-white/5 bg-[#0d0d0d]" style={{minWidth:' + "'88px'" + '}}>Overall %</th>'
$content = $content.Replace($oldH, $newH)
Write-Host "Step 1 done, Overall % header present: $($content -match 'Overall %')"

# ---- 2. Add Overall % cell after student info td ----
$oldCell = '<div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">{student.registerNumber}</div>' + "`r`n" + '                                                                         </td>' + "`r`n" + '                                                                         {student.sessions.filter'
$newCell = '<div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">{student.registerNumber}</div>' + "`r`n" + '                                                                         </td>' + "`r`n" + '                                                                         {(() => { const oa = getOverallAttendance(student); if (!oa) return <td className="p-4 border-r border-white/5 text-center text-zinc-600 text-xs">&mdash;</td>; return (<td className="p-4 border-r border-white/5 text-center"><div className="flex flex-col items-center gap-0.5"><span className={`text-sm font-black ${ oa.pct >= 75 ? ' + "'text-emerald-400'" + ' : oa.pct >= 50 ? ' + "'text-amber-400'" + ' : ' + "'text-red-400'" + ' }`}>{oa.pct}%</span><span className="text-[9px] text-zinc-600 font-bold">{oa.attended}/{oa.total}</span></div></td>); })()}' + "`r`n" + '                                                                         {student.sessions.filter'
$content = $content.Replace($oldCell, $newCell)
Write-Host "Step 2 done"

[System.IO.File]::WriteAllText($adminFile, $content, [System.Text.Encoding]::UTF8)
Write-Host "File written successfully"
