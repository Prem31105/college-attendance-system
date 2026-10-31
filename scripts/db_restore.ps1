# ==============================================================================
# Database Restore Script (PostgreSQL via psql or Docker)
# Usage: powershell -ExecutionPolicy Bypass -File scripts/db_restore.ps1 -BackupFile "path/to/backup.sql"
# ==============================================================================
param (
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupFile)) {
    Write-Error "ERROR: Backup file '$BackupFile' does not exist."
    exit 1
}

Write-Host ">>> [DATABASE RESTORE] Restoring from $BackupFile..." -ForegroundColor Yellow
Write-Host ">>> WARNING: This will overwrite data in the target development database." -ForegroundColor Yellow

$RepoRoot = (Resolve-Path "$PSScriptRoot\..").Path
$PortablePsql = "$RepoRoot\tools\pgsql\bin\psql.exe"
if (Test-Path $PortablePsql) {
    $env:PGPASSWORD = "attendance_secure_pass"
    & $PortablePsql -h localhost -p 5432 -U attendance_admin -d college_attendance -f $BackupFile
    Write-Host ">>> [RESTORE SUCCESS] Database restored successfully via portable psql." -ForegroundColor Green
} elseif (Get-Command psql -ErrorAction SilentlyContinue) {
    Get-Content $BackupFile | docker exec -i college_attendance_postgres psql -U attendance_admin -d college_attendance
    Write-Host ">>> [RESTORE SUCCESS] Database restored successfully via Docker psql." -ForegroundColor Green
} else {
    Write-Host ">>> [NOTICE] psql or Docker not found in current shell. Use 'npm run prisma:db:push' or 'npx prisma db seed' in backend to re-seed fixtures." -ForegroundColor Yellow
}
