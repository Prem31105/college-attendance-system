# ==============================================================================
# Portable PostgreSQL 16 Setup Script (Zero Admin / Zero UAC / Local User Space)
# ==============================================================================
$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path "$PSScriptRoot\..").Path
$ToolsDir = "$RepoRoot\tools"
$PgsqlDir = "$ToolsDir\pgsql"
$DataDir = "$PgsqlDir\data"
$ZipFile = "$ToolsDir\postgresql-16.zip"

Write-Host "`n>>> [POSTGRES SETUP] Initializing portable local PostgreSQL 16..." -ForegroundColor Cyan

if (-not (Test-Path $ToolsDir)) {
    New-Item -ItemType Directory -Path $ToolsDir | Out-Null
}

# 1. Download official portable PostgreSQL binaries if not already present
if (-not (Test-Path "$PgsqlDir\bin\postgres.exe")) {
    if (-not (Test-Path $ZipFile)) {
        Write-Host ">>> Downloading official portable PostgreSQL 16 binaries from EnterpriseDB/PostgreSQL.org..." -ForegroundColor Yellow
        $Url = "https://get.enterprisedb.com/postgresql/postgresql-16.6-1-windows-x64-binaries.zip"
        curl.exe -L -o $ZipFile $Url --progress-bar
    }

    Write-Host ">>> Extracting PostgreSQL binaries to $ToolsDir..." -ForegroundColor Yellow
    $SevenZip = "C:\Program Files\7-Zip\7z.exe"
    if (Test-Path $SevenZip) {
        & $SevenZip x -y "-o$ToolsDir" $ZipFile | Out-Null
    } else {
        Expand-Archive -Path $ZipFile -DestinationPath $ToolsDir -Force
    }
    Remove-Item -Path $ZipFile -Force -ErrorAction SilentlyContinue
}

# 2. Initialize Data Cluster
if (-not (Test-Path "$DataDir\PG_VERSION")) {
    Write-Host ">>> Initializing new PostgreSQL database cluster in $DataDir..." -ForegroundColor Yellow
    $PwFile = "$ToolsDir\pw.txt"
    "attendance_secure_pass" | Set-Content -Path $PwFile -NoNewline -Encoding ASCII

    & "$PgsqlDir\bin\initdb.exe" -D $DataDir -U attendance_admin -A scram-sha-256 --pwfile=$PwFile -E UTF8

    Remove-Item -Path $PwFile -Force -ErrorAction SilentlyContinue
}

# 3. Start PostgreSQL Server
Write-Host ">>> Starting PostgreSQL Server on port 5432..." -ForegroundColor Cyan
& "$PgsqlDir\bin\pg_ctl.exe" -D $DataDir -l "$ToolsDir\pgsql.log" start

Start-Sleep -Seconds 3

# 4. Create college_attendance Database if not exists
Write-Host ">>> Creating college_attendance database..." -ForegroundColor Yellow
$env:PGPASSWORD = "attendance_secure_pass"
& "$PgsqlDir\bin\createdb.exe" -h localhost -p 5432 -U attendance_admin college_attendance 2>$null
$env:PGPASSWORD = $null

Write-Host "`n>>> [SUCCESS] Portable PostgreSQL 16 is running on localhost:5432!" -ForegroundColor Green
Write-Host ">>> Database: college_attendance" -ForegroundColor Green
Write-Host ">>> User:     attendance_admin" -ForegroundColor Green
