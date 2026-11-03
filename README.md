# 🎓 Autonomous College Attendance Management System
### Enterprise-Grade Zero-Trust Physical Presence Verification & Attendance Management

[![NestJS](https://img.shields.io/badge/NestJS-10.0-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-18.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Flutter](https://img.shields.io/badge/Flutter-3.x-02569B?style=flat-square&logo=flutter&logoColor=white)](https://flutter.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.6-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement & Motivation](#2-problem-statement--motivation)
3. [Key Highlights & Architectural Features](#3-key-highlights--architectural-features)
4. [Technology Stack](#4-technology-stack)
5. [System Architecture](#5-system-architecture)
6. [Role-Based Access Control (RBAC)](#6-role-based-access-control-rbac)
7. [Dynamic QR Attendance Workflow](#7-dynamic-qr-attendance-workflow)
8. [GPS Geofencing & Hardware Cryptographic Device Binding](#8-gps-geofencing--hardware-cryptographic-device-binding)
9. [Attendance Dispute & Two-Way Messaging Workflow](#9-attendance-dispute--two-way-messaging-workflow)
10. [Database Architecture & Schema](#10-database-architecture--schema)
11. [API Documentation & Swagger Reference](#11-api-documentation--swagger-reference)
12. [Local Installation & Developer Setup](#12-local-installation--developer-setup)
13. [Database Migration & Seed Guide](#13-database-migration--seed-guide)
14. [Environment Configuration](#14-environment-configuration)
15. [Automated Verification & Test Execution](#15-automated-verification--test-execution)
16. [Security Limitations & Threat Modeling](#16-security-limitations--threat-modeling)
17. [Application Screenshots](#17-application-screenshots)
18. [Project Structure, Demo Accounts & License](#18-project-structure-demo-accounts--license)

---

## 1. Project Overview

The **Autonomous College Attendance Management System** is a zero-trust, multi-tiered presence verification platform designed for higher education institutions. Rather than relying on easily spoofed mechanisms such as static barcodes, paper rosters, or legacy biometric scanners, the system mandates a synchronized cryptographic handshake between the classroom projection screen, the student's physical device hardware, and real-time geospatial satellites.

The project encompasses three integrated software tiers:
- **Student Mobile Application** (Flutter / Dart): Native cross-platform client with hardware keystore integration, dynamic camera scanner, geospatial radar, and real-time attendance dispute center.
- **Faculty & Administrator Web Portal** (React / TypeScript / Vite / Tailwind CSS): Low-latency dashboard providing live dynamic QR projection, attendance monitoring, dispute resolution messaging, multi-classroom geofence management, and compliance auditing.
- **Enterprise REST & Real-Time API** (NestJS / TypeScript / PostgreSQL / Prisma ORM): Hardened backend featuring HMAC-SHA256 token generation, ECDSA P-256 signature verification, tiered rate limiting, OWASP-compliant security headers, and immutable audit logging.

---

## 2. Problem Statement & Motivation

Traditional university attendance tracking suffers from systemic operational vulnerabilities:
1. **Buddy Punching & Proxy Attendance**: Students share static QR codes via messaging apps or sign physical attendance sheets for absent peers.
2. **Geographic Spoofing**: Simple location-based apps are readily circumvented using mock location tools, GPS spoofers, or VPN routing.
3. **Hardware Impersonation**: Sharing institutional login credentials allows one student to register attendance for multiple classmates from a single smartphone.
4. **Administrative Bottlenecks**: Resolving attendance discrepancies requires manual paper forms, email chains, and administrative friction.
5. **Lack of Predictive Student Guidance**: Students discover attendance shortages only at the end of the semester when exam disqualification is already irreversible.

**Our Solution**: An autonomous zero-trust attendance engine combining short-lived dynamic QR tokens (15s refresh / 30s lifetime), mathematical GPS geofencing (75m radius with accuracy thresholds), registered hardware-keystore cryptographic challenge-response, multi-layer risk scoring, and a full two-way dispute resolution workflow.

---

## 3. Key Highlights & Architectural Features

- **Rotating Dynamic QR Codes**: Emitted by the instructor's console with monotonic nonces and HMAC-SHA256 signatures; expires within 30 seconds to prevent screen photographing and unauthorized sharing.
- **Strict Haversine GPS Geofencing**: Validates that student coordinates lie within 75 meters of the scheduled classroom center point with a maximum acceptable GPS error radius of 20 meters.
- **Hardware-Bound ECDSA P-256 Challenge-Response**: During enrollment, a student's mobile device generates a hardware-backed keypair in the Android Keystore / iOS Keychain. Attendance submission requires signing a single-use 60-second cryptographic challenge using this private key.
- **Multi-Factor Verification Layer Bitmask**: Each verified attendance record stores an audit bitmask tracking which verification layers were satisfied:
  - Bit `1`: Dynamic QR HMAC verified.
  - Bit `2`: GPS coordinates within geofence.
  - Bit `4`: Registered hardware device signature verified.
  - Bit `8`: Biometric authentication confirmed.
  - Bit `16`: Teacher manual verification override.
  - Bit `64`: Two-way formal attendance dispute approved.
- **Two-Way Attendance Dispute System**: Allows students marked absent to submit structured disputes, engage in threaded two-way messaging with the assigned professor, and receive formal dispute resolution with immutable audit trails.
- **Predictive Smart Quota Guider**: Informs students of exact "safe bunks" (lectures they may miss while maintaining $\ge 75\%$) or consecutive lectures required to recover from a critical attendance shortage.
- **Immutable Audit Logging**: Every administrative action, dispute adjudication, status change, and security anomaly is permanently recorded in `AttendanceAuditLog` with actor attribution and forensic metadata.
- **Production-Hardened Security**: Integrated `@nestjs/throttler` tiered rate limiting, Helmet HTTP security headers, JWT refresh token rotation with automated token family reuse revocation, and CSV formula injection neutralization (OWASP).

---

## 4. Technology Stack

### Mobile Application (`student_mobile`)
- **Framework**: Flutter 3.x (Dart 3.x)
- **Design System**: Material Design 3 with custom dark institutional palette
- **State Management**: Scoped State / Reactive Providers
- **Device Security**: `flutter_secure_storage`, `local_auth` (Biometrics)
- **Hardware Cryptography**: `pointycastle` (ECDSA P-256 keypair generation & challenge signing)
- **Sensors & Peripherals**: `geolocator` (GPS coordinates & mock detection), `qr_code_scanner_plus`

### Web Dashboard (`web_dashboard`)
- **Framework**: React 18 with TypeScript 5
- **Build System**: Vite 5
- **Styling**: Tailwind CSS & Lucide Icons
- **Real-Time Communication**: Native WebSocket client with auto-reconnection
- **QR Projection**: `qrcode.react` SVG renderer with sub-second animation
- **Data Tables & Charts**: Responsive Tailwind data grids and analytics cards

### Backend API & Database (`backend`)
- **Runtime & Framework**: Node.js 20+ LTS, NestJS 10, TypeScript 5
- **ORM & Data Layer**: Prisma ORM 5.22.0
- **Database**: PostgreSQL 16.6 with strict relational constraints and indexing
- **Authentication**: JWT (Access Token 15m / Refresh Token 7d) with Argon2id password hashing
- **Security & Middleware**: `helmet`, `@nestjs/throttler`, custom `GlobalExceptionsFilter`
- **Documentation**: Swagger OpenAPI (`/api/docs`)

---

## 5. System Architecture

### High-Level Component Architecture

```mermaid
flowchart TD
    subgraph Classroom ["Classroom & Instructor"]
        TeacherPortal["React Web Dashboard\n(Teacher Console)"]
        Projector["Display Screen\n(Dynamic QR Code)"]
        TeacherPortal -->|"Render SVG QR\n(Refreshes every 15s)"| Projector
    end

    subgraph StudentDevice ["Student Mobile App (Flutter)"]
        Camera["QR Camera Scanner"]
        GPS["GPS Sensor\n(Haversine Distance)"]
        Keystore["Secure Hardware Keystore\n(ECDSA P-256 Private Key)"]
        MobileClient["Flutter API Client"]
        Camera --> MobileClient
        GPS --> MobileClient
        Keystore --> MobileClient
    end

    subgraph ServerInfrastructure ["NestJS Backend & Storage"]
        API["NestJS REST & WebSocket API"]
        AuthModule["Auth & RBAC Module"]
        QRService["QR HMAC Signer & Nonce Store"]
        GeoService["Geofence & Mock Detector"]
        CryptoService["ECDSA Verification Engine"]
        AuditService["Immutable Audit Logger"]
        Postgres[(PostgreSQL 16\nDatabase)]

        API --> AuthModule
        API --> QRService
        API --> GeoService
        API --> CryptoService
        API --> AuditService
        AuthModule --> Postgres
        QRService --> Postgres
        GeoService --> Postgres
        CryptoService --> Postgres
        AuditService --> Postgres
    end

    TeacherPortal -->|"POST /attendance/session/start"| API
    Projector -.->|"Visual Scan"| Camera
    MobileClient -->|"POST /attendance/device-challenge"| API
    MobileClient -->|"POST /attendance/submit"| API
```

---

## 6. Role-Based Access Control (RBAC)

The system enforces strict multi-role isolation across all endpoints and UI views:

| Capability | Student | Teacher | Administrator |
|:---|:---:|:---:|:---:|
| Scan Dynamic QR & Submit Attendance Evidence | ✅ | ❌ | ❌ |
| View Personal Attendance Statistics & Smart Guider | ✅ | ❌ | ❌ |
| Submit Attendance Dispute on `ABSENT` Session | ✅ | ❌ | ❌ |
| Two-Way Dispute Chat Messaging | ✅ | ✅ | ❌ |
| Start & Project Dynamic QR Attendance Sessions | ❌ | ✅ | ✅ |
| Trigger Random Physical Verification Check | ❌ | ✅ | ✅ |
| Review, Approve (Bitmask 64) or Reject Disputes | ❌ | ✅ | ❌ |
| Multi-Classroom Geofence Management (Radius & Lat/Lng) | ❌ | ❌ | ✅ |
| Department Compliance Audit & Suspicious Adjudication | ❌ | ❌ | ✅ |
| Export RFC 4180 Compliant CSV Audit Reports | ❌ | ❌ | ✅ |

---

## 7. Dynamic QR Attendance Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Teacher as Faculty Member
    participant Screen as Classroom Projector
    actor Student as Student
    participant Mobile as Student Mobile App
    participant Backend as NestJS API
    participant DB as PostgreSQL

    Teacher->>Backend: POST /attendance/session/start (Subject, Room)
    Backend->>DB: Create AttendanceSession (ACTIVE)
    loop Every 15 Seconds
        Backend->>Backend: Generate Nonce + HMAC-SHA256(SessionId, Nonce, Secret)
        Backend->>DB: Store Nonce in QrToken (TTL: 30s)
        Backend-->>Teacher: Emit Dynamic QR Token Payload
        Teacher->>Screen: Render Dynamic QR Code
    end

    Student->>Mobile: Aim Camera at Projected QR Code
    Mobile->>Mobile: Decode Token (SessionId, Timestamp, Nonce, Signature)
    Mobile->>Mobile: Acquire GPS Coordinates (Lat, Lng, Accuracy)
    Mobile->>Backend: POST /attendance/device-challenge (StudentId)
    Backend-->>Mobile: Return Single-Use Challenge Token (TTL: 60s)
    Mobile->>Mobile: Sign Challenge with Keystore Private Key (ECDSA P-256)
    Mobile->>Backend: POST /attendance/submit (Token, GPS, Signed Challenge)

    Backend->>Backend: 1. Validate QR Token Signature & Nonce Expiry (<30s)
    Backend->>Backend: 2. Validate GPS Haversine Distance (<= 75m) & Accuracy (<= 20m)
    Backend->>Backend: 3. Verify Hardware ECDSA Signature against Registered Public Key
    Backend->>Backend: 4. Check for Duplicate or Replay Submissions
    Backend->>DB: Insert AttendanceRecord (VERIFIED, Bitmask: 15)
    Backend->>DB: Log AttendanceAuditLog Entry
    Backend-->>Mobile: HTTP 201 Created (Attendance Verified)
```

---

## 8. GPS Geofencing & Hardware Cryptographic Device Binding

### Mathematical Geofencing Formula
The backend computes geodesic distances using the **Haversine formula** to prevent spherical distortion:

$$\Delta\sigma = 2 \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)} \right)$$

$$d = R \cdot \Delta\sigma$$

Where:
- $R = 6,371,000 \text{ meters}$ (Mean Earth radius)
- $\phi_1, \phi_2$ = Classroom and student latitudes in radians
- $\Delta\lambda$ = Difference in longitude in radians
- Threshold: $d \le 75\text{ meters}$, with student GPS accuracy $\le 20\text{ meters}$.

### Hardware Device Binding Protocol
1. **Enrollment**: Upon first registration, the Flutter client invokes `pointycastle` to generate an asymmetric `secp256r1` (ECDSA P-256) keypair inside Android Keystore / iOS Keychain.
2. The public key is transmitted to `POST /auth/register-device` and permanently bound to the student's profile.
3. **Challenge Verification**: Before attendance submission, the student requests `POST /attendance/device-challenge`. The server generates a cryptographically random 32-byte hex challenge valid for 60 seconds.
4. The mobile app signs this challenge using its hardware private key. The server verifies the signature against the student's stored public key. An emulator or foreign device lacking the physical private key cannot forge this proof.

---

## 9. Attendance Dispute & Two-Way Messaging Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student (Aarav Sharma)
    participant Mobile as Mobile App
    actor Teacher as Teacher (Prof. Rahul Mehta)
    participant Dashboard as Web Dashboard
    participant Backend as NestJS API
    participant DB as PostgreSQL

    Student->>Mobile: Open Attendance History -> Select ABSENT Session
    Student->>Mobile: Tap "Report Incorrect" -> Enter Reason (>= 5 chars)
    Mobile->>Backend: POST /disputes (SessionId, Reason)
    Backend->>DB: Create AttendanceDispute (status: PENDING)
    Backend->>DB: Create initial DisputeMessage
    Backend->>DB: Dispatch Notification to Assigned Teacher
    Backend-->>Mobile: Dispute Created Successfully

    Teacher->>Dashboard: Open "Disputes & Inquiries" Console
    Dashboard->>Backend: GET /disputes/teacher
    Backend-->>Dashboard: Return Pending Disputes List
    Teacher->>Dashboard: Select Dispute -> Click "Mark Under Review"
    Dashboard->>Backend: PATCH /disputes/:id/status (UNDER_REVIEW)
    Backend->>DB: Update DisputeStatus to UNDER_REVIEW
    Backend->>DB: Dispatch Notification to Student

    Teacher->>Dashboard: Type Reply: "I will check the physical roster."
    Dashboard->>Backend: POST /disputes/:id/messages
    Backend->>DB: Insert DisputeMessage
    Backend-->>Mobile: Push Real-Time Message Notification

    Teacher->>Dashboard: Click "Approve Attendance"
    Dashboard->>Backend: POST /disputes/:id/approve (Resolution Note)
    Backend->>DB: Transaction:
    Backend->>DB: 1. Update AttendanceDispute to RESOLVED
    Backend->>DB: 2. Upsert AttendanceRecord to VERIFIED (Bitmask: 64)
    Backend->>DB: 3. Insert AttendanceAuditLog (DISPUTE_CORRECTION_APPROVED)
    Backend->>DB: 4. Dispatch Resolved Notification to Student
    Backend-->>Dashboard: Dispute Approved
```

---

## 10. Database Architecture & Schema

The relational database runs on PostgreSQL 16.6 and is managed via Prisma ORM.

### Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o| Student : "profile"
    User ||--o| Teacher : "profile"
    User ||--o{ AttendanceAuditLog : "actor"
    User ||--o{ Notification : "recipient"
    User ||--o{ DisputeMessage : "messages sent"

    Classroom ||--o{ AttendanceSession : "hosts"
    Subject ||--o{ AttendanceSession : "subject of"
    Subject ||--o{ Timetable : "scheduled in"

    Teacher ||--o{ AttendanceSession : "conducts"
    Teacher ||--o{ Timetable : "assigned to"
    Teacher ||--o{ AttendanceDispute : "adjudicates"

    AttendanceSession ||--o{ QrToken : "generates"
    AttendanceSession ||--o{ AttendanceRecord : "records"
    AttendanceSession ||--o{ AttendanceDispute : "disputed in"

    Student ||--o{ AttendanceRecord : "submits"
    Student ||--o{ DeviceChallenge : "challenges"
    Student ||--o{ AttendanceDispute : "files"

    AttendanceDispute ||--o{ DisputeMessage : "threaded conversation"
    AttendanceRecord ||--o| AttendanceDispute : "appeals"
```

### Cascading Rules & Audit Integrity
- **Deletions**: Cascading deletes (`ON DELETE CASCADE`) are restricted to session tokens, temporary challenges, and direct student profile children.
- **Dispute Appeal Preservation**: `AttendanceRecord` deletions set `attendanceRecordId` in `AttendanceDispute` to `SET NULL`, ensuring student appeal histories are never erased.
- **Audit Immutability**: `AttendanceAuditLog` has no foreign key cascades and cannot be modified or dropped by operational workflows.

---

## 11. API Documentation & Swagger Reference

When the backend is running, complete interactive OpenAPI documentation is available at:
**`http://localhost:3000/api/docs`**

### Key REST Endpoints

| Method | Endpoint | Access | Purpose |
|:---|:---|:---:|:---|
| `POST` | `/api/v1/auth/login` | Public | Authenticates user; returns access token + refresh token. |
| `POST` | `/api/v1/auth/refresh-token` | Public | Rotates JWT tokens; triggers family revocation on reuse. |
| `GET` | `/api/v1/auth/health` | Public | Container healthcheck (status, timestamp, uptime). |
| `POST` | `/api/v1/attendance/session/start` | Teacher/Admin | Initializes a new classroom attendance session. |
| `GET` | `/api/v1/attendance/session/:id/qr-stream` | Teacher/Admin | Returns active dynamic QR token (15s rotation). |
| `POST` | `/api/v1/attendance/device-challenge` | Student | Generates 60s ECDSA hardware challenge. |
| `POST` | `/api/v1/attendance/submit` | Student | Submits dynamic QR token, GPS, and device signature. |
| `GET` | `/api/v1/attendance/student/history` | Student | Retrieves personal attendance history with dispute status. |
| `GET` | `/api/v1/disputes/student` | Student | Lists disputes submitted by authenticated student. |
| `GET` | `/api/v1/disputes/teacher` | Teacher | Lists disputes assigned to authenticated teacher. |
| `POST` | `/api/v1/disputes` | Student | Submits formal dispute on an `ABSENT` session. |
| `POST` | `/api/v1/disputes/:id/messages` | Student/Teacher | Appends message to two-way dispute discussion thread. |
| `POST` | `/api/v1/disputes/:id/approve` | Teacher | Approves dispute, updating attendance to `VERIFIED` (bitmask 64). |
| `POST` | `/api/v1/disputes/:id/reject` | Teacher | Rejects dispute with mandatory justification reason. |
| `GET` | `/api/v1/admin/classrooms` | Admin | Lists all configured classroom geofence zones. |
| `POST` | `/api/v1/admin/classrooms` | Admin | Creates or updates classroom geofence coordinates and radius. |
| `GET` | `/api/v1/reports/export/csv` | Admin | Exports RFC 4180 compliant attendance compliance CSV. |
| `GET` | `/api/v1/reports/export/shortage/csv` | Admin | Exports critical attendance shortage report ($<75\%$). |

---

## 12. Local Installation & Developer Setup

### Prerequisites
- **Node.js**: `v20.x` or higher
- **PostgreSQL**: `16.x`
- **Flutter SDK**: `3.x` with Dart `3.x`
- **Android Studio / SDK**: Android SDK Platform 35+, platform-tools (ADB)

### Step 1: Clone Repository
```bash
git clone https://github.com/<your-username>/college-attendance-system.git
cd college-attendance-system
```

### Step 2: Configure Environment
Copy the example environment file:
```bash
cp .env.example backend/.env
```
*(Review `backend/.env` to confirm database connection parameters and ports).*

### Step 3: Install Dependencies
```bash
# Backend dependencies
cd backend && npm install

# Web Dashboard dependencies
cd ../web_dashboard && npm install

# Student Mobile dependencies
cd ../student_mobile && flutter pub get
```

### Step 4: Run Database Migrations & Seed
```bash
cd backend
npx prisma migrate deploy
npx prisma db seed
```

### Step 5: Start Development Services
```bash
# Terminal 1: NestJS Backend API (Port 3000)
cd backend && npm run start:dev

# Terminal 2: React Web Dashboard (Port 5173)
cd web_dashboard && npm run dev

# Terminal 3: Flutter Student Mobile App (Pixel 6 Emulator or Physical Device)
cd student_mobile && flutter run
```

---

## 13. Database Migration & Seed Guide

The database schema evolution is tracked via sequential, reproducible Prisma migrations:

```
backend/prisma/migrations/
├── 0_init/
│   └── migration.sql                                  # Baseline database entities & enums
├── 20261102_phase23_notification_priority/
│   └── migration.sql                                  # Notification priorities & channels
└── 20261103_phase7_attendance_disputes/
    └── migration.sql                                  # Dispute models & ABSENT status enum
```

### Checking Migration Status
```bash
cd backend
npx prisma migrate status
```
*Expected output: `3 migrations found in prisma/migrations. Database schema is up to date!`*

---

## 14. Environment Configuration

The application uses typed configuration with strict validation. Sample configuration (`.env.example`):

```ini
# Database Connection
DATABASE_URL="postgresql://attendance_admin:attendance_secure_pass@localhost:5432/college_attendance?schema=public"

# Cryptographic Secrets (Minimum 32 characters in production)
JWT_ACCESS_SECRET="dev_jwt_access_secret_for_docker_testing_only_change_in_prod_64char_string"
JWT_REFRESH_SECRET="dev_jwt_refresh_secret_for_docker_testing_only_change_in_prod_64char_string"
QR_HMAC_SECRET="dev_qr_hmac_secret_for_docker_testing_only_change_in_prod_64char_string"

# Server Port & Mode
PORT=3000
NODE_ENV=development

# Attendance Protocol Timers
QR_REFRESH_INTERVAL_SECONDS=15
QR_TOKEN_VALIDITY_SECONDS=30

# Geofencing Parameters
DEFAULT_GEOFENCE_RADIUS_METERS=75
MAX_ACCEPTED_GPS_ACCURACY_METERS=20
```

> [!IMPORTANT]
> In production environments (`NODE_ENV=production`), the application runtime strictly validates secret lengths and prevents startup if default development prefixes (`dev_...`) are detected.

---

## 15. Automated Verification & Test Execution

The codebase maintains automated test suites across all layers.

### Backend Unit & Integration Tests
```bash
cd backend
npm test
```
*Coverage: 28 / 28 unit tests passing (`attendance.service.spec.ts`, `reports.service.spec.ts`, `gps.service.spec.ts`, `risk.service.spec.ts`).*

### Automated Security & Verification Suites
Execute directly against the running backend and PostgreSQL database:
```bash
cd backend

# Phase 7: Attendance Disputes & Two-Way Messaging Suite (8 stages)
npx ts-node scripts/verify-phase7-disputes.ts

# Phase 5: Production Security, Rate Limiting & OWASP Suite (23 tests)
npx ts-node scripts/verify-phase5-security.ts

# Phase 4: Administrative Geofencing & Auditing Suite (20 tests)
npx ts-node scripts/verify-phase4-admin.ts

# Phase 6: Authentication & Multi-Role RBAC Suite (10 tests)
npx ts-node scripts/verify-phase6-auth.ts

# End-to-End Dynamic Attendance Workflow Suite (19 tests)
npx ts-node scripts/verify-e2e-workflow.ts
```

### Flutter Student Mobile Tests & Static Analysis
```bash
cd student_mobile

# Execute 30 unit & widget tests
flutter test

# Run static analysis
flutter analyze --no-pub
```
*Result: 30 / 30 tests passing, 0 issues found.*

### Web Dashboard Production Build
```bash
cd web_dashboard
npm run build
```
*Result: 1,591 modules transformed, 0 errors, optimized production bundle.*

---

## 16. Security Limitations & Threat Modeling

In accordance with rigorous engineering practices, we transparently document the trust boundaries and operational limitations of the current implementation:

1. **Rooted Devices & Kernel-Level GPS Spoofers**: Advanced kernel-level hooking (e.g., Magisk with mock-location masking) can feed false GPS coordinates to the operating system's location service. While the backend verifies accuracy thresholds and mock flags, absolute location trust requires hardware-level cellular tower / carrier verification.
2. **Optical Relay Attacks (Wormhole Attack)**: If an accomplice in the classroom live-streams high-definition video of the rotating QR code to an off-site student with negligible latency ($<15\text{s}$), the remote student could scan the token. However, our system thwarts this attack via **Layer 2 (GPS Geofence)** and **Layer 3 (Hardware Device Signature)** — the remote student will fail the 75-meter geofence check.
3. **Emulator Fallback Mode**: When running on development emulators lacking an ARM TrustZone hardware keystore, the Flutter client gracefully falls back to a software-backed cryptographic container. In production builds, this fallback can be disabled via build configuration flags.
4. **Transport Layer Security (TLS)**: Production deployments require reverse-proxy TLS termination (HTTPS / WSS) to ensure all tokens and signatures remain immune to passive network eavesdropping.

---

## 17. Application Screenshots

### Student Mobile Application (Flutter)

| 1. Student Home Dashboard | 2. Attendance & Smart Guider |
|:---:|:---:|
| ![Student Home](docs/screenshots/01_student_home_dashboard.png) | ![Attendance History](docs/screenshots/02_student_attendance_history.png) |
| *Real-time status, quick statistics, and urgent quota alerts.* | *Subject breakdown, target preset selector, and safe bunks.* |

| 3. Attendance Dispute Center | 4. Dynamic QR & GPS Scanner |
|:---:|:---:|
| ![Dispute Center](docs/screenshots/03_student_attendance_disputes.png) | ![QR Scanner](docs/screenshots/04_student_dynamic_qr_scanner.png) |
| *Two-way threaded dispute discussion with faculty.* | *Camera scanner with real-time GPS geofence radar.* |

| 5. Notification Center | 6. Hardware Device Binding |
|:---:|:---:|
| ![Notifications](docs/screenshots/05_student_notifications_center.png) | ![Device Profile](docs/screenshots/08_student_profile_device_binding.png) |
| *Filterable warning and administrative broadcast alerts.* | *Hardware-bound ECDSA P-256 registered key details.* |

---

## 18. Project Structure, Demo Accounts & License

### Directory Structure
```
college-attendance-system/
├── backend/                        # NestJS API, Prisma ORM, WebSocket gateway
│   ├── prisma/                     # Schema, migrations (0_init, phase23, phase7), seed
│   ├── scripts/                    # Automated integration & security test suites
│   └── src/                        # Modular architecture (auth, attendance, disputes, etc.)
├── web_dashboard/                  # React 18 / TypeScript / Vite faculty & admin portal
│   ├── src/pages/                  # Teacher console, disputes, classrooms, compliance
│   └── src/components/             # Real-time QR projection, UI modals, sidebar
├── student_mobile/                 # Flutter mobile application
│   ├── lib/screens/                # Home, QR scanner, disputes, timetable, profile
│   ├── lib/services/               # API client, GPS radar, hardware keystore crypto
│   └── test/                       # 30 unit & widget test specifications
├── docs/                           # Architecture, schema, security, and setup guides
│   └── screenshots/                # Real captured application screenshots
├── scripts/                        # Non-destructive Git checkpointing & backup scripts
├── docker-compose.yml              # Local containerized orchestration
└── README.md                       # Comprehensive system documentation
```

### Demo Accounts for Evaluation

All demo accounts are pre-seeded in the local database with consistent test identities:

| Role | Name | Email | Password |
|:---|:---|:---|:---|
| **Student** | Aarav Sharma | `aarav.sharma@college.edu` | `StudentSecure123!` |
| **Student** | Riya Patel | `riya.patel@college.edu` | `StudentSecure123!` |
| **Faculty** | Prof. Rahul Mehta | `prof.mehta@college.edu` | `TeacherSecure123!` |
| **Faculty** | Prof. Sneha Kulkarni | `prof.kulkarni@college.edu` | `TeacherSecure123!` |
| **Administrator** | College Administrator | `admin@college.edu` | `AdminSecure123!` |

### License Recommendation
This project is licensed under the **MIT License**. It is suitable for open-source portfolio inspection, educational evaluation, and enterprise adaptation.
