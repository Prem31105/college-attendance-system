# PROJECT_STATE.md

## 1. Project Overview
Autonomous College Attendance Management System featuring Dynamic QR code projection, GPS geofencing (75m), hardware-bound registered device signatures (Keystore/Keychain), optional local biometrics, random teacher verification, and a server-side multi-layer risk scoring engine.
Includes Flutter Student Mobile App, React TypeScript Web Dashboard (Teachers & Admin), and NestJS PostgreSQL/Redis Backend.

## 2. Technology Stack
- **Student Mobile App**: Flutter (Dart, Material 3, Android & iOS, QR Camera Scanner, Geolocation, Device Keystore/Keychain, local_auth)
- **Teacher & Admin Web Dashboard**: React, TypeScript, Vite, Tailwind CSS, Lucide Icons, WebSockets
- **Backend API**: Node.js, NestJS, TypeScript, REST API, WebSockets, JWT with refresh token rotation, Argon2id
- **Database & Cache**: PostgreSQL with Prisma ORM, Redis for caching & rapid nonce deduplication
- **Infrastructure**: Docker & Docker Compose, Environment-based configuration, Git & PowerShell snapshot/rollback system

## 3. Current Architecture & Folder Structure
```
d:\flutter attandance\
â”œâ”€â”€ .gitignore
â”œâ”€â”€ .env.example
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
â”‚   â””â”€â”€ db_restore.ps1
â”œâ”€â”€ backend/            (NestJS API & Prisma ORM)
â”œâ”€â”€ web_dashboard/      (React + Vite + Tailwind Teacher/Admin Dashboard)
â””â”€â”€ student_mobile/     (Flutter Material 3 Student Mobile App)
```

## 4. Feature Status Matrix
- [x] Phase 0: Safety & Recovery Foundation (Git, Checkpoint & Rollback scripts, State files)
- [ ] Phase 1: Project Foundation (NestJS backend, Prisma Schema & Migrations, Auth, RBAC, React setup, Flutter setup)
- [ ] Phase 2: Core Attendance Engine (Dynamic QR generation & validation, GPS geofencing, Teacher live dashboard)
- [ ] Phase 3: Hardware Device & Security Verification (ECDSA challenge/response, device integrity, risk scoring)
- [ ] Phase 4: Administration & Verification (Random verification, corrections, reports, audit logs)
- [ ] Phase 5: Quality Assurance & Load Testing (Concurrency testing, unit & integration tests)
- [ ] Phase 6: Build & Production Readiness (Docker Compose, build verification)

## 5. Development Status
- **Current Phase**: Phase 0 (Project Safety & Recovery Foundation)
- **Current Git Branch**: `main`
- **Latest Stable Commit Hash**: 36b5684a4f9e31405649ae709d7a22bc312964cf
- **Latest Checkpoint ID**: checkpoint-001
- **Last Successful Build**: Initializing
- **Last Successful Test Run**: Pending recovery test
- **Known Errors**: None
- **Current Blockers**: None

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

## 7. External Integrations Still Requiring Production Credentials
- Google Play Integrity API (Service Account JSON needed for production deployment; fallback stub enabled for dev/test)
- Apple App Attest / DeviceCheck (Apple Developer Team ID needed for production deployment; fallback stub enabled for dev/test)

## 8. Exact Commands to Start the Project
- **Backend**: `cd backend && npm run start:dev`
- **Web Dashboard**: `cd web_dashboard && npm run dev`
- **Flutter Mobile App**: `cd student_mobile && flutter run`
- **Docker Stack**: `docker-compose up -d`

## 9. Exact Commands to Run Tests
- **Backend Tests**: `cd backend && npm test`
- **Web Dashboard Tests**: `cd web_dashboard && npm test`
- **Checkpoint Creation**: `powershell -ExecutionPolicy Bypass -File scripts/checkpoint.ps1 -Description "description"`
- **Rollback**: `powershell -ExecutionPolicy Bypass -File scripts/rollback.ps1 -CheckpointId "checkpoint-XXX"`

## 10. The Next Three Development Tasks
1. Complete and verify Phase 0 snapshot/checkpoint/rollback scripts.
2. Initialize Phase 1: Set up NestJS backend with Prisma ORM schema, migrations, seed, Argon2id, JWT auth, and RBAC guards.
3. Initialize Phase 1: Set up React Web Dashboard with Tailwind CSS and base routing.

