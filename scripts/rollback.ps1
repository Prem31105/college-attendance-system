# ==============================================================================
# Autonomous Rollback Script (PowerShell)
# Usage: 
#   powershell -ExecutionPolicy Bypass -File scripts/rollback.ps1 -List
#   powershell -ExecutionPolicy Bypass -File scripts/rollback.ps1 -CheckpointId "checkpoint-001"
# ==============================================================================
param (
    [string]$CheckpointId = "",
    [switch]$List,
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path "$PSScriptRoot\..").Path
Set-Location $RepoRoot

# 1. Handle -List
if ($List -or [string]::IsNullOrWhiteSpace($CheckpointId)) {
    Write-Host "`n=== AVAILABLE CHECKPOINTS ===" -ForegroundColor Cyan
    $LogFile = "$RepoRoot\snapshots\checkpoint-log.md"
    if (Test-Path $LogFile) {
        Get-Content $LogFile | Select-String "checkpoint-"
    } else {
        Write-Host "No checkpoints logged yet." -ForegroundColor Yellow
    }
    Write-Host "`nTo rollback to a specific checkpoint, execute:" -ForegroundColor Green
    Write-Host "powershell -ExecutionPolicy Bypass -File scripts/rollback.ps1 -CheckpointId checkpoint-001`n"
    if ([string]::IsNullOrWhiteSpace($CheckpointId)) { exit 0 }
}

Write-Host "`n>>> [ROLLBACK] Initiating rollback to $CheckpointId..." -ForegroundColor Yellow

# 2. Verify target tag / checkpoint exists
$TagCheck = git tag -l "$CheckpointId"
if (-not $TagCheck) {
    Write-Error "ERROR: Target checkpoint '$CheckpointId' does not exist in Git tags."
    exit 1
}

# 3. Safety Check: If uncommitted changes exist, create automatic safety backup first!
$Status = git status --porcelain
if ($Status.Trim() -ne "") {
    Write-Host ">>> Uncommitted changes detected. Creating automatic safety backup..." -ForegroundColor Magenta
    $SafetyTag = "safety-backup-" + (Get-Date).ToUniversalTime().ToString("yyyyMMdd-HHmmss")
    git stash create | Out-Null
    git add -A
    git commit -m "[SAFETY-BACKUP] Auto-backup before rollback to $CheckpointId" | Out-Null
    git tag "$SafetyTag"
    Write-Host ">>> Preserved uncommitted changes under tag: $SafetyTag" -ForegroundColor Magenta
}

# 4. Perform Rollback
Write-Host ">>> Checking out checkpoint tag: $CheckpointId..." -ForegroundColor Cyan
git checkout "$CheckpointId"

$CurrentCommit = (git rev-parse HEAD).Trim()
Write-Host ">>> Working tree restored to $CheckpointId (Commit: $CurrentCommit)" -ForegroundColor Green

# 5. Update Documentation Log
$RollbackNotice = "`n> [!WARNING]`n> Rollback executed on $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC') to $CheckpointId ($CurrentCommit).`n"
Add-Content -Path "$RepoRoot\DEVELOPMENT_PROGRESS.md" -Value $RollbackNotice

Write-Host ">>> [ROLLBACK COMPLETE] Successfully restored system to $CheckpointId." -ForegroundColor Green
