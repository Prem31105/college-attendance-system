# Database Schema Specification

The database utilizes PostgreSQL with Prisma ORM. All timestamps are in UTC (`timestamptz`). Foreign keys and unique constraints are enforced strictly.

## Core Relational Entities

### 1. Identity & RBAC
- **users**: `id (UUID)`, `email (unique)`, `password_hash (Argon2id)`, `first_name`, `last_name`, `role (STUDENT, TEACHER, ADMIN)`, `is_active`, `created_at`, `updated_at`.
- **refresh_tokens**: `id (UUID)`, `user_id (FK)`, `token_hash`, `device_id`, `expires_at`, `is_revoked`, `created_at`.
- **students**: `id (UUID)`, `user_id (FK unique)`, `roll_number (unique)`, `registration_number (unique)`, `department_id (FK)`, `semester_id (FK)`, `section_id (FK)`.
- **teachers**: `id (UUID)`, `user_id (FK unique)`, `employee_id (unique)`, `department_id (FK)`, `designation`.

### 2. Academic Structure
- **departments**: `id (UUID)`, `code (unique)`, `name`.
- **courses**: `id (UUID)`, `department_id (FK)`, `name`, `code (unique)`.
- **semesters**: `id (UUID)`, `course_id (FK)`, `semester_number (1-8)`, `academic_year`.
- **class_sections**: `id (UUID)`, `semester_id (FK)`, `name (e.g. A, B, C)`.
- **subjects**: `id (UUID)`, `code (unique)`, `name`, `course_id (FK)`, `semester_id (FK)`, `credits`.
- **enrollments**: `id (UUID)`, `student_id (FK)`, `subject_id (FK)`, `section_id (FK)`, `enrolled_at`, `UNIQUE(student_id, subject_id)`.
- **teacher_subject_assignments**: `id (UUID)`, `teacher_id (FK)`, `subject_id (FK)`, `section_id (FK)`, `academic_year`.
- **classrooms**: `id (UUID)`, `name`, `building`, `latitude (float)`, `longitude (float)`, `geofence_radius_meters (int, default 75)`.
- **timetables**: `id (UUID)`, `subject_id (FK)`, `section_id (FK)`, `teacher_id (FK)`, `classroom_id (FK)`, `day_of_week (1-7)`, `start_time (time)`, `end_time (time)`.

### 3. Attendance Sessions & Verification Tokens
- **attendance_sessions**: `id (UUID)`, `subject_id (FK)`, `section_id (FK)`, `teacher_id (FK)`, `classroom_id (FK)`, `status (ACTIVE, CLOSED, CANCELLED)`, `start_time`, `end_time`, `geofence_radius_meters`, `created_at`.
- **qr_tokens**: `id (UUID)`, `session_id (FK)`, `nonce (unique)`, `signature`, `issued_at`, `expires_at`, `is_active`.

### 4. Device Security & Integrity
- **registered_devices**: `id (UUID)`, `student_id (FK)`, `device_fingerprint`, `public_key (PEM)`, `device_model`, `os_type (ANDROID, IOS)`, `os_version`, `status (PENDING, ACTIVE, REVOKED)`, `registered_at`, `revoked_at`.
- **device_challenges**: `id (UUID)`, `student_id (FK)`, `device_id (FK)`, `challenge_token (unique)`, `expires_at`, `is_used`, `created_at`.
- **device_integrity_checks**: `id (UUID)`, `device_id (FK)`, `verdict_json`, `passed (boolean)`, `evaluated_at`.

### 5. Attendance Records & Audit Trail
- **attendance_records**: `id (UUID)`, `session_id (FK)`, `student_id (FK)`, `status (VERIFIED, PENDING, SUSPICIOUS, REJECTED)`, `verification_layer_mask (int)`, `distance_meters (float)`, `gps_accuracy (float)`, `risk_score (float)`, `reason_code`, `marked_at`, `UNIQUE(session_id, student_id)`.
- **attendance_attempts**: `id (UUID)`, `session_id (FK)`, `student_id (FK)`, `latitude`, `longitude`, `accuracy`, `is_mock_location (boolean)`, `signature_valid (boolean)`, `status`, `rejection_reason`, `attempted_at`.
- **random_verification_challenges**: `id (UUID)`, `session_id (FK)`, `student_id (FK)`, `status (PENDING, VERIFIED, ABSENT)`, `verified_by_teacher_id (FK)`, `verified_at`, `notes`.
- **attendance_correction_requests**: `id (UUID)`, `student_id (FK)`, `session_id (FK)`, `reason`, `status (PENDING, APPROVED, REJECTED)`, `reviewed_by (FK)`, `reviewed_at`.
- **attendance_audit_logs**: `id (UUID)`, `action`, `entity_name`, `entity_id`, `actor_id (FK)`, `old_value (JSON)`, `new_value (JSON)`, `ip_address`, `created_at`.
- **notifications**: `id (UUID)`, `user_id (FK)`, `title`, `message`, `type`, `is_read`, `created_at`.
- **system_settings**: `key (PK)`, `value (JSON)`, `description`, `updated_at`.
