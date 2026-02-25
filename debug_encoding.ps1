$enc = [System.Text.UTF8Encoding]::new($false)
$adminFile = 'd:\Project\E-Nexus\frontend\src\components\AdminDashboard.jsx'

# Read as single string
$content = [System.IO.File]::ReadAllText($adminFile, $enc)

# The unique marker: end of student info cell right before sessions.filter
$marker = '{student.registerNumber}</div>' + [char]13 + [char]10 + '                                                                         </td>' + [char]13 + [char]10 + '                                                                         {student.sessions.filter'

Write-Host "Marker found: $($content.Contains($marker))"
Write-Host "Char13+10 test: $($content.Contains([char]13 + [char]10))"

# Try LF only
$markerLF = '{student.registerNumber}</div>' + [char]10 + '                                                                         </td>' + [char]10 + '                                                                         {student.sessions.filter'
Write-Host "Marker LF found: $($content.Contains($markerLF))"

# Find any occurrence of registerNumber to check
$idx = $content.IndexOf('{student.registerNumber}')
if ($idx -ge 0) {
    Write-Host "registerNumber found at index $idx"
    # Print surrounding 200 chars as hex
    $sub = $content.Substring($idx, [Math]::Min(200, $content.Length - $idx))
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($sub)
    $hex = ($bytes | ForEach-Object { $_.ToString('X2') }) -join ' '
    Write-Host "HEX: $hex"
} else {
    Write-Host "registerNumber NOT found"
}
