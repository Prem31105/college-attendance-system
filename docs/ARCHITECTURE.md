# Architecture Specification: Autonomous College Attendance Management System

## 1. System Overview
The system provides a highly secure, automated college attendance management platform with multi-layered verification:
- **Student Mobile Application**: Flutter (Android/iOS) using Material 3, camera QR scanner, GPS location, Keystore/Keychain device-bound cryptographic keys, optional local biometrics.
- **Teacher & Admin Web Dashboard**: React + TypeScript + Tailwind CSS, WebSocket live updates, dynamic QR projection, RBAC administrative management.
- **Backend**: NestJS + TypeScript REST & WebSocket API, modular services, Argon2id, JWT with refresh token rotation, Prisma ORM.
- **Data & Cache**: PostgreSQL (relational normalized data, transactions, audit logs) + Redis (token expiry, nonce deduplication, rate limiting).
- **Snapshot & Rollback**: Comprehensive checkpoint scripts, Git commit tagging, and metadata persistence.

```
                    +-----------------------------+
                    |    React Web Dashboard      |
                    | (Teacher Live QR / Admin)   |
                    +--------------+--------------+
                                   | REST / WS
                                   v
+-----------------------+     +----+------------------------+
| Student Flutter App   |---->|     NestJS Backend API      |
| (QR Scan + GPS + Key) |     |  - Dynamic QR Signer        |
+-----------------------+     |  - GPS Geofence Engine      |
                              |  - Device Crypto Validator  |
                              |  - Multi-Layer Risk Engine  |
                              |  - Random Verifier          |
                              +----+--------------------+---+
                                   |                    |
                                   v                    v
                        +----------+---+     +----------+---+
                        |  PostgreSQL  |     | Redis Cache  |
                        | (Prisma ORM) |     | (Fast Nonce) |
                        +--------------+     +--------------+
```

## 2. Attendance Security Layers
1. **Dynamic QR Token Verification**:
   - Backend generates signed QR tokens refreshed every 15s (valid 30s).
   - Contains session ID, subject ID, issue timestamp, expiry, unique cryptographically secure nonce, HMAC-SHA256 signature.
   - Concurrently scannable by multiple students in the same class.
   - Nonce verified atomically against duplicate student attendance per session.
2. **GPS Geofencing**:
   - Geofence radius: default 75m around classroom coordinates.
   - Accuracy check: GPS accuracy <= 20m required.
   - Haversine distance calculated on the backend. Mock location flags evaluated.
3. **Registered Primary Device Verification**:
   - Student registers single primary device.
   - Asymmetric keypair (ECDSA P-256) generated in hardware Keystore/Keychain.
   - Backend issues device challenge; device signs challenge with private key; server verifies public key.
   - Strict device replacement request workflow with admin approval.
4. **Device Integrity**:
   - Play Integrity (Android) & App Attest (iOS) attestation validation with safe developer fallbacks.
5. **Local Biometric Authentication**:
   - Device OS biometrics (TouchID/FaceID/Fingerprint) authorize challenge signing locally without storing raw biometrics.
6. **Random Physical Verification**:
   - Teacher dashboard triggers random sampling of present students.
   - Real-time audit recording in session.
7. **Server-Side Multi-Factor Risk Engine**:
   - Risk evaluation outputs: `VERIFIED`, `PENDING`, `SUSPICIOUS`, `REJECTED`.
   - Clear audit trails with immutable reason codes.
