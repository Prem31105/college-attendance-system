# Testing Strategy & Verification Plan

## 1. Test Levels
- **Unit Tests**:
  - Backend: Services, Cryptography (QR HMAC, Nonce, ECDSA challenge verification), Geofence calculations (Haversine formula), Risk Scoring Engine.
  - React Web: Authentication guards, QR canvas generation, Attendance table rendering, RBAC permission checks.
  - Flutter Mobile: QR parsing, Geofence radius math, Device key storage abstraction.
- **Integration Tests**:
  - REST API endpoint validation: Auth login, Token refresh rotation, Session creation, Dynamic QR generation, Attendance submission flow.
  - Concurrency test: 100 simultaneous submissions to ensure zero race conditions and strict uniqueness.
- **Security Tests**:
  - Expired QR rejection.
  - Tampered QR signature rejection.
  - Out-of-geofence GPS rejection.
  - Mock location flag rejection.
  - Unregistered device signature failure.
  - Duplicate submission rejection (HTTP 409 / Risk flag).
- **Snapshot & Rollback Recovery Tests**:
  - Verification of `checkpoint.ps1` and `rollback.ps1` functionality.

## 2. Test Execution Commands
- Backend: `npm test` inside `backend/`
- Web Dashboard: `npm test` inside `web_dashboard/`
- Checkpoint verification: `powershell -ExecutionPolicy Bypass -File scripts/checkpoint.ps1 -Description "Test"`
