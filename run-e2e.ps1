param(
    [int]$BackendPort = 5000,
    [int]$FrontendPort = 3000,
    [int]$TimeoutSec = 120
)

function Wait-ForUrl {
    param($Url, $TimeoutSec, $IntervalSec=2)
    $end = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $end) {
        try {
            $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
            if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 400) {
                Write-Host "Ready: $Url (status $($resp.StatusCode))"
                return $true
            }
        } catch {
            # ignore and retry
        }
        Start-Sleep -Seconds $IntervalSec
    }
    return $false
}

Write-Host "Starting end-to-end orchestration: start servers, wait, run auto-demo + tests"

$started = @()
try {
    # Start backend
    Write-Host "Starting backend (npm run start --prefix backend)"
    $backendProc = Start-Process -FilePath "npm" -ArgumentList @("run","start","--prefix","backend") -PassThru -WindowStyle Hidden
    $started += $backendProc

    # Start frontend with legacy OpenSSL env (for older react-scripts)
    Write-Host "Starting frontend (react-scripts start) with NODE_OPTIONS=--openssl-legacy-provider"
    $frontendCmd = "`$env:NODE_OPTIONS='--openssl-legacy-provider'; npm run start --prefix frontend"
    $frontendProc = Start-Process -FilePath "powershell" -ArgumentList @("-NoProfile","-Command", $frontendCmd) -PassThru -WindowStyle Hidden
    $started += $frontendProc

    # Wait for backend API readiness (use public questions endpoint)
    $backendUrl = "http://localhost:$BackendPort/api/public/questions"
    Write-Host "Waiting for backend at $backendUrl (timeout ${TimeoutSec}s)"
    if (-not (Wait-ForUrl -Url $backendUrl -TimeoutSec $TimeoutSec)) {
        throw "Backend did not become ready within $TimeoutSec seconds"
    }

    # Wait for frontend readiness (root)
    $frontendUrl = "http://localhost:$FrontendPort/"
    Write-Host "Waiting for frontend at $frontendUrl (timeout ${TimeoutSec}s)"
    if (-not (Wait-ForUrl -Url $frontendUrl -TimeoutSec $TimeoutSec)) {
        throw "Frontend did not become ready within $TimeoutSec seconds"
    }

    # Run auto-demo
    Write-Host "Running auto-demo script"
    & powershell -ExecutionPolicy Bypass -File backend\tools\auto-demo.ps1
    if ($LASTEXITCODE -ne 0) { throw "Auto-demo failed with exit code $LASTEXITCODE" }

    # Run backend tests (unit/integration)
    Write-Host "Running backend tests"
    npm test --prefix backend -- --watchAll=false
    if ($LASTEXITCODE -ne 0) { throw "Backend tests failed with exit code $LASTEXITCODE" }

    # Run frontend tests
    Write-Host "Running frontend tests"
    npm test --prefix frontend -- --watchAll=false
    if ($LASTEXITCODE -ne 0) { throw "Frontend tests failed with exit code $LASTEXITCODE" }

    Write-Host "E2E orchestration completed successfully"
    exit 0

} catch {
    Write-Error "Error during orchestration: $_"
    exit 1
} finally {
    Write-Host "Tearing down started processes"
    foreach ($p in $started) {
        try {
            if ($p -and -not $p.HasExited) {
                Write-Host "Stopping process Id $($p.Id)"
                Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
            }
        } catch {
            # ignore
        }
    }
}
