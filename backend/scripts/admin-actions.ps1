param(
    [string]$Base = 'http://localhost:5000/api',
    [int]$QuestionId = 40
)

try {
    $cred = @{ username = 'admin'; password = 'adminpass' } | ConvertTo-Json
    Write-Host "Logging in as admin..."
    $login = Invoke-RestMethod -Uri "$Base/auth/login" -Method POST -Body $cred -ContentType 'application/json' -TimeoutSec 30
    $token = $login.data.token
    Write-Host "Token obtained"

    $headers = @{ Authorization = "Bearer $token" }

    # Update question
    $updatePayload = @{ question_text = "Sửa thử: câu hỏi HR (đã chỉnh bởi admin)" } | ConvertTo-Json
    Write-Host "Updating question id $QuestionId"
    $upd = Invoke-RestMethod -Uri "$Base/questions/$QuestionId" -Method PUT -Body $updatePayload -Headers $headers -ContentType 'application/json' -TimeoutSec 30
    Write-Host "Update response:"; Write-Output ($upd | ConvertTo-Json -Depth 5)

    # Delete question
    Write-Host "Deleting question id $QuestionId"
    $del = Invoke-RestMethod -Uri "$Base/questions/$QuestionId" -Method DELETE -Headers $headers -TimeoutSec 30
    Write-Host "Delete response:"; Write-Output ($del | ConvertTo-Json -Depth 5)

    Write-Host "Admin actions completed"
    exit 0
} catch {
    Write-Error "Admin actions failed: $($_.Exception.Message)"
    exit 1
}
