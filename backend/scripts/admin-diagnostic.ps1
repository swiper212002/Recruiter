$uri = 'http://localhost:5000/api/auth/login'
$body = @{ username = 'admin'; password = 'adminpass' } | ConvertTo-Json
try {
    $resp = Invoke-RestMethod -Uri $uri -Method POST -Body $body -ContentType 'application/json' -TimeoutSec 30
    Write-Host "Status: 200"
    Write-Host "Body:"; $resp | ConvertTo-Json -Depth 5
} catch {
    Write-Error "Login failed: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $text = $reader.ReadToEnd(); Write-Host "Response body:"; Write-Host $text
    }
    exit 1
}
