# ==============================================================================
# Stop Portable PostgreSQL Server
# ==============================================================================
$RepoRoot = (Resolve-Path "$PSScriptRoot\..").Path
$PgsqlDir = "$RepoRoot\tools\pgsql"
$DataDir = "$PgsqlDir\data"

if (Test-Path "$PgsqlDir\bin\pg_ctl.exe") {
    & "$PgsqlDir\bin\pg_ctl.exe" -D $DataDir stop
    Write-Host ">>> PostgreSQL stopped." -ForegroundColor Green
}
