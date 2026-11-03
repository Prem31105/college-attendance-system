# Development Progress & Audit Log

This document records the chronological development milestones, features implemented, verification tests performed, and checkpoints created.

---

### Phase 0: Project Safety & Recovery Foundation (Completed & Verified)
- **Status**: Completed & Verified
- **Milestones**:
  - [x] Environment inspection: Windows, Git 2.52, Node v25.1.0, npm 11.6.2.
  - [x] Git repository initialization on `main` branch.
  - [x] Comprehensive `.gitignore` configuration protecting secrets, binaries, and build artifacts.
  - [x] Architecture, Database Schema, Security, and Testing documentation established.
  - [x] AI agent state and handoff documents (`PROJECT_STATE.md`, `AGENT_HANDOFF.md`, `RESUME_PROJECT_PROMPT.md`) created.
  - [x] One-command PowerShell and Bash checkpoint & rollback scripts authored (`checkpoint.ps1`, `rollback.ps1`, `checkpoint.sh`, `rollback.sh`).
  - [x] Recovery verification test executed and validated (test checkpoint-002 rolled back to checkpoint-001 safely).
  - [x] Baseline Checkpoints 001 and 002 recorded with metadata.

---

### Phase 1: Project Foundation (Completed & Verified)
- **Status**: Completed & Verified
- **Milestones**:
  - [x] Backend setup: NestJS 10, TypeScript, Prisma ORM 5.22.0.
  - [x] Database schema (`prisma/schema.prisma`) with all 25 models, entities, enums, unique constraints, and indexes.
  - [x] Seed data fixture (`prisma/seed.ts`) with admins, teachers, students, subjects, classrooms with geofences, and registered devices.
  - [x] Authentication system: Argon2id password hashing, JWT access & refresh token rotation, RBAC guards (`JwtAuthGuard`, `RolesGuard`).
  - [x] React Teacher/Admin web dashboard (Vite + Tailwind CSS + Lucide Icons).
  - [x] Flutter student mobile application architecture (Material 3).

---

### Phase 2: Core Attendance Engine & Database Integration (Completed & Verified)
- **Status**: Completed & Verified
- **Milestones**:
  - [x] Zero-admin portable PostgreSQL 16.6 installed and running locally on `localhost:5432`.
  - [x] Database `college_attendance` initialized, Prisma schema pushed (`prisma db push`), and seed fixtures executed (`prisma/seed.ts`).
  - [x] Dynamic QR code generation with HMAC-SHA256 signature and 15s refresh / 30s expiry.
  - [x] Strict GPS geofencing module: Haversine distance check strictly enforcing 75m classroom radius, <= 20m accuracy threshold, and mock location detection.
  - [x] Live Teacher attendance dashboard with real-time dynamic QR projection and attendance table.
  - [x] High-concurrency duplicate attendance protection (atomic uniqueness constraints and database transactions).
  - [x] Full End-to-End integration suite (`backend/scripts/verify-e2e-workflow.ts`) verifying 19 integration points against live PostgreSQL:
    1. PostgreSQL Database Connected Successfully
    2. Admin Account Verified & Authenticated
    3. Teacher Account Verified & Assigned
    4. Student Account Verified & Enrolled
    5. Classroom Geofence Anchor Configured (75m radius)
    6. Teacher Started Live Attendance Session
    7. Dynamic QR Token Generated with HMAC-SHA256 & 30s Expiry
    8. Dynamic QR Cryptographic Signature Verified on Server
    9. 60-second One-Time Device Challenge Issued
    10. Student 1 Attendance Verified & Persisted in PostgreSQL
    11. Concurrent Scan: Second Student Scanned Same QR Concurrently
    12. Duplicate Scan Prevention Enforced (Atomic Uniqueness)
    13. Challenge-Response Replay Attack Blocked
    14. Out-of-Geofence Attempt (400m > 75m) Rejected by Risk Engine
    15. Mock Location Spoofing Detected & Flagged Suspicious
    16. Teacher In-Session Random Physical Verification Challenge Triggered
    17. Manual Instructor Attendance Override with Mandatory Reason
    18. Immutable Audit Log Trail Recorded for Manual Override
    19. Teacher Successfully Closed Attendance Session

---

### Phase 2 Verification & Baseline Transition (Completed & Verified)
- **Status**: Completed & Verified
- **Milestones**:
  - [x] Git repository verified: Commit `962af09`, Tag `checkpoint-005`, branch `main`, 0 remotes, clean working tree.
  - [x] PostgreSQL database verified live on port 5432 with 25 tables and intact records.
  - [x] Verified full database backup generated via `scripts/db_backup.ps1` (`backups/verified_phase2_backup_20261031_212123.sql`, 54.9 KB).
  - [x] Validated backup integrity (full DDL, ENUM definitions, constraints, indexes, and COPY statements for data).
  - [x] Confirmed `tools/pgsql` binaries are in `.gitignore`.
  - [x] Established safe Prisma migration baseline `0_init`:
    - Generated baseline migration SQL via `prisma migrate diff --from-empty`
    - Marked `0_init` as applied via `prisma migrate resolve --applied 0_init` with 0 data loss
    - Confirmed `prisma migrate status` reports schema up-to-date
  - [x] Audited Flutter Windows environment: Windows 11 Home 64-bit, Git 2.52 present, Flutter SDK/JDK/Android SDK missing from PATH.
  - [x] Authored complete step-by-step setup guide: `docs/FLUTTER_SETUP_GUIDE.md`.
  - [x] Reran backend unit tests (8/8 passed) and E2E integration test suite (19/19 passed).
  - [x] Built React web dashboard with Vite (0 errors).
  - [x] Checkpoint-006 created.


---

### Phase 6: Student Mobile Native Verification & Live Camera Integration (Completed & Verified)
- **Status**: Completed & Verified
- **Milestones**:
  - [x] Host environment audit: Flutter 3.29.2 (`D:\src\flutter`), Android SDK 34 (`D:\src\AndroidSdk`), OpenJDK 17 (`D:\src\jdk-17`), Android Studio (`D:\src\AndroidStudio`).
  - [x] Android emulator Pixel_6 configured with persistent `hw.camera.back=webcam0` in `D:\AndroidAVD\Pixel_6.avd\config.ini`.
  - [x] Host webcam (`USB2.0 HD UVC WebCam` as `webcam0`) bound to emulator rear camera HAL (1280x960 NV12).
  - [x] Root Cause Diagnosed: Previous `attendance_scanner_screen.dart` was a placeholder stub rendering a static black `Container` with an icon; no camera widget or controller was initialized.
  - [x] Implemented real-time camera viewfinder in `attendance_scanner_screen.dart` using `QRView` (`qr_code_scanner_plus`), including live barcode stream parsing, JSON payload decoding (`sid`, `sub`), cryptographic Keystore signing, overlay framing, camera flip action, and clean controller disposal.
  - [x] Verified static analysis: `flutter analyze` completed with 0 errors / 0 warnings.
  - [x] Verified unit & widget tests: `flutter test` passed 3/3 tests cleanly.
  - [x] Built fresh debug APK via Gradle `assembleDebug` in 88.0s (`build/app/outputs/flutter-apk/app-debug.apk`).
  - [x] Streamed APK install to `Pixel_6` emulator via ADB (Success).
  - [x] Live runtime verification: Login -> Student Dashboard -> Dynamic QR Scanner.
  - [x] Live webcam video stream verified actively rendering user's physical camera feed in viewfinder.
  - [x] Live QR detection, simulation, keystore challenge-signing, and transition to "Attendance VERIFIED" confirmation screen verified.
  - [x] Camera lifecycle verified: camera stream cleanly closed on exit and re-initialized on reentry with 0 errors in Android logcat.


---

### Phase 2: Product Features Implementation — Milestones 2.1 & 2.2 (Completed & Verified)
- **Status**: Completed & Verified
- **Milestones**:
  - [x] Master Feature Implementation Plan authored in `docs/FEATURE_IMPLEMENTATION_PLAN.md` covering all 9 required capabilities.
  - [x] Security Utilities & Validators (`student_mobile/lib/core/security/security_utils.dart`):
    - Institutional email validation strictly enforcing `@college.edu` domain.
    - Roll number format validation (`^[A-Z]{2,4}[0-9]{4}-[0-9]{3,4}$`, e.g. `CS2026-001`).
    - Registration number numeric length validation.
    - Cryptographic strong password generator (`PasswordGenerator.generateStrongPassword(length: 16)`).
    - Real-time password strength evaluator (`Weak`, `Fair`, `Good`, `Strong`).
    - Encrypted token and session storage abstraction (`TokenManager` using `FlutterSecureStorage`).
  - [x] 3-Slide Onboarding Carousel (`student_mobile/lib/screens/onboarding_screen.dart`):
    - Slide 1: Dynamic Anti-Proxy QR Codes (15s HMAC-SHA256 tokens).
    - Slide 2: 75m Classroom Geofence & Sub-20m accuracy check.
    - Slide 3: Hardware-Bound Keystore Key (ECDSA P-256).
    - Animated dot indicators, skip navigation, and "Get Started" persistence.
  - [x] Multi-Role Campus Portal Sign-In (`student_mobile/lib/screens/login_screen.dart`):
    - Role selector tabs for Student, Teacher, and Admin roles.
    - Institutional email formatting validation.
    - Password visibility toggle.
    - Secure JWT token generation and storage via `TokenManager`.
  - [x] Account & Device Activation (`student_mobile/lib/screens/registration_screen.dart`):
    - One-click "Generate Strong Password & Copy" button with clipboard integration.
    - Live visual password strength progress bar and character counter.
    - Device hardware key binding via `CryptoKeystore.getOrCreatePublicKeyPem()`.
    - Confirmation alert dialog and return-to-login workflow.
  - [x] Unit & Widget Test Suite Expansion:
    - 4 new test suites added in `attendance_test.dart` and `widget_test.dart`.
    - 7/7 tests passing (`flutter test` 100% green).
  - [x] Static Analysis: `flutter analyze` 0 warnings, 0 errors.
  - [x] Fresh APK build (`assembleDebug`) in 30.7s and streamed installation to running `Pixel_6` emulator.
  - [x] Live UI verification on emulator: Role switching, password generation, clipboard copy, device binding dialog, and dashboard authentication verified with zero runtime exceptions.

---

### Phase 2.2 Verification & Gap Analysis Audit (Completed & Verified)
- **Status**: Completed & Verified
- **8-Dimension Verification & Gap Analysis**:
  1. *Session timeout, auto-logout, access-token expiry & refresh-token rotation*:
     - Backend: 15m access token expiry, unique `jti` cryptographic nonce per token generation avoiding tokenHash collisions, atomic refresh rotation, token reuse detection with immediate revocation of compromised user sessions.
     - Frontend: `SessionInactivityWatcher` auto-logout timer, `ApiService` automatic 401 interception with transparent refresh token rotation and retry.
     - Classification: **Implemented and tested**.
  2. *Backend-enforced Student, Teacher, and Admin role-based authentication*:
     - Backend: `@Roles` decorator with `RolesGuard` and `JwtAuthGuard` enforcing role claims from JWT payload. Verified in integration tests.
     - Frontend: Role selector tabs for Student, Teacher, Admin in `LoginScreen`.
     - Classification: **Implemented and tested**.
  3. *Registration and account activation through backend API*:
     - Backend: `POST /auth/register` endpoint with `RegisterStudentDto` creating User, Student, and primary `RegisteredDevice` in a single ACID transaction.
     - Frontend: `RegistrationScreen` wired directly to `ApiService.registerStudent()`.
     - Classification: **Implemented and tested**.
  4. *Institutional email, roll number, and registration number validation on frontend & backend*:
     - Frontend: `CredentialValidator` enforcing `@college.edu`, roll number regex `^[A-Z]{2,4}[0-9]{4}-[0-9]{3,4}$`, and registration number format.
     - Backend: `RegisterStudentDto` with class-validator `@Matches` decorators enforcing identical institutional rules.
     - Classification: **Implemented and tested**.
  5. *Strong password generation, secure storage, and Android password autofill*:
     - Frontend: `PasswordGenerator.generateStrongPassword(16)` with entropy analysis, live strength indicator, and clipboard copy; wrapped forms in `AutofillGroup` with `AutofillHints.email`, `AutofillHints.password`, `AutofillHints.newPassword`, `AutofillHints.username`.
     - Classification: **Implemented and tested**.
  6. *Onboarding completion persistence across app restarts*:
     - Frontend: 3-slide interactive carousel; completion flag persisted to `FlutterSecureStorage` via `TokenManager.setOnboardingCompleted()`; `SplashScreen` dynamically routes to `OnboardingScreen` on fresh launch, or directly to `LoginScreen` / `DashboardScreen` on restarts.
     - Classification: **Implemented and tested**.
  7. *JWT and refresh token encrypted storage, logout cleanup, and session restoration*:
     - Frontend: `TokenManager` backed by `FlutterSecureStorage`; `SettingsScreen` user session card and confirmed "Log Out" action invoking `ApiService.logout()`, revoking server-side refresh tokens, clearing local keystore session, and navigating back to `LoginScreen`.
     - Classification: **Implemented and tested**.
  8. *Device public-key enrollment and backend verification*:
     - Frontend: Hardware-backed ECDSA P-256 keypair generated via `CryptoKeystore.getOrCreatePublicKeyPem()`; public key PEM sent during registration.
     - Backend: Public key stored in `RegisteredDevice` table in PostgreSQL; verified on dynamic QR attendance challenge signing.
     - Classification: **Implemented and tested**.
- **Automated Verification Suites**:
  - `flutter analyze`: 0 errors, 0 warnings.
  - `flutter test`: 7/7 unit & widget tests passed.
  - Backend unit tests (`jest`): 8/8 passed (`gps.service.spec.ts`, `risk.service.spec.ts`).
  - Backend Auth Flow suite (`scripts/verify-auth-flow.ts`): 9/9 passed on live PostgreSQL.
  - Backend E2E suite (`scripts/verify-e2e-workflow.ts`): 19/19 passed on live PostgreSQL.
  - Android debug APK built via Gradle in 57.2s, installed on Pixel_6 emulator.
  - Live emulator interaction verified: Onboarding carousel, Registration with strong password autofill, Login, Student Dashboard, Settings with User Session details, and confirmed Logout returning to Login screen.

---

### Phase 2.3: Role-Based Notifications & Announcements System (Completed & Verified)
- **Status**: Completed & Verified
- **Milestones**:
  - [x] Backend Schema & Migration:
    - Added `NotificationPriority` enum (`URGENT`, `NORMAL`, `INFORMATIONAL`).
    - Added `readAt`, `senderId`, `data` columns to `Notification` table with indexes on `(userId, isRead)`, `(userId, createdAt)`, and `(priority)`.
    - Synced PostgreSQL schema via Prisma.
  - [x] Backend REST API & Authorization:
    - `GET /notifications`: Paginated notification history with unread count and priority/category filtering.
    - `GET /notifications/unread-count`: Fast unread count for badge rendering.
    - `GET /notifications/:id`: Notification detail retrieval and automatic read status transition.
    - `PATCH /notifications/:id/read`: Individual mark-as-read with timestamp.
    - `POST /notifications/mark-all-read`: Bulk mark-all-as-read.
    - `POST /notifications/announce`: Strict role-based announcement creation.
      - Students strictly blocked from creating announcements (HTTP 403 Forbidden).
      - Teachers permitted to target class sections or `STUDENT` roles with `NORMAL`, `INFORMATIONAL`, or `URGENT` priority; blocked from broadcasting to `ALL`.
      - Admins permitted to broadcast globally to `ALL` with any priority.
      - Administrative and urgent broadcasts recorded in `AttendanceAuditLog`.
      - Deduplication prevention: Idempotent double-submit protection within 30-second window.
  - [x] Real-Time WebSockets (`EventsGateway`):
    - Added `broadcastNotificationToUser`, `broadcastNotificationToRole`, and `broadcastGlobalAnnouncement` handlers with Socket.IO rooms (`user_${id}`, `role_${role}`).
  - [x] Flutter Client Implementation (`student_mobile`):
    - `NotificationService`: Singleton managing `unreadCountNotifier`, `notificationsNotifier`, and 15s sync timer.
    - `DashboardScreen`: Live unread notification badge counter on AppBar bell icon, plus high-contrast Urgent Alert Banner at top of dashboard when unread urgent alerts exist.
    - `NotificationsScreen`: Filter chips (`All`, `Urgent Only`, `Attendance Alerts`, `Announcements`), "Mark all read" top button, read/unread visual styling, priority color pills, and relative timestamps.
    - `NotificationDetailScreen`: Full view with urgent warning alert, priority and category pills, timestamp, read indicator, and message body.
  - [x] Automated Test Verification:
    - Backend Notification Suite (`verify-notifications-flow.ts`): 12/12 tests passed against live PostgreSQL.
    - Backend Unit Tests (`jest`): 8/8 passed.
    - Backend E2E Suite (`verify-e2e-workflow.ts`): 19/19 passed.
    - Flutter static analysis: `flutter analyze` clean (0 errors, 0 warnings).
    - Flutter unit & widget tests: 11/11 passed (`attendance_test.dart`, `notification_test.dart`, `widget_test.dart`).
  - [x] Emulator Native Verification on Pixel_6:
    - Fresh debug APK built in 53.6s and installed via ADB.
    - Verified live unread badge `3` on Dashboard bell icon.
    - Verified Urgent Notification Banner rendered on Dashboard.
    - Verified NotificationsScreen filter chips, list items, priority badges.
    - Verified opening NotificationDetailScreen automatically marks notification as read.
    - Verified "Mark all read" button updates all items to read state and clears unread dots.
    - Verified returning to Dashboard clears the Urgent Banner and resets badge count.
  - [x] Phase 2.3 Independent Audit & Verified Defect Remediation:
    - Independent Audit Suite (`backend/scripts/audit-phase23.ts`): 28/28 checks passed against live backend, PostgreSQL, and Socket.IO WebSocket gateway.
    - Verified Defect 1 Fixed: Created migration file `20261102_phase23_notification_priority/migration.sql` with Phase 2.3 schema DDL and resolved via `prisma migrate resolve --applied`. Database and Prisma migration history fully synchronized (`prisma migrate status` clean).
    - Verified Defect 2 Fixed: Implemented JWT connection authentication and room-level authorization in `EventsGateway`. Unauthenticated connections rejected with `auth_error`; students strictly prohibited from subscribing to `role_ADMIN` or arbitrary user rooms.
    - Full regression test run: Backend Jest (8/8), Notifications Flow (12/12), Auth Flow (9/9), E2E Integration (19/19), Flutter Tests (11/11), Flutter Analyze (0 issues).
    - Recovery checkpoint created prior to fixes: checkpoint-010. Final Phase 2.3 verified checkpoint created: checkpoint-011.


---

### Phase 2.4: Location Permissions & Configurable Geofencing Radar (Completed & Verified)
- **Status**: Completed & Verified
- **Milestones**:
  - [x] Backend Configurable Geofence Anchor Retrieval:
    - Added `getAllClassrooms()` to `attendance-sessions.service.ts` querying all active classrooms and geofence anchors.
    - Added `@Get('classrooms/all')` route in `attendance-sessions.controller.ts` secured with `@Roles(Role.TEACHER, Role.ADMIN, Role.STUDENT)`.
    - Placed before dynamic `:sessionId` route to eliminate routing collisions.
    - Verified live HTTP 200 response with authenticated student JWT returning Room 401 anchor (`12.9715987, 77.5945627, 75m`).
  - [x] Flutter Client Location Service (`student_mobile/lib/core/services/location_service.dart`):
    - `ClassroomGeofence` data model with parsing from JSON and fallback to Room 401 defaults.
    - `GeofenceEvaluation` data class with distance, accuracy, boundary status, spoofing flags, and risk penalty.
    - Pure Haversine distance calculator matching backend formula.
    - Geolocator permission handling: `checkPermission()`, `requestPermission()`, `isLocationServiceEnabled()`, `openAppSettings()`, `openLocationSettings()`.
    - Real-time position evaluation enforcing:
      - Strict 75m radius boundary (`OUT_OF_GEOFENCE_RADIUS`).
      - Accuracy threshold <= 20m (`INSUFFICIENT_ACCURACY`).
      - Mock location spoofing detection via `position.isMocked` (`MOCK_LOCATION_DETECTED`).
    - Classroom list fetching via `ApiService.getClassrooms()`.
  - [x] Interactive Radar Geofence Visualizer (`student_mobile/lib/screens/gps_status_screen.dart`):
    - Custom animated concentric radar painter (`_RadarPainter`) with animated sweep line, 25m/50m inner range rings, and bold 75m boundary fence.
    - Classroom anchor pin at radar center with campus building/room label.
    - Live student device blip positioned dynamically based on relative distance and bearing.
    - Color-coded visual health (Emerald green inside/accurate, Amber warning for accuracy >20m, Rose red for out-of-boundary or mock spoofing).
    - Configurable classroom dropdown selector allowing students to inspect geofences across all classrooms.
    - Real-time metrics grid (Distance, Accuracy, Spoofing status, Latitude/Longitude coordinates).
    - Permission request banners and app settings deep-linking when location services or permissions are disabled.
  - [x] Attendance Scanner Integration (`student_mobile/lib/screens/attendance_scanner_screen.dart`):
    - Top radar chip/badge linking directly to `GpsStatusScreen`.
    - Real GPS coordinate acquisition and geofence evaluation prior to attendance verification.
  - [x] Automated Test Verification:
    - Flutter static analysis: `flutter analyze` completed with 0 errors / 0 warnings.
    - Flutter unit & widget tests: 21/21 passed (`attendance_test.dart`, `location_service_test.dart`, `notification_test.dart`, `widget_test.dart`).
    - Backend Unit Tests (`jest`): 8/8 passed (`gps.service.spec.ts`, `risk.service.spec.ts`).
    - Backend Notification Suite (`verify-notifications-flow.ts`): 12/12 passed against live PostgreSQL.
    - Backend Auth Flow Suite (`verify-auth-flow.ts`): 9/9 passed.
    - Backend E2E Suite (`verify-e2e-workflow.ts`): 19/19 passed.
    - Phase 2.3 Independent Audit Suite (`audit-phase23.ts`): 28/28 passed.
    - Live REST API verification: Authenticated `GET /sessions/classrooms/all` returned HTTP 200 with classroom fixture.
  - [x] Checkpoint Created:
    - Pre-implementation recovery checkpoint: checkpoint-012 (`83c6447`).
    - Phase 2.4 completion checkpoint: checkpoint-013.


---

### Phase 2.5: Smart Attendance Guider & Predictive Semester Target Calculator (Completed & Verified)
- **Status**: Completed & Verified
- **Milestones**:
  - [x] Backend Predictive Analytics Engine (`backend/src/reports/reports.service.ts`):
    - Implemented `calculatePredictiveMetrics(attended, total, targetPercentage)`:
      - Clamps target threshold between 50% and 95%.
      - Exact Safe Bunks mathematical calculation: $\lfloor (\text{Attended} - (\text{Target} \times \text{Total})) / \text{Target} \rfloor$
      - Exact Required Consecutive Lectures recovery calculation: $\lceil ((\text{Target} \times \text{Total}) - \text{Attended}) / (1 - \text{Target}) \rceil$
      - Next Class Impact simulator: Calculates projected attendance and delta percentage if next lecture is attended vs missed.
      - Status classification: `HEALTHY` ($\ge \text{Target} + 5\%$), `BORDERLINE` ($\ge \text{Target}$ and $< \text{Target} + 5\%$), `CRITICAL` ($< 75\%$).
    - Implemented `getStudentAttendanceGuider(studentId, targetPercentage)`:
      - Computes subject-by-subject predictive metrics across all enrolled subjects.
      - Computes aggregate semester metrics and critical shortage counts.
      - Generates prioritized, actionable semester recommendations.
    - Added `@Get('guider')` route in `reports.controller.ts` for authenticated students with `@Query('target')`.
    - Added `@Get('student/:studentId/guider')` for teachers and admins.
  - [x] Backend Unit Test Suite (`backend/src/reports/reports.service.spec.ts`):
    - 8 comprehensive unit tests covering safe bunks, recovery lectures, borderline status, next class impact, zero sessions, and student not found handling.
    - All 16 backend unit tests passing (`gps.service.spec.ts`, `risk.service.spec.ts`, `reports.service.spec.ts`).
  - [x] Live Backend REST API Verification:
    - Authenticated `GET /api/v1/reports/guider?target=80`: HTTP 200 OK with full predictive payload.
    - Unauthenticated `GET /api/v1/reports/guider`: HTTP 401 Unauthorized (guarded).
  - [x] Flutter Client Implementation (`student_mobile`):
    - Created `AttendanceGuiderService` (`student_mobile/lib/core/services/attendance_guider_service.dart`):
      - Models: `NextClassImpact`, `SubjectGuiderStat`, `GuiderOverallSummary`, `AttendanceGuiderReport`.
      - Pure client-side recalculation matching backend algorithm for instantaneous UI reactivity when toggling targets.
      - Offline/network-resilient fallback with semester subject fixtures.
    - Updated `ApiService` (`student_mobile/lib/core/services/api_service.dart`) with `getAttendanceGuider()`.
    - Redesigned `SubjectStatisticsScreen` (`student_mobile/lib/screens/subject_statistics_screen.dart`):
      - Configurable target preset selector (`70%`, `75%`, `80%`, `85%`, `90%`).
      - Semester overall summary card with animated circular indicator, safe bunks, and status badge.
      - Critical shortage alert banner with exam detention warning for subjects $< 75\%$.
      - Subject filter chips (`All`, `Critical (<75%)`, `Borderline`, `Safe`).
      - Detailed subject cards with progress bar, conducted/attended/missed stats, predictive safe bunks / recovery action pills, and next class impact metrics.
      - Smart semester recommendations section.
    - Updated `DashboardScreen` (`student_mobile/lib/screens/dashboard_screen.dart`):
      - Overall attendance card is interactive and links directly to the Smart Attendance Guider.
  - [x] Web Dashboard Implementation (`web_dashboard`):
    - Added Predictive Student Quota & Shortage Guider card to `TeacherDashboard.tsx` displaying student distribution across Safe Zone ($\ge 80\%$), Borderline Zone (75%-79%), and Critical Shortage Zone ($< 75\%$).
    - Production Vite bundle built cleanly in 5.70s with zero errors.
  - [x] Automated Test Verification:
    - Flutter static analysis: `flutter analyze` completed with 0 errors / 0 warnings (ran in 2.0s).
    - Flutter unit & widget tests: 30/30 passed (`attendance_guider_test.dart`, `location_service_test.dart`, `attendance_test.dart`, `notification_test.dart`, `widget_test.dart`).
    - Backend Unit Tests (`jest`): 16/16 passed.
    - Backend E2E Suite (`verify-e2e-workflow.ts`): 19/19 passed.
  - [x] Checkpoints Created:
    - Pre-Phase 2.5 recovery checkpoint: checkpoint-015 (`1ae3709`).
    - Phase 2.5 completion checkpoint: checkpoint-016.

---

### Phase 2.6: Final Integration Testing, Pixel_6 Emulator Verification & Phase 2 Closure (Completed & Verified)
- **Status**: Completed & Verified
- **Milestones**:
  - [x] Pre-Implementation Recovery Checkpoint:
    - Allocated `checkpoint-017` prior to modifying any code or configurations.
  - [x] Subject Fixture Data Investigation & PostgreSQL Multi-Subject Seeding (Instruction 7 Remediation):
    - Investigated Phase 2.5 client fixtures; identified that client-side `_getAugmentedSubjects` previously appended simulated demo subjects (`CS602`, `CS603`, `CS604`) to the backend response.
    - **Completely removed `_getAugmentedSubjects`**: The client now maps ONLY actual PostgreSQL records returned by the backend.
    - Created seeder `backend/scripts/seed-multi-subject-attendance.ts`:
      - Enrolled student `CS2026-001` (John Doe) in second subject `CS602` (Cryptography & Network Security).
      - Created 10 closed attendance sessions for `CS602` with teacher `prof.smith@college.edu` in `Room 401`.
      - Created 7 verified attendance records for John Doe (sessions 0-6 attended, sessions 7-9 missed).
    - Verified live endpoint `GET /api/v1/reports/guider?target=75` returns 100% legitimate PostgreSQL records:
      - `CS601`: 11 sessions, 11 attended (100.0%, HEALTHY, 3 safe bunks)
      - `CS602`: 10 sessions, 7 attended, 3 missed (70.0%, CRITICAL SHORTAGE, 2 required consecutive lectures to recover)
      - Aggregate: 21 held, 18 attended (85.7%, HEALTHY, 1 critical subject)
    - Strictly isolated client offline fallback mode:
      - Added `isDemoMode: bool` property to `AttendanceGuiderReport`.
      - Renders prominent amber warning banner `"⚠️ OFFLINE DEMONSTRATION MODE: Showing isolated simulated records. Connect to live backend and pull to refresh for PostgreSQL verified records."` whenever fallback data is in use.
      - Subject cards show a distinct `DEMO` badge only for simulated fixtures.
    - Updated `SubjectListScreen` to dynamically load real enrolled subjects and attendance percentages from `AttendanceGuiderService().fetchReport()`.
  - [x] Windows Build & Memory Optimization:
    - Adjusted `student_mobile/android/gradle.properties`: Reduced memory allocation from `-Xmx8G -XX:MaxMetaspaceSize=4G` to `-Xmx2048m -XX:MaxMetaspaceSize=512m -XX:ReservedCodeCacheSize=256m`, resolving Dart frontend compiler out-of-memory crashes on Windows.
    - Added global error handler in `student_mobile/lib/main.dart` (`PlatformDispatcher.instance.onError`) gracefully catching unhandled socket closing events.
  - [x] Pixel_6 Emulator Runtime Verification:
    - Compiled fresh debug APK via `flutter build apk --debug` (`build/app/outputs/flutter-apk/app-debug.apk`, 215 MB).
    - Installed APK onto `Pixel_6` emulator (`emulator-5554`) via `adb install -r` (Performing Streamed Install -> Success).
    - Launched application via `adb shell am start -n com.college.attendance.student_mobile/.MainActivity`.
    - Captured and validated UI screenshots (archived in `docs/evidence/phase2_verification/`):
      - `pixel6_home_dashboard.png`: SmartCampus home screen with urgent notification alert, 88.4% overall attendance card, active CS601 session card with 75m geofence, and quick access navigation grid.
      - `pixel6_guider_85pct.png`: Smart Target Guider displaying the prominent `OFFLINE DEMONSTRATION MODE` banner, interactive target quota toggle (`85% Quota`), dynamic recalculation to `BORDERLINE` status, amber gauge, and updated safe bunks (recalculated from 3 to 1).
      - `pixel6_gps_radar.png`: GPS Geofence Radar screen rendering animated radar circles, 75m boundary ring, green "IN RANGE" status, and "GPS Signal Ready for Attendance: Within Room 401 boundary (22.4m <= 75m, ±8.5m)".
  - [x] Full Automated Verification Suite:
    - Flutter Static Analysis: `flutter analyze` passed with 0 issues in 13.5s.
    - Flutter Tests: 30 / 30 passed (`attendance_guider_test.dart`, `location_service_test.dart`, `attendance_test.dart`, `notification_test.dart`, `widget_test.dart`).
    - Backend Unit Tests: 16 / 16 passed (`gps.service.spec.ts`, `risk.service.spec.ts`, `reports.service.spec.ts` executed in-band).
    - Backend E2E Suite: 19 / 19 passed (`verify-e2e-workflow.ts`).
    - Backend Notification Suite: 12 / 12 passed (`verify-notifications-flow.ts`).
    - Web Dashboard Build: Vite production bundle built in 25.64s with 0 errors (`dist/index.html`, `dist/assets/`).
  - [x] Phase 2 Official Completion:
    - All Phase 2 feature milestones (2.1 through 2.6) verified and complete.
    - Completion checkpoint: `checkpoint-018`.

---

### Phase 3: Hardware Security, Cryptographic Binding & Dynamic QR Attendance Workflow (Completed & Verified)
- **Status**: Completed & Verified
- **Milestones**:
  - [x] Pre-Implementation Recovery Checkpoint:
    - Checkpoint-019 created and tagged prior to initiating Phase 3 modifications.
  - [x] Backend Endpoints & Service Enhancements (`backend`):
    - Added `refreshDynamicQr(sessionId, teacherId)` in `AttendanceSessionsService` generating HMAC-SHA256 tokens and broadcasting via WebSocket `eventsGateway.broadcastQrRefresh`.
    - Added `@Post(':sessionId/qr/refresh')` and `@Get(':sessionId/qr')` endpoints in `AttendanceSessionsController` for live QR streaming.
    - Updated `DevicesService.generateChallenge(studentId, deviceId?)`: Allows requesting one-time 60s challenges without manual deviceId query if the student has an active registered device.
    - Atomic replay and duplicate protection: `deviceChallenge.isUsed` marked atomically upon signature verification; duplicate student scans in the same session rejected with HTTP 409 `ConflictException`.
    - Concurrent student redemption: Multiple eligible students can scan and redeem the exact same valid dynamic QR simultaneously without globally invalidating it for others.
    - Non-blocking risk evaluation: Suspicious attempts (e.g. mock location) flagged as `SUSPICIOUS` for teacher physical verification without rejecting or blocking low-risk students.
  - [x] Teacher Web Dashboard Live Dynamic QR & Override Polish (`web_dashboard`):
    - Updated `LiveSessionPage.tsx` to fetch real HMAC-SHA256 dynamic QR tokens from backend endpoint every 15s.
    - Added live attendance table action: Suspicious student attempts display a one-click "Verify" button pre-populating roll number and opening manual override modal.
    - Submits manual overrides to `POST /api/v1/attendance/manual-mark` with mandatory instructor reason and writes immutable audit log trail.
    - Production Vite bundle built in 4.36s with 0 errors.
  - [x] Student Mobile Dynamic Scanner Integration (`student_mobile`):
    - Added `ApiService.getDeviceChallenge()` requesting 60s challenge tokens from `/devices/challenge`.
    - Updated `AttendanceScannerScreen`: Parses JSON QR tokens (`sid`, `sub`, `iat`, `exp`, `non`, `sig`), acquires real GPS coordinates via `LocationService`, fetches device challenge, signs with hardware Keystore ECDSA private key, and submits evidence to `/attendance/submit`.
    - Fixed static analysis getters (`eval.latitude`, `eval.longitude`, `eval.accuracyMeters`).
    - `flutter analyze --no-pub`: 0 issues found in 2.2s.
    - `flutter test`: 30 / 30 passed.
  - [x] Comprehensive Automated Unit Testing Suite (`backend/src/attendance/attendance.service.spec.ts`):
    - 12 comprehensive unit tests covering:
      1. Valid attendance submission (low-risk -> `VERIFIED`)
      2. Expired QR token rejection (`QR_TOKEN_EXPIRED` -> `REJECTED`)
      3. Tampered / invalid QR HMAC signature rejection (`INVALID_QR_SIGNATURE` -> `REJECTED`)
      4. GPS outside geofence boundary (> 75m -> `REJECTED`)
      5. Poor GPS accuracy (> 20m -> `REJECTED`)
      6. Device signature verification failure (`CRYPTOGRAPHIC_SIGNATURE_INVALID` -> `REJECTED`)
      7. Challenge replay attack rejection (`CHALLENGE_ALREADY_USED_REPLAY_ATTEMPT` -> `REJECTED`)
      8. Duplicate attendance submission rejection (`ConflictException` HTTP 409)
      9. Concurrent student scans of same valid dynamic QR (both succeed)
      10. Mock location spoofing detection (`SUSPICIOUS` status flagged, low-risk students unblocked)
      11. Mandatory reason validation for teacher manual overrides (min 5 chars)
      12. Immutable audit log persistence for teacher manual overrides
    - All 28 backend unit tests passing in-band (`jest --runInBand`).
  - [x] Integration & Regression Suite:
    - Backend E2E workflow: 19 / 19 passed (`verify-e2e-workflow.ts`).
    - Backend Notification flow: 12 / 12 passed (`verify-notifications-flow.ts`).
  - [x] Checkpoints Created:
    - Pre-implementation recovery checkpoint: `checkpoint-019`.
    - Phase 3 completion checkpoint: `checkpoint-020`.

---

### Phase 4: Administration, Real-Time Monitoring & Physical Verification (Completed & Verified)
- **Status**: Completed & Verified
- **Milestones**:
  - [x] Pre-Implementation Recovery Checkpoint:
    - Allocated `checkpoint-021` before Phase 4 code modifications.
  - [x] Risk-Based Random Physical Verification:
    - Created dedicated `RandomVerificationController` (`backend/src/random-verification/random-verification.controller.ts`) with endpoints:
      - `POST /sessions/:sessionId/random-verification/trigger`: Performs Fisher-Yates sampling of present students, creates challenge tokens with status `PENDING`, and dispatches in-app `VERIFICATION_ALERT` notifications.
      - `POST /random-verification/:challengeId/outcome`: Instructor records outcome (`VERIFIED` or `ABSENT`).
      - Absence penalty enforcement: If marked `ABSENT`, attendance record is automatically flagged as `SUSPICIOUS` with `reasonCode: FAILED_RANDOM_PHYSICAL_VERIFICATION` and risk penalty applied.
      - `GET /sessions/:sessionId/random-verification`: Queries active physical challenges for a session.
    - Updated `AppModule` to register `RandomVerificationController`.
    - Integrated with teacher dashboard (`web_dashboard/src/pages/teacher/LiveSessionPage.tsx`):
      - Top "Random Physical Check" button triggers real sampling API.
      - Dynamic modal lists sampled students with roll numbers and seats.
      - Provides "Present" and "Absent" action buttons calling outcome endpoints.
  - [x] Multi-Classroom Geofence Management:
    - Added `updateClassroom` and `deleteClassroom` methods to `AdminService`.
    - Added `PATCH /admin/classrooms/:id` and `DELETE /admin/classrooms/:id` to `AdminController`.
    - Integrated with `ClassroomsPage.tsx`:
      - Fetches active classrooms from `GET /admin/classrooms`.
      - Supports creating new geofence zones via `POST /admin/classrooms` with custom radius (25m - 150m) and coordinates.
      - Supports deleting classroom geofence zones with live UI removal.
  - [x] Department-Wide Attendance Auditing:
    - Implemented `getDepartmentComplianceReport(departmentId?)` in `ReportsService`. Aggregates all closed sessions, calculates percentage, identifies critical shortage students (<75%), safe bunks, and required recovery lectures.
    - Implemented immutable audit trail in `AdminService.resolveSuspiciousRecord`: Logs `AttendanceAuditLog` entries with admin actor ID, old status, and new resolution (`VERIFIED` or `REJECTED`).
    - Integrated with `AdminDashboard.tsx`:
      - Live analytics metrics cards (`totalStudents`, `totalTeachers`, `activeSessions`, `attendanceRate`).
      - Live immutable Audit Log stream table with actor, action, target entity, and timestamps.
      - Suspicious Incidents queue with one-click "Verify" and "Reject" adjudication actions.
  - [x] Exportable Compliance Reports:
    - Implemented RFC 4180 compliant CSV export in `ReportsService.exportComplianceCsv`:
      - Headers: `Roll Number,Student Name,Email,Department,Classes Held,Classes Attended,Classes Missed,Percentage (%),Compliance Status,Safe Bunks (at 75%),Required Recovery Lectures`.
    - Implemented Critical Shortage CSV export in `ReportsService.exportShortageCsv`:
      - Filters students with $<75\%$ attendance and calculates exact required consecutive recovery lectures.
    - Added `@Get('export/csv')` and `@Get('export/shortage/csv')` with `text/csv` Content-Type and attachment Content-Disposition headers.
    - Added direct browser CSV download buttons in `AdminDashboard.tsx`.
  - [x] Automated Test Verification:
    - Phase 4 Admin Verification Suite (`backend/scripts/verify-phase4-admin.ts`): 20 / 20 tests passed covering all 4 sections against PostgreSQL.
    - Backend Unit Tests: 28 / 28 passed (`jest --runInBand`).
    - Flutter Static Analysis: `flutter analyze --no-pub` clean (0 errors, 0 warnings in 2.6s).
    - Flutter Tests: 30 / 30 passed (`flutter test`).
    - Web Dashboard Build: Vite production bundle built cleanly in 5.12s with zero errors.
  - [x] Checkpoints Created:
    - Pre-implementation recovery checkpoint: `checkpoint-021`.
    - Phase 4 completion checkpoint: `checkpoint-022`.

---

### Phase 5: Production Readiness, Security Hardening & Complete System Verification (Completed & Verified)
- **Status**: Completed & Verified
- **Milestones**:
  - [x] Pre-Implementation Recovery Checkpoint:
    - Allocated `checkpoint-023` before Phase 5 modifications.
  - [x] API Rate Limiting & Abuse Protection:
    - Configured `@nestjs/throttler` (v6.4.0) in `backend/src/app.module.ts`:
      - Tiered rate limits: Short (20 req / 1s), Medium (100 req / 10s), Long (300 req / 60s).
      - Applied globally via `APP_GUARD` (`ThrottlerGuard`) to protect against automated scraping, brute force, and DoS attacks.
  - [x] Helmet Security Headers & Production CORS Configuration:
    - Installed `helmet` security package in `backend`.
    - Integrated in `backend/src/main.ts`: sets `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Strict-Transport-Security`, `X-Download-Options`, `Referrer-Policy`.
    - Configured production CORS with origin filtering from `process.env.CORS_ORIGINS`.
  - [x] CSRF Mitigation Architecture:
    - Documented architectural immunity: API relies strictly on custom `Authorization: Bearer <token>` HTTP headers.
    - Standard browser ambient credential CSRF attacks (via forms or cross-origin tags) cannot forge custom bearer headers.
  - [x] JWT Refresh-Token Rotation, Replay Protection & Session Revocation:
    - Enhanced `refreshToken` in `backend/src/auth/auth.service.ts`:
      - Issues new access and refresh tokens on valid rotation and revokes previous token (`isRevoked: true`).
      - **Token Reuse Detection (OWASP)**: If an already-revoked refresh token is re-submitted, an immediate replay attack is identified. The system immediately revokes ALL active sessions/tokens for that user family and logs a security audit event (`SECURITY_ALERT_REFRESH_TOKEN_REUSE`).
  - [x] Input Validation, SQL Injection & Secure Error Masking:
    - Parameterized queries enforced via Prisma ORM throughout all data models.
    - Created `GlobalExceptionsFilter` (`backend/src/common/filters/http-exception.filter.ts`):
      - Normalizes API error responses into `{ statusCode, timestamp, path, error, message }`.
      - Masks raw database queries, syntax errors, and internal stack traces from clients, preventing internal architectural exposure.
  - [x] CSV Formula-Injection Protection (OWASP):
    - Added `sanitizeCsvField` in `backend/src/reports/reports.service.ts`:
      - Neutralizes formula triggers (`=, +, -, @, \t, \r`) by prepending a single quote `'`.
      - Safely escapes double quotes per RFC 4180.
      - Applied across all columns in `exportComplianceCsv` and `exportShortageCsv`.
  - [x] Secrets & Configuration Handling:
    - Created `validateEnvironment()` in `backend/src/config/env.validation.ts`:
      - Enforces minimum 32-character secret length for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `QR_HMAC_SECRET`.
      - Strictly prevents starting the application with development dummy secrets (`dev_...`) in `NODE_ENV === 'production'`.
  - [x] Production Deployment & Container Readiness:
    - Multi-stage `backend/Dockerfile`: Node 20 Alpine, dumb-init PID 1 reaper, non-root user `appuser`, Prisma client generation, automated healthcheck against `GET /api/v1/auth/health`.
    - Multi-stage `web_dashboard/Dockerfile` & `web_dashboard/nginx.conf`: Vite production build served via Nginx Alpine with gzip compression, SPA client fallback, and strict HTTP security headers.
    - Healthcheck endpoint: `GET /api/v1/auth/health` returns status, service name, timestamp, and uptime.
  - [x] Automated Test Verification:
    - Phase 5 Security Verification Suite (`verify-phase5-security.ts`): 23 / 23 tests passed covering all 6 security dimensions against PostgreSQL.
    - Phase 4 Admin Verification Suite (`verify-phase4-admin.ts`): 20 / 20 passed (regression verified).
    - Backend Unit Tests: 28 / 28 passed (`jest --runInBand`).
    - Flutter Static Analysis: `flutter analyze --no-pub` clean (0 errors, 0 warnings).
    - Flutter Tests: 30 / 30 passed (`flutter test`).
    - Web Dashboard Build: Vite production bundle built in 9.66s with 0 errors.
  - [x] Checkpoints Created:
    - Pre-implementation recovery checkpoint: `checkpoint-023`.
    - Phase 5 completion checkpoint: `checkpoint-024`.

### Phase 6: Complete System Integration, Realistic Data Cleanup & UI Verification (Completed & Verified)
- **Status**: Completed & Verified
- **Milestones**:
  - [x] Pre-Implementation Recovery Checkpoint:
    - Allocated `checkpoint-025` before code modifications.
  - [x] Elimination of Generic Placeholder Identities:
    - Searched whole repository and active PostgreSQL database for generic names (`John Doe`, `Jane Doe`, `Jane Roe`, `Alan Smith`, `Alex Chen`, `Test Student`, `Test Teacher`, `Test User`, `Example Student`, `Lorem`).
    - Replaced all placeholder identities with consistent fictional Indian college identities:
      * **Student 1 (Primary)**: Aarav Sharma (`aarav.sharma@college.edu`, `CS2026-001`, `REG-9901`)
      * **Student 2 (Secondary)**: Riya Patel (`riya.patel@college.edu`, `CS2026-002`, `REG-9902`)
      * **Student 3 (Third)**: Aditya Verma (`aditya.verma@college.edu`, `CS2026-003`, `REG-9903`)
      * **Teacher 1 (Primary)**: Prof. Rahul Mehta (`prof.mehta@college.edu`, `EMP-CSE-101`)
      * **Teacher 2 (Secondary)**: Prof. Sneha Kulkarni (`prof.kulkarni@college.edu`, `EMP-CSE-102`)
      * **Teacher 3 (Third)**: Prof. Amit Joshi (`prof.joshi@college.edu`, `EMP-CSE-103`)
      * **Administrator**: College Administrator (`admin@college.edu`)
    - Safely migrated live PostgreSQL records without breaking foreign keys, passwords (Argon2id hashes preserved), or existing attendance histories (`33` records, `41` audit logs).
    - Updated `seed.ts`, `api_service.dart`, `attendance_guider_service.dart`, `login_screen.dart`, `profile_screen.dart`, `registration_screen.dart`, `timetable_screen.dart`, `dashboard_screen.dart`, `LoginPage.tsx`, `LiveSessionPage.tsx`, and `AuthContext.tsx`.
    - Maintained the prominent `OFFLINE DEMONSTRATION MODE` banner and `DEMO` badges on simulated fixtures.
  - [x] Live Service Execution & Verification:
    - PostgreSQL 16.6 daemon running on port 5432.
    - NestJS API running on `http://localhost:3000/api/v1` (`/auth/health` HTTP 200).
    - React Web Dashboard running on `http://localhost:5173` (HTTP 200).
    - Android Pixel_6 emulator running (`emulator-5554`).
    - Flutter student app running on Pixel_6 emulator (`com.college.attendance.student_mobile`).
  - [x] Comprehensive Automated & Integration Test Verification:
    - Phase 6 Authentication & RBAC Suite (`verify-phase6-auth.ts`): 10 / 10 passed.
    - Phase 6 Live Dashboards Verification (`verify-phase6-dashboards.ts`): 12 / 12 passed.
    - Phase 5 Security Verification Suite (`verify-phase5-security.ts`): 23 / 23 passed.
    - Phase 4 Admin Verification Suite (`verify-phase4-admin.ts`): 20 / 20 passed.
    - Backend Unit Tests: 28 / 28 passed (`jest --passWithNoTests`).
    - Backend Notifications Suite (`verify-notifications-flow.ts`): 12 / 12 passed.
    - Backend E2E Workflow Suite (`verify-e2e-workflow.ts`): 19 / 19 passed.
    - Flutter Static Analysis: `flutter analyze --no-pub` clean (0 issues found in 58.9s).
    - Flutter Tests: 30 / 30 passed (`flutter test`).
    - Web Dashboard Build: Vite production bundle built in 6.14s with 0 errors.
  - [x] Checkpoint Created:
    - Completion checkpoint: `checkpoint-026`.




