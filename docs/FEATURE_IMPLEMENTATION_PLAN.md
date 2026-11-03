# Phase 2 Product Features Implementation Plan
## Autonomous College Attendance Management System

### 1. Architectural Scope & Roadmap

```
+----------------------------------------------------------------------------------------------------+
|                                    PHASE 2 FEATURE ROADMAP                                         |
+----------------------------------------------------------------------------------------------------+
|  Phase 2.1: Master Feature Implementation Plan & Specs (This Document)                             |
|  Phase 2.2: Splash, Onboarding & Security Auth (Password Generator, Validation, Secure Tokens)    |
|  Phase 2.3: Role-Based Notifications & Announcements Center                                        |
|  Phase 2.4: Location Geofencing Radar & Dynamic QR Controls                                        |
|  Phase 2.5: Smart Attendance Guider & Predictive Semester Target Calculator                        |
|  Phase 2.6: Integration Testing, Verification on Pixel_6 Emulator & Checkpoint-007                 |
+----------------------------------------------------------------------------------------------------+
```

---

### 2. Feature Specifications & Modular Breakdown

#### Phase 2.2: Splash, Onboarding & Security Authentication
1. **Onboarding Carousel (`onboarding_screen.dart`)**:
   - 3-slide interactive introduction:
     - Slide 1: **Dynamic QR Technology** (15s refresh, anti-proxy HMAC encryption).
     - Slide 2: **GPS Geofence Boundary** (75m strict classroom boundary, 20m accuracy).
     - Slide 3: **Device Keystore Security** (Hardware-bound ECDSA P-256 signatures).
   - "Get Started" and "Skip" navigation.
   - Persistent `has_completed_onboarding` flag using `flutter_secure_storage`.
2. **Institutional Credential Restriction & Validation**:
   - Email format: Strictly `@college.edu` institutional domain.
   - Roll number format: `^[A-Z]{2,4}[0-9]{4}-[0-9]{3,4}$` (e.g. `CS2026-001`).
   - Registration number format: `^[0-9]{8,12}$`.
3. **Strong Password Generator & Policy Validator**:
   - Built-in cryptographic strong password generator (uppercase, lowercase, numbers, special symbols).
   - Live visual password strength meter (`Weak`, `Fair`, `Good`, `Strong`).
   - One-tap "Generate & Fill" button with clipboard copy action.
4. **Session Timeout & Secure Token Management**:
   - Token storage abstracted via `TokenManager` using `FlutterSecureStorage`.
   - Inactivity timer tracking user interactions (auto-lock after 15 minutes of inactivity).
   - Clean logout workflow wiping cached tokens and resetting state.

#### Phase 2.3: Role-Based Notifications & Announcements (Completed & Verified)
1. **In-App Notification Center (`notifications_screen.dart` & `notification_detail_screen.dart`)**:
   - Filter chips: `All`, `Urgent Only`, `Attendance Alerts`, `Announcements`.
   - Notification entities: Title, message, timestamp, priority (`URGENT`, `NORMAL`, `INFORMATIONAL`), read/unread indicator.
   - Filter and "Mark all as read" capabilities.
   - Dynamic live unread badge counter displayed on Dashboard AppBar.
   - High-contrast urgent notification banner on Dashboard for unread urgent alerts.
   - Dedicated notification detail screen with automatic mark-as-read.
   - Backend REST APIs (`GET /notifications`, `GET /notifications/unread-count`, `GET /notifications/:id`, `PATCH /notifications/:id/read`, `POST /notifications/mark-all-read`, `POST /notifications/announce`).
   - Role-based authorization & priority controls (Students blocked from announcements; Teachers restricted to student roles/sections; Admins allowed global broadcasts; Audit logs for urgent broadcasts).
   - Real-time WebSocket delivery via `EventsGateway`.

#### Phase 2.4: Location Permissions & Geofencing Radar
1. **Interactive GPS Geofence Visualizer (`gps_status_screen.dart`)**:
   - Real-time GPS location coordinates retrieval via `geolocator`.
   - Haversine distance calculator against classroom anchor (Room 401).
   - Visual radar pulse indicating whether device is inside (<75m) or outside the geofence.
   - Accuracy meter with color-coded safety threshold (Green <= 20m, Red > 20m).
   - Mock location / spoofing detection flag.

#### Phase 2.5: Smart Attendance Guider & Predictive Calculator (Completed & Verified)
1. **Smart Guider Module (`smart_attendance_guider.dart` / `subject_statistics_screen.dart`)**:
   - Target configuration: Configurable target threshold (default 75% or 80%).
   - Subject-by-subject statistics: Total lectures conducted, lectures attended, lectures missed, current attendance percentage.
   - **Predictive Bunk & Attendance Algorithm**:
     - If current percentage >= target:
       $$\text{Safe Bunks} = \left\lfloor \frac{\text{Attended} - (\text{Target} \times \text{Total})}{\text{Target}} \right\rfloor$$
     - If current percentage < target:
       $$\text{Required Consecutive Lectures} = \left\lceil \frac{(\text{Target} \times \text{Total}) - \text{Attended}}{1 - \text{Target}} \right\rceil$$
   - Lecture recommendations: Highlights subjects in the "Critical/Danger Zone" (<75%) requiring immediate attendance.

#### Phase 2.6: Final Integration Testing, Pixel_6 Emulator Verification & Phase 2 Completion (Completed & Verified)
1. **Multi-Subject Database Seeding & Fixture Remediation**:
   - Eliminated simulated subject augmentation (`_getAugmentedSubjects`) from client.
   - Seeded real multi-subject attendance records in PostgreSQL (`CS601` 100%, `CS602` 70%).
   - Isolated offline fallback mode with clear warning banner and `DEMO` badges.
2. **Native Android Emulator Verification**:
   - Compiled debug APK (215 MB) and installed on `Pixel_6` emulator (`emulator-5554`).
   - Verified Home Dashboard, Smart Target Guider (interactive 85% recalculation), and GPS Geofence Radar.
   - Preserved UI evidence screenshots in `docs/evidence/phase2_verification/`.
3. **Comprehensive Regression & Integration Verification**:
   - Flutter static analysis (0 issues) and Flutter tests (30/30 passed).
   - Backend unit tests (16/16 passed in-band).
   - Backend E2E integration suite (19/19 passed) and Notification suite (12/12 passed).
   - Web Dashboard production bundle build (25.64s, 0 errors).
4. **Phase 2 Closure**:
   - Checkpoint-018 created; Phase 2 features 100% complete.


---

### 3. Execution Sequence & Safety Checks
- Step-by-step implementation.
- Every step validated via `flutter analyze` and `flutter test`.
- Real-time verification on the running Pixel_6 Android emulator.
- No destructive Git commands, no overwriting of existing uncommitted work.
