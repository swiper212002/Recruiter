param(
    [string]$BackendPath = "backend",
    [string]$FrontendPath = "frontend",
    [string]$AutoDemo = "backend\tools\auto-demo.ps1"
)

Write-Host "Running full verification: backend tests -> frontend tests -> auto-demo"

function Run-Step {
    param($Name, $Script)
    Write-Host "\n=== Running: $Name ==="
    Write-Host "Command: $Script"
    & powershell -NoProfile -ExecutionPolicy Bypass -Command $Script
    $code = $LASTEXITCODE
    if ($code -ne 0) {
        Write-Error "$Name failed with exit code $code"
        exit $code
    }
}

# 1) Backend tests
$backendCmd = "npm test --prefix $BackendPath -- --watchAll=false"
Run-Step -Name "Backend tests" -Script $backendCmd

# 2) Frontend tests
$frontendCmd = "npm test --prefix $FrontendPath -- --watchAll=false"
Run-Step -Name "Frontend tests" -Script $frontendCmd

# 3) Auto-demo
Run-Step -Name "Auto-demo" -Script "powershell -ExecutionPolicy Bypass -File $AutoDemo"

Write-Host "\nAll steps completed successfully."
