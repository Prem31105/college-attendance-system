# PROJECT_STATE.md

## 1. Project Overview
Autonomous College Attendance Management System featuring Dynamic QR code projection (15s refresh / 30s expiry), GPS geofencing (strict 75m boundary and 20m accuracy requirement), hardware-bound registered device signatures (ECDSA P-256 Keystore/Keychain), optional local biometrics, random teacher physical verification, and a server-side multi-layer risk scoring engine.
Includes Flutter Student Mobile App (all 17 screens), React TypeScript Web Dashboard (Teachers & Admin), and NestJS PostgreSQL/Redis Backend.

## 2. Technology Stack & Runtime Verification Status
- **PostgreSQL Database**: PostgreSQL 16.6 running locally on `localhost:5432`, managed via Prisma ORM 5.22.0.
  - Database: `college_attendance`
  - Prisma Migration Baseline: `0_init` applied and synced (`prisma migrate status` clean).
  - Verified Backup: `backups/verified_phase2_backup_20261031_212123.sql` (54.9 KB, complete DDL + data COPY statements).
  - Portable Binaries: Located in `tools/pgsql` (ignored by `.gitignore`).
- **Backend API**: Node.js, NestJS 10, TypeScript, REST API, WebSockets, JWT with refresh token rotation, Argon2id, Swagger — Running on `http://localhost:3000/api/v1` (Docs: `http://localhost:3000/api/docs`).
- **Teacher & Admin Web Dashboard**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, QR code projection (`QRCodeSVG`) — Built and running on `http://localhost:5173`.
- **Student Mobile App**: Flutter (Dart, Material 3, Android & iOS, Dynamic QR Camera Scanner, Geolocation, Device Keystore/Keychain, local_auth) — All 17 screens implemented. Real-time camera viewfinder integrated with `QRView` (`qr_code_scanner_plus`) and verified live on Pixel_6 Android emulator streaming from host webcam (`webcam0` / USB2.0 HD UVC WebCam). Fully operational.
- **Snapshot & Rollback System**: Git + PowerShell scripts (`checkpoint.ps1`, `rollback.ps1`, `db_backup.ps1`, `db_restore.ps1`, `start_postgres.ps1`, `stop_postgres.ps1`).

## 3. Current Architecture & Folder Structure
```
d:\flutter attandance\
├── .gitignore
├── .env.example
├── docker-compose.yml
├── README.md
├── PROJECT_STATE.md
├── AGENT_HANDOFF.md
├── DEVELOPMENT_PROGRESS.md
├── RESUME_PROJECT_PROMPT.md
├── backups/            (Verified PostgreSQL SQL dumps)
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── FLUTTER_SETUP_GUIDE.md (Step-by-step Windows setup guide)
│   ├── SECURITY.md
│   └── TESTING.md
├── snapshots/
│   ├── README.md
│   └── checkpoint-log.md
├── scripts/
│   ├── checkpoint.ps1
│   ├── checkpoint.sh
│   ├── rollback.ps1
│   ├── rollback.sh
│   ├── db_backup.ps1
│   ├── db_restore.ps1
│   ├── setup_local_postgres.ps1
│   ├── start_postgres.ps1
│   └── stop_postgres.ps1
├── backend/            (NestJS API & Prisma ORM - Running on port 3000)
│   ├── prisma/
│   │   ├── migrations/0_init/migration.sql (Baseline migration)
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── scripts/verify-e2e-workflow.ts (19/19 E2E Integration tests passed)
│   └── src/
├── web_dashboard/      (React + Vite + Tailwind - Running on port 5173)
└── student_mobile/     (Flutter Material 3 Student Mobile App - 17 screens implemented)
```

## 4. Feature Status Matrix
- [x] Phase 0: Safety & Recovery Foundation (Git, Checkpoint & Rollback scripts, State files, verified recovery)
- [x] Phase 1: Project Foundation (NestJS backend, Prisma schema & seed, Argon2id, JWT auth, React dashboard, Flutter app structure)
- [x] Phase 2: Core Attendance Engine & Database Integration (PostgreSQL 16 running & verified, 19/19 E2E integration tests passing)
- [x] Phase 2 Baseline: Git, DB Backup, Prisma Migration Baseline, and Flutter Setup Guide verified
- [x] Phase 2.1: Master Feature Implementation Plan (Documented & Approved)
- [x] Phase 2.2: Multi-Role Auth, Backend Registration, Token Rotation, Password Autofill, Device Key Binding & Onboarding Persistence (8/8 Verified & Tested)
- [x] Phase 3: Hardware Security & Cryptographic Binding (ECDSA P-256 challenge-response, device registration, risk scoring engine)
- [x] Phase 4: Administration & Verification (Random verification, corrections, reports, audit logs, 75m classroom geofences)
- [x] Phase 5: Quality Assurance & Integration Testing (Jest tests 8/8 passed, E2E tests 19/19 passed, React dashboard built cleanly)
- [x] Phase 6: Student Mobile Native Verification (Flutter debug APK compiled, installed on Pixel_6 emulator, live webcam streaming & QR scanning verified)

## 5. Development Status
- **Current Phase**: Phase 2 Product Features (Milestone 2.2 Verified & Complete -> Proceeding to Milestone 2.3)
- **Current Git Branch**: `main`
- **Latest Checkpoint ID**: checkpoint-007
- **Last Successful Build**:
  - Backend: TypeScript 0 errors, running on port 3000
  - Web Dashboard: Vite production bundle built in 4.69s, running on port 5173
- **Last Successful Test Run**:
  - Flutter Unit & Widget Tests: 7/7 passed (`attendance_test.dart`, `widget_test.dart`)
  - Flutter Static Analyzer: 0 issues (`flutter analyze` clean)
  - Backend E2E Integration Suite: 19/19 passed (`verify-e2e-workflow.ts`)
  - Backend Auth Flow Suite: 9/9 passed (`verify-auth-flow.ts`)
  - Backend Unit Tests: 8/8 passed (`gps.service.spec.ts`, `risk.service.spec.ts`)
- **Known Errors**: 0 compilation/type errors
- **Current Blockers / Environment Notes**:
  - None. Toolchain (Flutter 3.29.2, Android SDK 34, OpenJDK 17, Pixel_6 emulator, laptop webcam0) is fully configured and operational.

## 6. Required Environment Variables (Names Only)
- `NODE_ENV`, `PORT`, `API_PREFIX`, `CORS_ORIGINS`
- `DATABASE_URL`
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- `JWT_ACCESS_SECRET`, `JWT_ACCESS_EXPIRATION`
- `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRATION`
- `QR_HMAC_SECRET`, `QR_REFRESH_INTERVAL_SECONDS`, `QR_TOKEN_VALIDITY_SECONDS`
- `DEFAULT_GEOFENCE_RADIUS_METERS`, `MAX_ACCEPTED_GPS_ACCURACY_METERS`
- `ENABLE_STRICT_DEVICE_INTEGRITY`, `GOOGLE_PLAY_INTEGRITY_PACKAGE_NAME`, `APPLE_APP_ATTEST_APP_ID`
- `VITE_API_BASE_URL`, `VITE_WS_BASE_URL`

## 7. Exact Commands to Run Services
- **Start PostgreSQL**: `powershell -ExecutionPolicy Bypass -File scripts/start_postgres.ps1`
- **Stop PostgreSQL**: `powershell -ExecutionPolicy Bypass -File scripts/stop_postgres.ps1`
- **Backup PostgreSQL**: `powershell -ExecutionPolicy Bypass -File scripts/db_backup.ps1 -BackupName "my_backup"`
- **Restore PostgreSQL**: `powershell -ExecutionPolicy Bypass -File scripts/db_restore.ps1 -BackupFile "backups/my_backup.sql"`
- **Backend API**: `cd backend && npm run start` (Listening on `http://localhost:3000/api/v1`)
- **Web Dashboard**: `cd web_dashboard && npm run preview -- --port 5173 --host` (Listening on `http://localhost:5173`)
- **Run E2E Suite**: `cd backend && npx ts-node scripts/verify-e2e-workflow.ts`
- **Run Unit Tests**: `cd backend && npm test`
- **Create Checkpoint**: `powershell -ExecutionPolicy Bypass -File scripts/checkpoint.ps1 -Description "description"`
- **Rollback to Checkpoint**: `powershell -ExecutionPolicy Bypass -File scripts/rollback.ps1 -CheckpointId "checkpoint-XXX"`
