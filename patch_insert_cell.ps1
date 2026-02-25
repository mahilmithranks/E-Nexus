$enc = [System.Text.UTF8Encoding]::new($false)
$adminFile = 'd:\Project\E-Nexus\frontend\src\components\AdminDashboard.jsx'

# Read all lines (preserving CRLF)
$lines = [System.IO.File]::ReadAllLines($adminFile, $enc)

Write-Host "Total lines: $($lines.Count)"
Write-Host "Line 1127: $($lines[1126])"
Write-Host "Line 1128: $($lines[1127])"

# We need to insert the Overall % <td> after line 1127 (index 1126)
# and before line 1128 (index 1127) which is the {student.sessions.filter line

$overallPctCell = '                                                                         {(() => { const oa = getOverallAttendance(student); if (!oa) return (<td className="p-4 border-r border-white/5 text-center"><span className="text-zinc-500 text-xs">—</span></td>); const color = oa.pct >= 75 ? "text-emerald-400" : oa.pct >= 50 ? "text-amber-400" : "text-red-400"; return (<td className="p-4 border-r border-white/5 text-center"><span className={`text-sm font-black ${color}`}>{oa.pct}%</span><div className="text-[9px] text-zinc-600">{oa.attended}/{oa.total}</div></td>); })()}'

# Verify lines 1126 and 1127 are what we expect
if ($lines[1126].TrimEnd() -eq '                                                                         </td>' -and $lines[1127].TrimStart().StartsWith('{student.sessions.filter')) {
    Write-Host "Target lines confirmed. Inserting Overall % cell..."
    $newLines = [System.Collections.Generic.List[string]]::new($lines)
    $newLines.Insert(1127, $overallPctCell)
    [System.IO.File]::WriteAllLines($adminFile, $newLines, $enc)
    Write-Host "SUCCESS: Overall % cell inserted at line 1128"
} else {
    Write-Host "WARNING: Lines don't match expected content."
    Write-Host "Line[1126] = '$($lines[1126])'"
    Write-Host "Line[1127] = '$($lines[1127].Substring(0, [Math]::Min(60, $lines[1127].Length)))'"
    
    # Try to find the correct line by searching
    for ($i = 1120; $i -lt 1135; $i++) {
        Write-Host "  Line[$($i+1)]: $($lines[$i].Substring(0, [Math]::Min(80, $lines[$i].Length)))"
    }
}
