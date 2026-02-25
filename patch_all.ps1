$enc = [System.Text.UTF8Encoding]::new($false)

# =============================================
# PATCH 1: StudentDashboard.jsx
# Replace the complex attendance card with a clean simple one
# =============================================
$studentFile = 'd:\Project\E-Nexus\frontend\src\components\StudentDashboard.jsx'
$sc = [System.IO.File]::ReadAllText($studentFile, $enc)

# Find and replace the entire Overall Attendance card block
$oldCard = @'
                            {/* Overall Attendance Card */}
                            {attendanceSummary !== null && (
                                <div className="p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl shadow-zinc-200/50 relative overflow-hidden group">
'@

if ($sc.Contains("Overall Attendance Card")) {
    # Find the start index
    $startIdx = $sc.IndexOf("{/* Overall Attendance Card */}")
    # Find the end: the closing )} after the card
    # We search for the next "{/* Course Credits Card" which comes right after
    $endMarker = "{/* Course Credits Card - Glassy */}"
    $endIdx = $sc.IndexOf($endMarker)
    
    if ($startIdx -ge 0 -and $endIdx -gt $startIdx) {
        $before = $sc.Substring(0, $startIdx)
        $after = $sc.Substring($endIdx)
        
        $newCard = @'
{/* Overall Attendance */}
                            {attendanceSummary !== null && (
                                <div className="p-5 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl shadow-zinc-200/50">
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3">Overall Attendance</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className={`text-4xl font-black ${attendanceSummary.percentage >= 75 ? 'text-emerald-600' : attendanceSummary.percentage >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                                            {attendanceSummary.percentage}%
                                        </span>
                                        <span className="text-sm text-zinc-400 font-semibold">
                                            {attendanceSummary.attended}/{attendanceSummary.total} sessions
                                        </span>
                                    </div>
                                    <div className="mt-3 w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${attendanceSummary.percentage >= 75 ? 'bg-emerald-500' : attendanceSummary.percentage >= 50 ? 'bg-amber-400' : 'bg-red-500'}`} style={{width: `${attendanceSummary.percentage}%`, transition: 'width 1s ease'}} />
                                    </div>
                                    <p className="text-[9px] text-zinc-400 mt-2">* Day 0 &amp; Infosys sessions excluded</p>
                                </div>
                            )}

                            
'@
        $sc = $before + $newCard + $after
        Write-Host "Student card replaced successfully"
    } else {
        Write-Host "Could not find card boundaries. startIdx=$startIdx endIdx=$endIdx"
    }
} else {
    Write-Host "Overall Attendance Card not found in student file - appending fetchAttendanceSummary poll interval"
}

[System.IO.File]::WriteAllText($studentFile, $sc, $enc)
Write-Host "Student file saved"

# =============================================
# PATCH 2: AdminDashboard.jsx  
# Insert the Overall % td cell right after the student info td closing tag
# =============================================
$adminFile = 'd:\Project\E-Nexus\frontend\src\components\AdminDashboard.jsx'
$ac = [System.IO.File]::ReadAllText($adminFile, $enc)

# The target is the student info </td> followed by the {student.sessions.filter line
$oldRow = '                                                                         </td>' + "`r`n" + '                                                                         {student.sessions.filter'
$newRow = '                                                                         </td>' + "`r`n" + '                                                                         {(() => { const oa = getOverallAttendance(student); if (!oa) return <td className="p-4 border-r border-white/5 text-center"><span className="text-zinc-600 text-xs">—</span></td>; const color = oa.pct >= 75 ? "text-emerald-400" : oa.pct >= 50 ? "text-amber-400" : "text-red-400"; return (<td className="p-4 border-r border-white/5 text-center"><div className="font-black text-sm leading-none"><span className={color}>{oa.pct}%</span></div><div className="text-[9px] text-zinc-600 mt-0.5">{oa.attended}/{oa.total}</div></td>); })()}' + "`r`n" + '                                                                         {student.sessions.filter'

if ($ac.Contains($oldRow)) {
    $ac = $ac.Replace($oldRow, $newRow)
    Write-Host "Admin Overall % cell inserted successfully"
} else {
    Write-Host "WARNING: Could not find target row in admin file"
    # Debug: show what's around line 1127
    $lines = $ac -split "`n"
    Write-Host "Lines 1124-1130:"
    for ($i = 1123; $i -le 1130 -and $i -lt $lines.Count; $i++) {
        Write-Host "  [$i]: $($lines[$i].Substring(0, [Math]::Min(80, $lines[$i].Length)))"
    }
}

# Also add real-time polling useEffect for attendance tab if not already there
if (-not $ac.Contains("Real-time polling")) {
    $pollTarget = '    }, [activeTab, searchTerm]);' + "`r`n" + "`r`n" + '    const fetchInitialData'
    $pollReplacement = '    }, [activeTab, searchTerm]);' + "`r`n`r`n" + '    // Real-time polling: refresh attendance data every 5s when on attendance tab' + "`r`n" + '    useEffect(() => {' + "`r`n" + '        if (activeTab !== ''attendance'') return;' + "`r`n" + '        const iv = setInterval(() => fetchProgress(pagination.currentPage, searchTerm), 5000);' + "`r`n" + '        return () => clearInterval(iv);' + "`r`n" + '    }, [activeTab, pagination.currentPage, searchTerm]);' + "`r`n`r`n" + '    const fetchInitialData'
    if ($ac.Contains($pollTarget)) {
        $ac = $ac.Replace($pollTarget, $pollReplacement)
        Write-Host "Poll interval added to admin"
    } else {
        Write-Host "Poll target not found, skipping"
    }
}

[System.IO.File]::WriteAllText($adminFile, $ac, $enc)
Write-Host "Admin file saved"
Write-Host "All patches complete!"
