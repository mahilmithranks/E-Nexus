$lines = [System.IO.File]::ReadAllLines('d:\Project\E-Nexus\frontend\src\components\AdminDashboard.jsx')
for ($i = 1119; $i -le 1134; $i++) {
    Write-Host "Line $($i+1): [$($lines[$i])]"
}
