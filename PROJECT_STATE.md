# PROJECT_STATE.md

## 1. Project Overview
Autonomous College Attendance Management System featuring Dynamic QR code projection (15s refresh / 30s expiry), GPS geofencing (strict 75m boundary and 20m accuracy requirement), hardware-bound registered primary device verification (ECDSA P-256 Keystore/Keychain challenge-response), local biometrics, risk-based teacher physical verification challenges for suspicious attempts, predictive attendance quota guider, multi-classroom geofence management, department-wide compliance auditing, exportable CSV reports, rate limiting, Helmet security headers, refresh token reuse protection, global exception error masking, and containerized deployment readiness.
Includes Flutter Student Mobile App (all 17 screens), React TypeScript Web Dashboard (Teachers & Admin), and NestJS PostgreSQL/Redis Backend.

## 2. Technology Stack & Runtime Verification Status
- **PostgreSQL Database**: PostgreSQL 16.6 running locally on `localhost:5432`, managed via Prisma ORM 5.22.0.
  - Database: `college_attendance`
  - Prisma Migration Baseline: `0_init` and `20261102_phase23_notification_priority` applied and synced (`prisma migrate status` clean).
  - Verified Backup: `backups/verified_phase2_backup_20261031_212123.sql` (54.9 KB, complete DDL + data COPY statements).
  - Portable Binaries: Located in `tools/pgsql` (ignored by `.gitignore`).
  - Real Multi-Subject Attendance Records: Student `CS2026-001` (John Doe) enrolled in `CS601` (11 sessions held, 11 attended -> 100% HEALTHY, 3 safe bunks) and `CS602` (10 sessions held, 7 attended, 3 missed -> 70% CRITICAL SHORTAGE, 2 recovery lectures required).
- **Backend API**: Node.js, NestJS 10, TypeScript, REST API, WebSockets, JWT with refresh token rotation and replay protection, Argon2id, Swagger, Helmet, Throttler — Running on `http://localhost:3000/api/v1` (Docs: `http://localhost:3000/api/docs`).
  - Dynamic QR Signer: HMAC-SHA256, 15s refresh / 30s expiry, stored nonce in `QrToken`.
  - Device Challenge-Response: 60s single-use challenge tokens, hardware-bound ECDSA P-256 verification, atomic replay prevention.
  - Risk Engine: Multi-layer risk scoring (QR, GPS, Device Key, Biometrics), non-blocking suspicious flagging (`SUSPICIOUS` status triggers teacher review without blocking low-risk students).
  - Security Hardening:
    - Rate Limiting: Tiered limits (20 req/s, 100 req/10s, 300 req/min) via `@nestjs/throttler`.
    - Helmet Headers: `nosniff`, `SAMEORIGIN`, `strict-transport-security`, cross-origin protection.
    - Token Reuse Protection: Automatic session invalidation and audit alerts on revoked token replay.
    - Error Masking: `GlobalExceptionsFilter` prevents leakage of database internals or stack traces.
    - CSV Formula Injection Protection: Sanitizes prefixes (`=, +, -, @, \t, \r`) with single-quote prepending.
    - Health Endpoint: `GET /api/v1/auth/health` returning system status, timestamp, and uptime.
- **Teacher & Admin Web Dashboard**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, QR code projection (`QRCodeSVG`), Predictive Student Quota & Shortage Guider, Live Dynamic QR Stream with 15s auto-refresh, Random Physical Check modal, Multi-Classroom Geofence Manager, Audit Log stream viewer, and direct CSV Report Download buttons — Production build verified clean (9.66s build, 0 errors).
- **Student Mobile App**: Flutter (Dart, Material 3, Android & iOS, Dynamic QR Camera Scanner, Geolocation, Device Keystore/Keychain, local_auth) — All 17 screens implemented. Dynamic QR Scanner (`attendance_scanner_screen.dart`) acquires live GPS coordinates, requests backend device challenge, signs challenge with hardware Keystore private key, and submits evidence to `/attendance/submit`. 30/30 Flutter unit and widget tests passing, static analysis clean.
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
│   ├── FEATURE_IMPLEMENTATION_PLAN.md
│   ├── FLUTTER_SETUP_GUIDE.md (Step-by-step Windows setup guide)
│   ├── SECURITY.md
│   ├── TESTING.md
│   └── evidence/       (Pixel 6 emulator UI verification captures)
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
│   ├── Dockerfile      (Production multi-stage build, non-root user, healthcheck)
│   ├── prisma/
│   │   ├── migrations/0_init/migration.sql
│   │   ├── migrations/20261102_phase23_notification_priority/migration.sql
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── scripts/
│   │   ├── verify-phase5-security.ts (23/23 Security & Readiness tests passed)
│   │   ├── verify-phase4-admin.ts (20/20 Phase 4 Admin verification tests passed)
│   │   ├── verify-e2e-workflow.ts (19/19 E2E Integration tests passed)
│   │   └── verify-notifications-flow.ts (12/12 Notification tests passed)
│   └── src/
│       ├── common/filters/http-exception.filter.ts
│       ├── config/env.validation.ts
│       ├── admin/
│       ├── attendance/
│       ├── random-verification/
│       └── reports/
├── web_dashboard/      (React + Vite + Tailwind - Built for production with 0 errors)
│   ├── Dockerfile      (Production Nginx multi-stage build)
│   └── nginx.conf      (SPA fallback & security headers)
└── student_mobile/     (Flutter Material 3 Student Mobile App - 17 screens implemented, 30/30 tests passed)
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
- [x] Phase 4: Administration, Real-Time Monitoring & Physical Verification (Risk-based random physical verification challenges with Fisher-Yates sampling, multi-classroom geofence CRUD, department-wide attendance auditing, RFC 4180 exportable compliance & shortage CSV reports, 20/20 Phase 4 verification tests passed, 28/28 backend unit tests passed, 30/30 Flutter tests passed)
- [x] Phase 5: Production Readiness, Security Hardening & Complete System Verification (Rate limiting, Helmet security headers, CORS origin isolation, CSRF mitigation, JWT refresh token rotation with reuse detection, global exception masking, CSV formula-injection protection, environment validation, multi-stage Dockerfiles, 23/23 Phase 5 security tests passed)

## 5. Development Status
- **Current Phase**: Phase 5 Product Milestone — **PHASE 5 VERIFIED AND COMPLETE**
- **Current Git Branch**: `main`
- **Latest Checkpoint ID**: checkpoint-024
- **Last Successful Build**:
  - Backend: TypeScript 0 errors (scoped include in tsconfig.json, running on port 3000)
  - Web Dashboard: Vite production bundle built in 9.66s (0 errors)
  - Student Mobile: Flutter analyze passed with 0 errors / 0 warnings in 42.2s
- **Last Successful Test Run**:
  - Phase 5 Security Verification Suite: 23/23 passed (`verify-phase5-security.ts`)
  - Phase 4 Admin Verification Suite: 20/20 passed (`verify-phase4-admin.ts`)
  - Flutter Unit & Widget Tests: 30/30 passed (`attendance_guider_test.dart`, `location_service_test.dart`, `attendance_test.dart`, `notification_test.dart`, `widget_test.dart`)
  - Flutter Static Analyzer: 0 issues (`flutter analyze --no-pub` clean)
  - Backend Unit Tests: 28/28 passed in-band (`attendance.service.spec.ts` 12/12, `reports.service.spec.ts` 8/8, `gps.service.spec.ts` 4/4, `risk.service.spec.ts` 4/4)
  - Backend Notification Suite: 12/12 passed (`verify-notifications-flow.ts`)
  - Backend E2E Integration Suite: 19/19 passed (`verify-e2e-workflow.ts`)
- **Known Errors**: 0 compilation/type errors
- **Current Blockers / Environment Notes**:
  - None.

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
