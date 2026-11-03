# PROJECT_STATE.md

## 1. Project Overview
Autonomous College Attendance Management System featuring Dynamic QR code projection (15s refresh / 30s expiry), GPS geofencing (strict 75m boundary and 20m accuracy requirement), hardware-bound registered primary device verification (ECDSA P-256 Keystore/Keychain challenge-response), local biometrics, risk-based teacher verification for suspicious attempts, predictive attendance quota guider, role-based notification center, and a server-side multi-layer risk scoring engine.
Includes Flutter Student Mobile App (all 17 screens), React TypeScript Web Dashboard (Teachers & Admin), and NestJS PostgreSQL/Redis Backend.

## 2. Technology Stack & Runtime Verification Status
- **PostgreSQL Database**: PostgreSQL 16.6 running locally on `localhost:5432`, managed via Prisma ORM 5.22.0.
  - Database: `college_attendance`
  - Prisma Migration Baseline: `0_init` and `20261102_phase23_notification_priority` applied and synced (`prisma migrate status` clean).
  - Verified Backup: `backups/verified_phase2_backup_20261031_212123.sql` (54.9 KB, complete DDL + data COPY statements).
  - Portable Binaries: Located in `tools/pgsql` (ignored by `.gitignore`).
  - Real Multi-Subject Attendance Records: Student `CS2026-001` (John Doe) enrolled in `CS601` (11 sessions held, 11 attended -> 100% HEALTHY, 3 safe bunks) and `CS602` (10 sessions held, 7 attended, 3 missed -> 70% CRITICAL SHORTAGE, 2 recovery lectures required).
- **Backend API**: Node.js, NestJS 10, TypeScript, REST API, WebSockets, JWT with refresh token rotation, Argon2id, Swagger â€” Running on `http://localhost:3000/api/v1` (Docs: `http://localhost:3000/api/docs`).
  - Dynamic QR Signer: HMAC-SHA256, 15s refresh / 30s expiry, stored nonce in `QrToken`.
  - Device Challenge-Response: 60s single-use challenge tokens, hardware-bound ECDSA P-256 verification, atomic replay prevention.
  - Risk Engine: Multi-layer risk scoring (QR, GPS, Device Key, Biometrics), non-blocking suspicious flagging (`SUSPICIOUS` status triggers teacher review without blocking low-risk students).
  - Session QR refresh endpoints: `POST /api/v1/sessions/:sessionId/qr/refresh` and `GET /api/v1/sessions/:sessionId/qr`.
- **Teacher & Admin Web Dashboard**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, QR code projection (`QRCodeSVG`), Predictive Student Quota & Shortage Guider, Live Dynamic QR Stream with 15s auto-refresh, and one-click teacher physical verification dialog for suspicious attempts â€” Production build verified clean (4.36s build, 0 errors).
- **Student Mobile App**: Flutter (Dart, Material 3, Android & iOS, Dynamic QR Camera Scanner, Geolocation, Device Keystore/Keychain, local_auth) â€” All 17 screens implemented. Dynamic QR Scanner (`attendance_scanner_screen.dart`) acquires live GPS coordinates, requests backend device challenge, signs challenge with hardware Keystore private key, and submits evidence to `/attendance/submit`. 30/30 Flutter unit and widget tests passing, static analysis clean.
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
â”‚       â”œâ”€â”€ attendance/
â”‚       â”‚   â”œâ”€â”€ attendance.controller.ts
â”‚       â”‚   â”œâ”€â”€ attendance.service.ts
â”‚       â”‚   â””â”€â”€ attendance.service.spec.ts (12/12 attendance unit tests passed)
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
- [x] Phase 3: Hardware Security, Cryptographic Binding & Dynamic QR Workflow (15s dynamic QR, 30s expiry, concurrent student redemption, device ECDSA challenge-response, replay & duplicate protection, non-blocking suspicious flagging, teacher override with audit log, 28/28 backend unit tests passed)

## 5. Development Status
- **Current Phase**: Phase 3 Product Milestone â€” **PHASE 3 VERIFIED AND COMPLETE**
- **Current Git Branch**: `main`
- **Latest Checkpoint ID**: checkpoint-020
- **Last Successful Build**:
  - Backend: TypeScript 0 errors, running on port 3000
  - Web Dashboard: Vite production bundle built in 4.36s (0 errors)
  - Student Mobile: Flutter analyze passed with 0 errors / 0 warnings in 2.2s
- **Last Successful Test Run**:
  - Flutter Unit & Widget Tests: 30/30 passed (`attendance_guider_test.dart`, `location_service_test.dart`, `attendance_test.dart`, `notification_test.dart`, `widget_test.dart`)
  - Flutter Static Analyzer: 0 issues (`flutter analyze --no-pub` clean in 2.2s)
  - Backend Unit Tests: 28/28 passed in-band (`attendance.service.spec.ts` 12/12, `reports.service.spec.ts` 8/8, `gps.service.spec.ts` 4/4, `risk.service.spec.ts` 4/4)
  - Backend Notification Suite: 12/12 passed (`verify-notifications-flow.ts`)
  - Backend E2E Integration Suite: 19/19 passed (`verify-e2e-workflow.ts`)
  - Live PostgreSQL Guider API: HTTP 200 authenticated (`GET /reports/guider?target=75`)
- **Known Errors**: 0 compilation/type errors
- **Current Blockers / Environment Notes**:
  - None.

## 6. Required Environment Variables (Names Only)
- `NODE_ENV`, `PORT`, `API_PREFIX`, `CORS_ORIGINS`
- `DATABASE_URL`

