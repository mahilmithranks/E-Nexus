$enc = [System.Text.UTF8Encoding]::new($false)
$adminFile = 'd:\Project\E-Nexus\frontend\src\components\AdminDashboard.jsx'
$content = [System.IO.File]::ReadAllText($adminFile, $enc)

# Find the registerNumber closing div
$searchStr = '{student.registerNumber}</div>'
$idx = $content.IndexOf($searchStr)
Write-Host "Found at index: $idx"

# Print chars from end of searchStr to +300 bytes as hex
$startPrint = $idx + $searchStr.Length
$sub = $content.Substring($startPrint, [Math]::Min(300, $content.Length - $startPrint))
$bytes = [System.Text.Encoding]::UTF8.GetBytes($sub)
Write-Host "Character codes after registerNumber div:"
for ($i = 0; $i -lt [Math]::Min(100, $bytes.Count); $i++) {
    Write-Host "[$i] $($bytes[$i]) = '$([char]$bytes[$i])'"
}
