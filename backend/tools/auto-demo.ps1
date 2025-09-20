# Auto demo: create a question, create a test using it and an existing question, then list all
Set-Location -Path (Join-Path $PSScriptRoot '..')

$ErrorActionPreference = 'Stop'
$apiBase = 'http://localhost:5000/api/public'

Write-Output "Starting auto-demo against $apiBase"

try {
  $questionPayload = @{ 
    question_text = 'Auto-generated question by auto-demo';
    question_type = 'SINGLE_CHOICE';
    difficulty_level = 'EASY';
    options = @(@{ option_text = 'OK'; is_correct = $true })
  } | ConvertTo-Json -Depth 6

  $q = Invoke-RestMethod -Uri "$apiBase/questions" -Method POST -Body $questionPayload -ContentType 'application/json' -TimeoutSec 30
  Write-Output "Created question id: $($q.question_id)"
  $newId = $q.question_id

  # Use first existing question id if present; otherwise only use the new one
  $existingQs = Invoke-RestMethod -Uri "$apiBase/questions" -Method GET -TimeoutSec 30
  $useId = if ($existingQs -and $existingQs.Count -ge 1) { $existingQs[0].question_id } else { $null }
  $questionIds = @()
  if ($useId) { $questionIds += @{ question_id = $useId } }
  $questionIds += @{ question_id = $newId }

  $testPayload = @{ test_name = 'Auto-demo test'; duration_minutes = 20; questions = $questionIds } | ConvertTo-Json -Depth 8
  $t = Invoke-RestMethod -Uri "$apiBase/tests" -Method POST -Body $testPayload -ContentType 'application/json' -TimeoutSec 30
  Write-Output "Created test id: $($t.test_id)"

  # List questions
  $qs = Invoke-RestMethod -Uri "$apiBase/questions" -Method GET -TimeoutSec 30
  Write-Output "Questions count: $($qs.Count)"
  foreach ($item in $qs) {
    if ($item -and $item.question_id) { Write-Output "[$($item.question_id)] $($item.question_text)" } else { Write-Output "[unknown] $($item | ConvertTo-Json -Depth 2)" }
  }

  # List tests
  $ts = Invoke-RestMethod -Uri "$apiBase/tests" -Method GET -TimeoutSec 30
  Write-Output "Tests count: $($ts.Count)"
  foreach ($item in $ts) {
    if ($item -and $item.test_id) { Write-Output "[$($item.test_id)] $($item.test_name)" } else { Write-Output "[unknown test] $($item | ConvertTo-Json -Depth 2)" }
  }

} catch {
  Write-Error "Auto-demo failed: $($_.Exception.Message)"
}
