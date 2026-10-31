# Autonomous College Attendance Management System

A robust, enterprise-grade College Attendance Management System built with multi-layered verification: Dynamic QR Code with cryptographic signatures, GPS Geofencing (75m), Registered Hardware Keystore/Keychain device authentication, Server-Side Risk Scoring, and Random Teacher Verification.

## Architecture & Repositories
- **Backend (`/backend`)**: NestJS, TypeScript, PostgreSQL, Prisma ORM, Redis, Argon2id, JWT with refresh token rotation.
- **Web Dashboard (`/web_dashboard`)**: React, TypeScript, Tailwind CSS, Lucide Icons, WebSocket live updates.
- **Student Mobile App (`/student_mobile`)**: Flutter, Dart, Material 3, Android & iOS.
- **Snapshots & Recovery (`/snapshots`, `/scripts`)**: Automated Git-backed checkpointing, metadata logging, and rollback scripts.

## Quick Start

### 1. Prerequisites
- Node.js (>= 18.x) & npm
- Git
- PostgreSQL & Redis (or Docker)

### 2. Environment Configuration
Copy `.env.example` to `.env` and fill in necessary environment variables:
```bash
cp .env.example .env
```

### 3. Checkpoint & Rollback
- Create a checkpoint:
  ```powershell
  powershell -ExecutionPolicy Bypass -File scripts/checkpoint.ps1 -Description "Describe completed feature"
  ```
- Rollback to a previous checkpoint:
  ```powershell
  powershell -ExecutionPolicy Bypass -File scripts/rollback.ps1 -CheckpointId "checkpoint-001"
  ```

## Documentation
- [Architecture](docs/ARCHITECTURE.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [Security Model](docs/SECURITY.md)
- [Testing & QA](docs/TESTING.md)
- [Project State](PROJECT_STATE.md)
- [Agent Handoff Guide](AGENT_HANDOFF.md)
- [Resume Instructions](RESUME_PROJECT_PROMPT.md)
