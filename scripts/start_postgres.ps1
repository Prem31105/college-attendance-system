# ==============================================================================
# Start Portable PostgreSQL Server
# ==============================================================================
$RepoRoot = (Resolve-Path "$PSScriptRoot\..").Path
$PgsqlDir = "$RepoRoot\tools\pgsql"
$DataDir = "$PgsqlDir\data"
$LogFile = "$RepoRoot\tools\pgsql.log"

if (Test-Path "$PgsqlDir\bin\pg_ctl.exe") {
    & "$PgsqlDir\bin\pg_ctl.exe" -D $DataDir -l $LogFile start
    Write-Host ">>> PostgreSQL started on localhost:5432" -ForegroundColor Green
} else {
    Write-Host ">>> Portable PostgreSQL not found. Run scripts/setup_local_postgres.ps1 first." -ForegroundColor Yellow
}
