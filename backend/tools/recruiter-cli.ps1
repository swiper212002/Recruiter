param(
  [string]$action = 'list-all',
  [string]$apiBase = 'http://localhost:5000/api/public'
)

function List-Questions {
  try {
    $qs = Invoke-RestMethod -Uri "$apiBase/questions" -Method GET -TimeoutSec 30
    Write-Output "Questions count: $($qs.Count)"
    $qs | ForEach-Object { Write-Output "[$($_.question_id)] $($_.question_text) - $($_.question_type)" }
  } catch { Write-Error "Failed to list questions: $($_.Exception.Message)" }
}

function List-Tests {
  try {
    $ts = Invoke-RestMethod -Uri "$apiBase/tests" -Method GET -TimeoutSec 30
    Write-Output "Tests count: $($ts.Count)"
    $ts | ForEach-Object { Write-Output "[$($_.test_id)] $($_.test_name) - $($_.duration_minutes) min" }
  } catch { Write-Error "Failed to list tests: $($_.Exception.Message)" }
}

function Create-Question {
  param(
    [string]$text,
    [string]$type = 'MULTIPLE_CHOICE',
    [string]$difficulty = 'EASY'
  )
  $payload = @{ question_text = $text; question_type = $type; difficulty_level = $difficulty; options = @(@{ option_text = 'A'; is_correct = $true }) } | ConvertTo-Json -Depth 6
  try {
    $res = Invoke-RestMethod -Uri "$apiBase/questions" -Method POST -Body $payload -ContentType 'application/json' -TimeoutSec 30
    Write-Output "Created question id: $($res.question_id)"
    return $res
  } catch { Write-Error "Failed to create question: $($_.Exception.Message)" }
}

function Create-Test {
  param(
    [string]$name,
    [int[]]$questionIds
  )
  $qs = $questionIds | ForEach-Object { @{ question_id = $_ } }
  $payload = @{ test_name = $name; questions = $qs } | ConvertTo-Json -Depth 6
  try {
    $res = Invoke-RestMethod -Uri "$apiBase/tests" -Method POST -Body $payload -ContentType 'application/json' -TimeoutSec 30
    Write-Output "Created test id: $($res.test_id)"
    return $res
  } catch { Write-Error "Failed to create test: $($_.Exception.Message)" }
}

switch ($action) {
  'list-questions' { List-Questions }
  'list-tests' { List-Tests }
  'list-all' { List-Questions; Write-Output ''; List-Tests }
  'create-question' { param($text) if (-not $text) { Write-Error 'Provide -text'; break } Create-Question -text $text }
  'create-test' { param($name,$ids) if (-not $name -or -not $ids) { Write-Error 'Provide -name and -ids (comma separated)'; break } $arr = $ids -split ',' | ForEach-Object { [int]($_.Trim()) }; Create-Test -name $name -questionIds $arr }
  Default { Write-Output "Unknown action: $action. Valid: list-all, list-questions, list-tests, create-question, create-test" }
}
