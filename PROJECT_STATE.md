# PROJECT_STATE.md

## 1. Project Overview
Autonomous College Attendance Management System featuring Dynamic QR code projection (15s refresh / 30s expiry), GPS geofencing (strict 75m boundary and 20m accuracy requirement), hardware-bound registered device signatures (ECDSA P-256 Keystore/Keychain), optional local biometrics, random teacher physical verification, and a server-side multi-layer risk scoring engine.
Includes Flutter Student Mobile App (all 17 screens), React TypeScript Web Dashboard (Teachers & Admin), and NestJS PostgreSQL/Redis Backend.

## 2. Technology Stack & Runtime Verification Status
- **PostgreSQL Database**: PostgreSQL 16.6 running locally on `localhost:5432`, managed via Prisma ORM 5.22.0. Database `college_attendance` pushed and seeded. Connectivity verified.
- **Backend API**: Node.js, NestJS 10, TypeScript, REST API, WebSockets, JWT with refresh token rotation, Argon2id, Swagger â€” Running on `http://localhost:3000/api/v1` (Docs: `http://localhost:3000/api/docs`).
- **Teacher & Admin Web Dashboard**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, QR code projection (`QRCodeSVG`) â€” Built and running on `http://localhost:5173`.
- **Student Mobile App**: Flutter (Dart, Material 3, Android & iOS, QR Camera Scanner, Geolocation, Device Keystore/Keychain, local_auth) â€” All 17 required screens created and inspected. Compilation risks (e.g. `Border.parseBorder` replaced with `Border.all`) fixed. *Note: Flutter SDK is not installed on this host system's PATH, so Flutter analyzer and widget tests are deferred until SDK is installed.*
- **Snapshot & Rollback System**: Git + PowerShell scripts (`checkpoint.ps1`, `rollback.ps1`, `db_backup.ps1`, `db_restore.ps1`).

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
â”œâ”€â”€ docs/
â”‚   â”œâ”€â”€ ARCHITECTURE.md
â”‚   â”œâ”€â”€ DATABASE_SCHEMA.md
â”‚   â”œâ”€â”€ SECURITY.md
â”‚   â””â”€â”€ TESTING.md
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
â”‚   â”œâ”€â”€ scripts/verify-e2e-workflow.ts (19/19 E2E Integration tests passed)
â”‚   â””â”€â”€ src/
â”œâ”€â”€ web_dashboard/      (React + Vite + Tailwind - Running on port 5173)
â””â”€â”€ student_mobile/     (Flutter Material 3 Student Mobile App - 17 screens implemented)
```

## 4. Feature Status Matrix
- [x] Phase 0: Safety & Recovery Foundation (Git, Checkpoint & Rollback scripts, State files, verified recovery)
- [x] Phase 1: Project Foundation (NestJS backend, Prisma schema & seed, Argon2id, JWT auth, React dashboard, Flutter app structure)
- [x] Phase 2: Core Attendance Engine & Database Integration (PostgreSQL 16 running & verified, 19/19 E2E integration tests passing)
- [x] Phase 3: Hardware Security & Cryptographic Binding (ECDSA P-256 challenge-response, device registration, risk scoring engine)
- [x] Phase 4: Administration & Verification (Random verification, corrections, reports, audit logs, 75m classroom geofences)
- [x] Phase 5: Quality Assurance & Integration Testing (Jest tests 8/8 passed, E2E tests 19/19 passed, React dashboard built cleanly)
- [ ] Phase 6: Production Native Build (Flutter native APK/IPA compilation once Flutter SDK is installed)

## 5. Development Status
- **Current Phase**: Phase 2 Integration & Functional Verification (Completed)
- **Current Git Branch**: `main`
- **Latest Checkpoint ID**: checkpoint-005
- **Last Successful Build**:
  - Backend: TypeScript 0 errors, running on port 3000
  - Web Dashboard: Vite production bundle built in 5.04s, running on port 5173
- **Last Successful Test Run**:
  - Backend E2E Integration Suite: 19/19 passed (`verify-e2e-workflow.ts`)
  - Backend Unit Tests: 8/8 passed (`gps.service.spec.ts`, `risk.service.spec.ts`)
- **Known Errors**: 0 compilation/type errors
- **Current Blockers / Environment Notes**:
  - Flutter SDK is not installed on the Windows PATH. All 17 Dart screens are authored and inspected, but `flutter analyze` / `flutter test` requires the Flutter SDK installed on the machine.

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
- **Backend API**: `cd backend && npm run start` (Listening on `http://localhost:3000/api/v1`)
- **Web Dashboard**: `cd web_dashboard && npm run preview -- --port 5173 --host` (Listening on `http://localhost:5173`)
- **Run E2E Suite**: `cd backend && npx ts-node scripts/verify-e2e-workflow.ts`
- **Run Unit Tests**: `cd backend && npm test`
- **Create Checkpoint**: `powershell -ExecutionPolicy Bypass -File scripts/checkpoint.ps1 -Description "description"`
- **Rollback to Checkpoint**: `powershell -ExecutionPolicy Bypass -File scripts/rollback.ps1 -CheckpointId "checkpoint-XXX"`

