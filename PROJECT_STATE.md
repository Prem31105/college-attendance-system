# PROJECT_STATE.md

## 1. Project Overview
Autonomous College Attendance Management System featuring Dynamic QR code projection (15s refresh / 30s expiry), GPS geofencing (strict 75m boundary and 20m accuracy requirement), hardware-bound registered device signatures (ECDSA P-256 Keystore/Keychain), optional local biometrics, random teacher physical verification, predictive attendance quota guider, role-based notification center, and a server-side multi-layer risk scoring engine.
Includes Flutter Student Mobile App (all 17 screens), React TypeScript Web Dashboard (Teachers & Admin), and NestJS PostgreSQL/Redis Backend.

## 2. Technology Stack & Runtime Verification Status
- **PostgreSQL Database**: PostgreSQL 16.6 running locally on `localhost:5432`, managed via Prisma ORM 5.22.0.
  - Database: `college_attendance`
  - Prisma Migration Baseline: `0_init` and `20261102_phase23_notification_priority` applied and synced (`prisma migrate status` clean).
  - Verified Backup: `backups/verified_phase2_backup_20261031_212123.sql` (54.9 KB, complete DDL + data COPY statements).
  - Portable Binaries: Located in `tools/pgsql` (ignored by `.gitignore`).
  - Real Multi-Subject Attendance Records: Student `CS2026-001` (John Doe) enrolled in `CS601` (11 sessions held, 11 attended -> 100% HEALTHY, 3 safe bunks) and `CS602` (10 sessions held, 7 attended, 3 missed -> 70% CRITICAL SHORTAGE, 2 recovery lectures required).
- **Backend API**: Node.js, NestJS 10, TypeScript, REST API, WebSockets, JWT with refresh token rotation, Argon2id, Swagger â€” Running on `http://localhost:3000/api/v1` (Docs: `http://localhost:3000/api/docs`).
- **Teacher & Admin Web Dashboard**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, QR code projection (`QRCodeSVG`), Predictive Student Quota & Shortage Guider â€” Production build verified clean (25.64s build, 0 errors).
- **Student Mobile App**: Flutter (Dart, Material 3, Android & iOS, Dynamic QR Camera Scanner, Geolocation, Device Keystore/Keychain, local_auth) â€” All 17 screens implemented. Real-time camera viewfinder integrated with `QRView` (`qr_code_scanner_plus`), interactive animated Radar Geofence visualizer (`GpsStatusScreen`), Smart Attendance Guider & Predictive Semester Target Calculator (`SubjectStatisticsScreen`), pure client/server Haversine & predictive mathematical engines. 30/30 Flutter unit and widget tests passing.
- **Snapshot & Rollback System**: Git + PowerShell scripts (`checkpoint.ps1`, `rollback.ps1`, `db_backup.ps1`, `db_restore.ps1`, `start_postgres.ps1`, `stop_postgres.ps1`).

## 3. Current Architecture & Folder Structure
```
d:\flutter attandance\
â”œâ”€â”€ .gitignore
â”œâ”€â”€ .env.example
â”œâ”€â”€ docker-compose.yml
â”œâ”€â”€ README.md
â”œâ”€â”€ PROJECT_STATE.md
â”œâ”€â”€ AGENT_HANDOFF.md
â”œâ”€â”€ DEVELOPMENT_PROGRESS.md
â”œâ”€â”€ RESUME_PROJECT_PROMPT.md
â”œâ”€â”€ backups/            (Verified PostgreSQL SQL dumps)
â”œâ”€â”€ docs/
â”‚   â”œâ”€â”€ ARCHITECTURE.md
â”‚   â”œâ”€â”€ DATABASE_SCHEMA.md
â”‚   â”œâ”€â”€ FEATURE_IMPLEMENTATION_PLAN.md
â”‚   â”œâ”€â”€ FLUTTER_SETUP_GUIDE.md (Step-by-step Windows setup guide)
â”‚   â”œâ”€â”€ SECURITY.md
â”‚   â”œâ”€â”€ TESTING.md
â”‚   â””â”€â”€ evidence/       (Pixel 6 emulator UI verification captures)
â”œâ”€â”€ snapshots/
â”‚   â”œâ”€â”€ README.md
â”‚   â””â”€â”€ checkpoint-log.md
â”œâ”€â”€ scripts/
â”‚   â”œâ”€â”€ checkpoint.ps1
â”‚   â”œâ”€â”€ checkpoint.sh
â”‚   â”œâ”€â”€ rollback.ps1
â”‚   â”œâ”€â”€ rollback.sh
â”‚   â”œâ”€â”€ db_backup.ps1
â”‚   â”œâ”€â”€ db_restore.ps1
â”‚   â”œâ”€â”€ setup_local_postgres.ps1
â”‚   â”œâ”€â”€ start_postgres.ps1
â”‚   â””â”€â”€ stop_postgres.ps1
â”œâ”€â”€ backend/            (NestJS API & Prisma ORM - Running on port 3000)
â”‚   â”œâ”€â”€ prisma/
â”‚   â”‚   â”œâ”€â”€ migrations/0_init/migration.sql (Baseline migration)
â”‚   â”‚   â”œâ”€â”€ migrations/20261102_phase23_notification_priority/migration.sql
â”‚   â”‚   â”œâ”€â”€ schema.prisma
â”‚   â”‚   â””â”€â”€ seed.ts
â”‚   â”œâ”€â”€ scripts/
â”‚   â”‚   â”œâ”€â”€ verify-e2e-workflow.ts (19/19 E2E Integration tests passed)
â”‚   â”‚   â”œâ”€â”€ verify-notifications-flow.ts (12/12 Notification tests passed)
â”‚   â”‚   â””â”€â”€ seed-multi-subject-attendance.ts (PostgreSQL multi-subject attendance)
â”‚   â””â”€â”€ src/
â”œâ”€â”€ web_dashboard/      (React + Vite + Tailwind - Built for production with 0 errors)
â””â”€â”€ student_mobile/     (Flutter Material 3 Student Mobile App - 17 screens implemented, 30/30 tests passed)
```

## 4. Feature Status Matrix
- [x] Phase 0: Safety & Recovery Foundation (Git, Checkpoint & Rollback scripts, State files, verified recovery)
- [x] Phase 1: Project Foundation (NestJS backend, Prisma schema & seed, Argon2id, JWT auth, React dashboard, Flutter app structure)
- [x] Phase 2: Core Attendance Engine & Database Integration (PostgreSQL 16 running & verified, 19/19 E2E integration tests passing)
- [x] Phase 2 Baseline: Git, DB Backup, Prisma Migration Baseline, and Flutter Setup Guide verified
- [x] Phase 2.1: Master Feature Implementation Plan (Documented & Approved)
- [x] Phase 2.2: Multi-Role Auth, Backend Registration, Token Rotation, Password Autofill, Device Key Binding & Onboarding Persistence (8/8 Verified & Tested)
- [x] Phase 2.3: Role-Based Notifications & Announcements System (In-App Notification Center, Priority Alerts, Role Broadcasts & Audit Logs - Verified & Tested)
- [x] Phase 2.4: Location Permissions & Configurable Geofencing Radar (Interactive Animated Radar, Multi-Ring Boundary, Configurable Classroom Anchor Endpoint, Spoofing Detection, 21/21 Tests Passed)
- [x] Phase 2.5: Smart Attendance Guider & Predictive Semester Target Calculator (Configurable Target, Safe Bunks & Recovery Algorithms, Next Class Impact, Actionable Guidance, 30/30 Flutter Tests, 16/16 Backend Tests Passed)
- [x] Phase 2.6: Final Integration Testing, Pixel_6 Emulator Verification & Phase 2 Completion (All suites passed, live multi-subject PostgreSQL data verified, demo mode isolated with warning banner, Pixel 6 screens verified)
- [ ] Phase 3: Hardware Security & Cryptographic Binding (Awaiting user instruction)

## 5. Development Status
- **Current Phase**: Phase 2 Product Features â€” **PHASE 2 OFFICIALLY COMPLETED AND CLOSED**
- **Current Git Branch**: `main`
- **Latest Checkpoint ID**: checkpoint-018
- **Last Successful Build**:
  - Backend: TypeScript 0 errors, running on port 3000
  - Web Dashboard: Vite production bundle built in 25.64s (0 errors)
  - Student Mobile: Debug APK built and installed on Pixel_6 emulator (215 MB)
- **Last Successful Test Run**:
  - Flutter Unit & Widget Tests: 30/30 passed (`attendance_guider_test.dart`, `location_service_test.dart`, `attendance_test.dart`, `notification_test.dart`, `widget_test.dart`)
  - Flutter Static Analyzer: 0 issues (`flutter analyze` clean in 13.5s)
  - Backend Unit Tests: 16/16 passed (`gps.service.spec.ts`, `risk.service.spec.ts`, `reports.service.spec.ts` in-band)
  - Backend Notification Suite: 12/12 passed (`verify-notifications-flow.ts`)
  - Backend E2E Integration Suite: 19/19 passed (`verify-e2e-workflow.ts`)
  - Live PostgreSQL Guider API: HTTP 200 authenticated (`GET /reports/guider?target=75` with real multi-subject attendance)
  - Pixel_6 Emulator Verification: Clean UI rendering of Dashboard, Attendance Guider (85% recalculation & isolated demo banner), and GPS Geofence Radar.
- **Known Errors**: 0 compilation/type errors
- **Current Blockers / Environment Notes**:
  - None.

## 6. Required Environment Variables (Names Only)
- `NODE_ENV`, `PORT`, `API_PREFIX`, `CORS_ORIGINS`
- `DATABASE_URL`

