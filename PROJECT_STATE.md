# PROJECT_STATE.md

## 1. Project Overview
Autonomous College Attendance Management System featuring Dynamic QR code projection, GPS geofencing (75m), hardware-bound registered device signatures (Keystore/Keychain), optional local biometrics, random teacher verification, and a server-side multi-layer risk scoring engine.
Includes Flutter Student Mobile App, React TypeScript Web Dashboard (Teachers & Admin), and NestJS PostgreSQL/Redis Backend.

## 2. Technology Stack
- **Student Mobile App**: Flutter (Dart, Material 3, Android & iOS, QR Camera Scanner, Geolocation, Device Keystore/Keychain, local_auth) — All 17 required screens created.
- **Teacher & Admin Web Dashboard**: React, TypeScript, Vite, Tailwind CSS, Lucide Icons, QR code projection — Built and running on http://localhost:5173.
- **Backend API**: Node.js, NestJS, TypeScript, REST API, WebSockets, JWT with refresh token rotation, Argon2id, Swagger — Built and running on http://localhost:3000/api/v1.
- **Database & Cache**: PostgreSQL with Prisma ORM (Schema + Seed ready), Redis configuration, Docker Compose stack.
- **Infrastructure**: Docker & Docker Compose, Environment-based configuration, Git & PowerShell snapshot/rollback system.

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
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
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
│   └── db_restore.ps1
├── backend/            (NestJS API & Prisma ORM - Running on port 3000)
├── web_dashboard/      (React + Vite + Tailwind - Running on port 5173)
└── student_mobile/     (Flutter Material 3 Student Mobile App - 17 screens implemented)
```

## 4. Feature Status Matrix
- [x] Phase 0: Safety & Recovery Foundation (Git, Checkpoint & Rollback scripts, State files, verified recovery)
- [x] Phase 1: Project Foundation (NestJS backend running, Prisma schema & seed, Argon2id, JWT auth, React dashboard running, Flutter app structure)
- [x] Phase 2: Core Attendance Engine (Dynamic QR generation & validation, GPS geofencing, Teacher live dashboard)
- [x] Phase 3: Hardware Device & Security Verification (ECDSA challenge/response, device integrity, risk scoring engine)
- [x] Phase 4: Administration & Verification (Random verification, corrections, reports, audit logs, classroom geofences)
- [x] Phase 5: Quality Assurance & Load Testing (Backend unit tests passing 8/8, 0 TypeScript compilation errors)
- [ ] Phase 6: Build & Production Deployment (Docker container build, Flutter native compilation once SDK is installed)

## 5. Development Status
- **Current Phase**: Phase 5 (Quality Assurance & Runtime Verification Completed)
- **Current Git Branch**: `main`
- **Latest Checkpoint ID**: `checkpoint-004`
- **Last Successful Build**:
  - Backend: TypeScript 0 errors, running on port 3000
  - Web Dashboard: Vite production bundle built in 11.03s, running on port 5173
- **Last Successful Test Run**: Backend Jest tests (8 passed, 0 failed)
- **Known Errors**: 0 compilation/type errors
- **Current Blockers**:
  - Docker Desktop and native PostgreSQL daemon are not installed on the host OS (backend uses safe development fallback).
  - Flutter SDK is not added to Windows PATH (full Dart source code for all 17 screens authored).

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
- **Backend API**: `cd backend && npm run start` (Listening on port 3000)
- **Web Dashboard**: `cd web_dashboard && npm run preview -- --port 5173 --host` (Listening on port 5173)
- **Backend Tests**: `cd backend && npm test`
- **Web Dashboard Tests/Build**: `cd web_dashboard && npm run build`
- **Create Checkpoint**: `powershell -ExecutionPolicy Bypass -File scripts/checkpoint.ps1 -Description "description"`
- **Rollback to Checkpoint**: `powershell -ExecutionPolicy Bypass -File scripts/rollback.ps1 -CheckpointId "checkpoint-XXX"`
