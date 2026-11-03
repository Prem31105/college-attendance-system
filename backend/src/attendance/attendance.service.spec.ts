import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AttendanceService, SubmitAttendanceDto } from './attendance.service';
import { PrismaService } from '../prisma/prisma.service';
import { QrService } from '../qr/qr.service';
import { GpsService } from '../gps/gps.service';
import { DevicesService } from '../devices/devices.service';
import { RiskService } from '../risk/risk.service';
import { EventsGateway } from '../gateway/events.gateway';
import { AttendanceStatus, SessionStatus } from '@prisma/client';

describe('AttendanceService - Dynamic QR Attendance & Risk Verification', () => {
  let service: AttendanceService;
  let mockPrisma: any;
  let mockQrService: any;
  let mockGpsService: any;
  let mockDevicesService: any;
  let riskService: RiskService;
  let mockEventsGateway: any;

  const sampleSession = {
    id: 'sess-cs601-01',
    subjectId: 'sub-cs601',
    sectionId: 'sec-a',
    teacherId: 'teacher-1',
    status: SessionStatus.ACTIVE,
    geofenceRadiusMeters: 75.0,
    classroom: {
      id: 'room-401',
      name: 'Room 401',
      latitude: 12.9715987,
      longitude: 77.5945627,
    },
    subject: {
      id: 'sub-cs601',
      code: 'CS601',
      name: 'Advanced Distributed Systems',
    },
    teacher: {
      userId: 'user-teacher-1',
    },
  };

  const sampleQrPayload = {
    sid: 'sess-cs601-01',
    sub: 'sub-cs601',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 30,
    non: 'valid_nonce_64_bytes',
    sig: 'valid_hmac_sha256_signature',
  };

  const validDto: SubmitAttendanceDto = {
    sessionId: 'sess-cs601-01',
    qrPayload: sampleQrPayload,
    latitude: 12.971610,
    longitude: 77.594570,
    accuracy: 8.5,
    challengeToken: 'valid_challenge_token_abc',
    deviceSignature: 'valid_ecdsa_signature_base64',
    biometricConfirmed: true,
  };

  beforeEach(() => {
    mockPrisma = {
      attendanceSession: {
        findUnique: jest.fn().mockResolvedValue(sampleSession),
      },
      enrollment: {
        findFirst: jest.fn().mockResolvedValue({ id: 'enr-1', studentId: 'student-1' }),
      },
      attendanceRecord: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }) => ({
          id: `rec-${Math.random().toString(36).substr(2, 6)}`,
          ...data,
          markedAt: new Date(),
          student: {
            rollNumber: 'CS2026-001',
            user: { firstName: 'John', lastName: 'Doe' },
          },
        })),
        upsert: jest.fn().mockImplementation(({ create, update }) => ({
          id: 'rec-upsert-1',
          ...create,
          ...update,
          markedAt: new Date(),
          student: {
            rollNumber: 'CS2026-001',
            user: { firstName: 'John', lastName: 'Doe' },
          },
        })),
      },
      attendanceAttempt: {
        create: jest.fn().mockResolvedValue({ id: 'att-1' }),
      },
      attendanceAuditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      },
      $transaction: jest.fn().mockImplementation(async (callback) => {
        return callback(mockPrisma);
      }),
    };

    mockQrService = {
      validateToken: jest.fn().mockResolvedValue({ isValid: true }),
    };

    mockGpsService = new GpsService();

    mockDevicesService = {
      verifySignature: jest.fn().mockResolvedValue({ isValid: true, deviceId: 'dev-1' }),
    };

    riskService = new RiskService();

    mockEventsGateway = {
      broadcastAttendanceUpdate: jest.fn(),
    };

    service = new AttendanceService(
      mockPrisma as PrismaService,
      mockQrService as QrService,
      mockGpsService as GpsService,
      mockDevicesService as DevicesService,
      riskService,
      mockEventsGateway as EventsGateway,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Valid Low-Risk Attendance Submission', () => {
    it('verifies student attendance when QR, GPS, and device signature are all valid', async () => {
      const result = await service.submitAttendance('student-1', validDto);

      expect(result.status).toBe(AttendanceStatus.VERIFIED);
      expect(result.riskScore).toBeLessThanOrEqual(0.1);
      expect(result.reasonCode).toBe('ALL_VERIFICATION_CHECKS_PASSED');
      expect(result.distanceMeters).toBeLessThan(20.0);
      expect(mockEventsGateway.broadcastAttendanceUpdate).toHaveBeenCalledWith(
        'sess-cs601-01',
        expect.objectContaining({
          studentId: 'student-1',
          status: AttendanceStatus.VERIFIED,
        }),
      );
    });
  });

  describe('2. Expired QR Token Rejection', () => {
    it('rejects submission when dynamic QR token has expired (>30s)', async () => {
      mockQrService.validateToken.mockResolvedValueOnce({
        isValid: false,
        reason: 'QR_TOKEN_EXPIRED',
      });

      const result = await service.submitAttendance('student-1', {
        ...validDto,
        qrPayload: { ...sampleQrPayload, exp: Math.floor(Date.now() / 1000) - 10 },
      });

      expect(result.status).toBe(AttendanceStatus.REJECTED);
      expect(result.reasonCode).toBe('QR_EXPIRED');
      expect(result.riskScore).toBeGreaterThanOrEqual(0.4);
    });
  });

  describe('3. Tampered / Invalid QR Signature Rejection', () => {
    it('rejects submission when HMAC signature is forged or mismatched', async () => {
      mockQrService.validateToken.mockResolvedValueOnce({
        isValid: false,
        reason: 'INVALID_QR_SIGNATURE',
      });

      const result = await service.submitAttendance('student-1', {
        ...validDto,
        qrPayload: { ...sampleQrPayload, sig: 'forged_tampered_signature' },
      });

      expect(result.status).toBe(AttendanceStatus.REJECTED);
      expect(result.reasonCode).toBe('QR_INVALID_SIGNATURE');
    });
  });

  describe('4. GPS Geofencing Boundaries', () => {
    it('rejects submission when student device is outside 75m classroom boundary (e.g., 250m)', async () => {
      // Coordinates approx 250m away from Room 401
      const result = await service.submitAttendance('student-1', {
        ...validDto,
        latitude: 12.973800,
        longitude: 77.595900,
      });

      expect(result.status).toBe(AttendanceStatus.REJECTED);
      expect(result.reasonCode).toContain('OUT_OF_GEOFENCE_RADIUS');
      expect(result.distanceMeters).toBeGreaterThan(75.0);
    });

    it('rejects submission when GPS satellite accuracy exceeds 20m threshold', async () => {
      const result = await service.submitAttendance('student-1', {
        ...validDto,
        accuracy: 35.0, // ±35m accuracy exceeds 20m limit
      });

      expect(result.status).toBe(AttendanceStatus.REJECTED);
      expect(result.reasonCode).toContain('GPS_ACCURACY_TOO_POOR_RETRY');
    });
  });

  describe('5. Registered Device Cryptographic Proof & Replay Protection', () => {
    it('rejects submission when device ECDSA signature verification fails', async () => {
      mockDevicesService.verifySignature.mockResolvedValueOnce({
        isValid: false,
        reason: 'CRYPTOGRAPHIC_SIGNATURE_INVALID',
      });

      const result = await service.submitAttendance('student-1', {
        ...validDto,
        deviceSignature: 'invalid_forged_sig',
      });

      expect(result.status).toBe(AttendanceStatus.REJECTED);
      expect(result.reasonCode).toBe('DEVICE_CRYPTO_SIGNATURE_FAILED');
    });

    it('rejects challenge replay attack when challenge token is already used', async () => {
      mockDevicesService.verifySignature.mockResolvedValueOnce({
        isValid: false,
        reason: 'CHALLENGE_ALREADY_USED_REPLAY_ATTEMPT',
      });

      const result = await service.submitAttendance('student-1', {
        ...validDto,
        challengeToken: 'already_used_challenge_token',
      });

      expect(result.status).toBe(AttendanceStatus.REJECTED);
      expect(result.reasonCode).toBe('DEVICE_CRYPTO_SIGNATURE_FAILED');
    });
  });

  describe('6. Duplicate Submission Protection (Idempotency)', () => {
    it('throws ConflictException (HTTP 409) if student already recorded attendance for the session', async () => {
      mockPrisma.attendanceRecord.findUnique.mockResolvedValueOnce({
        id: 'existing-rec-1',
        sessionId: 'sess-cs601-01',
        studentId: 'student-1',
        status: AttendanceStatus.VERIFIED,
      });

      await expect(service.submitAttendance('student-1', validDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('7. Concurrent Student Scans of Same Dynamic QR', () => {
    it('allows multiple distinct students to scan and redeem the exact same valid QR token', async () => {
      // Student 1 submits
      const res1 = await service.submitAttendance('student-1', validDto);

      // Student 2 submits using the exact same QR payload
      const res2 = await service.submitAttendance('student-2', {
        ...validDto,
        challengeToken: 'student_2_challenge_token',
        deviceSignature: 'student_2_device_signature',
      });

      expect(res1.status).toBe(AttendanceStatus.VERIFIED);
      expect(res2.status).toBe(AttendanceStatus.VERIFIED);
      expect(mockPrisma.attendanceRecord.create).toHaveBeenCalledTimes(2);
      expect(mockEventsGateway.broadcastAttendanceUpdate).toHaveBeenCalledTimes(2);
    });
  });

  describe('8. Mock Location Spoofing & Suspicious Flagging', () => {
    it('flags attempt as SUSPICIOUS when mock location is detected without rejecting silently', async () => {
      const result = await service.submitAttendance('student-1', {
        ...validDto,
        isMockLocation: true,
      });

      expect(result.status).toBe(AttendanceStatus.SUSPICIOUS);
      expect(result.reasonCode).toBe('GPS_MOCK_LOCATION_ACTIVE');
      expect(result.riskScore).toBeGreaterThanOrEqual(0.7);
      // Allows teacher physical verification without breaking session flow
      expect(mockEventsGateway.broadcastAttendanceUpdate).toHaveBeenCalledWith(
        'sess-cs601-01',
        expect.objectContaining({
          status: AttendanceStatus.SUSPICIOUS,
        }),
      );
    });
  });

  describe('9. Teacher Risk-Based Manual Verification & Override', () => {
    it('requires a mandatory reason of minimum 5 characters for manual override', async () => {
      await expect(
        service.manualMark('teacher-1', {
          sessionId: 'sess-cs601-01',
          studentId: 'student-1',
          status: AttendanceStatus.VERIFIED,
          mandatoryReason: 'ok', // too short
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('records manual override and creates an immutable audit log entry', async () => {
      const result = await service.manualMark('teacher-1', {
        sessionId: 'sess-cs601-01',
        studentId: 'student-1',
        status: AttendanceStatus.VERIFIED,
        mandatoryReason: 'Student battery died; physically verified in Room 401 seat 12.',
      });

      expect(result.status).toBe(AttendanceStatus.VERIFIED);
      expect(mockPrisma.attendanceAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'MANUAL_ATTENDANCE_OVERRIDE',
          entityName: 'AttendanceRecord',
          actorId: 'user-teacher-1',
        }),
      });
      expect(mockEventsGateway.broadcastAttendanceUpdate).toHaveBeenCalled();
    });
  });
});
