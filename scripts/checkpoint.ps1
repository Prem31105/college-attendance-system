# ==============================================================================
# Autonomous Checkpoint Creation Script (PowerShell)
# Usage: powershell -ExecutionPolicy Bypass -File scripts/checkpoint.ps1 [-Description "summary"]
# ==============================================================================
param (
    [string]$Description = "Autonomous development checkpoint"
)

$ErrorActionPreference = "Stop"

Write-Host "`n>>> [CHECKPOINT] Starting checkpoint creation process..." -ForegroundColor Cyan

# 1. Verify working directory
$RepoRoot = (Resolve-Path "$PSScriptRoot\..").Path
Set-Location $RepoRoot

# 2. Check Git initialization
if (-not (Test-Path "$RepoRoot\.git")) {
    Write-Error "ERROR: Git repository not initialized. Run 'git init' first."
    exit 1
}

# 3. Secret scan: Verify that no secrets or .env files are staged
$PendingFiles = @()
$PendingFiles += (git diff --name-only --cached)
$PendingFiles += (git ls-files --others --exclude-standard)
$PendingFiles = $PendingFiles | Where-Object { $_ -and $_.Trim() -ne "" } | ForEach-Object { $_.Trim() }

foreach ($file in $PendingFiles) {
    $baseName = Split-Path -Leaf $file
    if ($baseName -like "*.example" -or $baseName -like "*.example.*") {
        continue
    }
    if ($baseName -match '^\.env($|\.)' -or $baseName -match '\.(key|pem|keystore|jks)$' -or $baseName -eq 'credentials.json') {
        Write-Error "CRITICAL SECURITY ERROR: Forbidden secret file detected in staging/untracked list: $file. Aborting checkpoint."
        exit 1
    }
}

# 4. Determine next checkpoint ID
if (-not (Test-Path "$RepoRoot\snapshots")) {
    New-Item -ItemType Directory -Path "$RepoRoot\snapshots" | Out-Null
}

$ExistingCheckpoints = Get-ChildItem -Path "$RepoRoot\snapshots" -Directory -Filter "checkpoint-*" | ForEach-Object {
    if ($_.Name -match "checkpoint-(\d+)") { [int]$matches[1] }
}

if ($ExistingCheckpoints) {
    $NextNum = ($ExistingCheckpoints | Measure-Object -Maximum).Maximum + 1
} else {
    $NextNum = 1
}

$NextNumInt = [int]$NextNum
$CheckpointId = "checkpoint-{0:D3}" -f $NextNumInt
Write-Host ">>> Checkpoint ID allocated: $CheckpointId" -ForegroundColor Yellow

# 5. Stage files and Commit
git add -A

$GitStatus = git status --porcelain
if ($GitStatus.Trim() -eq "") {
    Write-Host ">>> No file changes detected to commit. Creating checkpoint metadata from current HEAD..." -ForegroundColor Yellow
    $CommitHash = (git rev-parse HEAD).Trim()
} else {
    $CommitMessage = "[$CheckpointId] $Description"
    git commit -m "$CommitMessage"
    $CommitHash = (git rev-parse HEAD).Trim()
    Write-Host ">>> Committed changes with hash: $CommitHash" -ForegroundColor Green
}

# Create Git Tag
git tag -f "$CheckpointId"
Write-Host ">>> Git tag created: $CheckpointId" -ForegroundColor Green

# 6. Save Checkpoint Snapshot Directory & Metadata
$SnapshotDir = "$RepoRoot\snapshots\$CheckpointId"
if (-not (Test-Path $SnapshotDir)) {
    New-Item -ItemType Directory -Path $SnapshotDir | Out-Null
}

$Timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$CurrentBranch = (git branch --show-current).Trim()

$Metadata = [ordered]@{
    checkpoint_id     = $CheckpointId
    timestamp_utc     = $Timestamp
    git_commit_hash   = $CommitHash
    branch            = $CurrentBranch
    description       = $Description
    status            = "VERIFIED"
}

$Metadata | ConvertTo-Json -Depth 4 | Set-Content -Path "$SnapshotDir\metadata.json" -Encoding UTF8

# 7. Update checkpoint-log.md
$LogEntry = "| $CheckpointId | $Timestamp | $CurrentBranch | $CommitHash | Current | VERIFIED | $Description |"
Add-Content -Path "$RepoRoot\snapshots\checkpoint-log.md" -Value $LogEntry

# 8. Update PROJECT_STATE.md
$ProjectStateFile = "$RepoRoot\PROJECT_STATE.md"
if (Test-Path $ProjectStateFile) {
    $Content = Get-Content $ProjectStateFile -Raw
    $Content = $Content -replace "Latest Checkpoint ID\*\*: .+", "Latest Checkpoint ID**: $CheckpointId"
    $Content = $Content -replace "Latest Stable Commit Hash\*\*: .+", "Latest Stable Commit Hash**: $CommitHash"
    Set-Content -Path $ProjectStateFile -Value $Content -Encoding UTF8
}

Write-Host "`n>>> [CHECKPOINT SUCCESS] $CheckpointId created and recorded successfully!" -ForegroundColor Green
