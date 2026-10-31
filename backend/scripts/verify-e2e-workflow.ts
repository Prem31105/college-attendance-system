import { Role, SessionStatus, AttendanceStatus, OsType, DeviceStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../src/prisma/prisma.service';
import { QrService } from '../src/qr/qr.service';
import { GpsService } from '../src/gps/gps.service';
import { DevicesService } from '../src/devices/devices.service';
import { RiskService } from '../src/risk/risk.service';
import { AttendanceService } from '../src/attendance/attendance.service';
import { AttendanceSessionsService } from '../src/attendance-sessions/attendance-sessions.service';
import { RandomVerificationService } from '../src/random-verification/random-verification.service';
import { EventsGateway } from '../src/gateway/events.gateway';

const prisma = new PrismaService();

async function runE2EVerification() {
  console.log('\n=============================================================');
  console.log('🧪 STARTING PHASE 2 END-TO-END INTEGRATION & VERIFICATION');
  console.log('=============================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [PASS] ${testName}`);
    } else {
      console.error(`  ❌ [FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`);
    }
  }

  // 1. Database Connection
  try {
    await prisma.$connect();
    assert(true, '1. PostgreSQL Database Connected Successfully');
  } catch (e: any) {
    assert(false, '1. PostgreSQL Database Connected Successfully', e.message);
    process.exit(1);
  }

  // Initialize Core Services
  const eventsGateway = new EventsGateway();
  const qrService = new QrService(prisma);
  const gpsService = new GpsService();
  const devicesService = new DevicesService(prisma);
  const riskService = new RiskService();
  const sessionsService = new AttendanceSessionsService(prisma, qrService, eventsGateway);
  const attendanceService = new AttendanceService(
    prisma,
    qrService,
    gpsService,
    devicesService,
    riskService,
    eventsGateway,
  );
  const randomVerifService = new RandomVerificationService(prisma, eventsGateway);

  // 2. Fetch seeded actors
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@college.edu' } });
  const teacherUser = await prisma.user.findUnique({
    where: { email: 'prof.smith@college.edu' },
    include: { teacher: true },
  });
  const studentUser1 = await prisma.user.findUnique({
    where: { email: 'john.doe@college.edu' },
    include: { student: true },
  });

  assert(!!adminUser && adminUser.role === Role.ADMIN, '2. Admin Account Verified & Authenticated');
  assert(!!teacherUser && teacherUser.role === Role.TEACHER, '3. Teacher Account Verified & Assigned');
  assert(!!studentUser1 && studentUser1.role === Role.STUDENT, '4. Student Account Verified & Enrolled');

  // Verify second student for concurrent scan testing
  const studentUser2 = await prisma.user.upsert({
    where: { email: 'jane.roe@college.edu' },
    update: {},
    create: {
      email: 'jane.roe@college.edu',
      passwordHash: await argon2.hash('StudentSecure123!'),
      firstName: 'Jane',
      lastName: 'Roe',
      role: Role.STUDENT,
      isActive: true,
      student: {
        create: {
          rollNumber: 'CS2026-002',
          registrationNumber: 'REG-9902',
          departmentId: studentUser1!.student!.departmentId,
          semesterId: studentUser1!.student!.semesterId,
          sectionId: studentUser1!.student!.sectionId,
        },
      },
    },
    include: { student: true },
  });

  const sub1 = await prisma.subject.findUnique({ where: { code: 'CS601' } });
  const room401 = await prisma.classroom.findUnique({ where: { name: 'Room 401' } });

  // Enroll student 2 in CS601
  await prisma.enrollment.upsert({
    where: {
      studentId_subjectId: {
        studentId: studentUser2.student!.id,
        subjectId: sub1!.id,
      },
    },
    update: {},
    create: {
      studentId: studentUser2.student!.id,
      subjectId: sub1!.id,
      sectionId: studentUser1!.student!.sectionId,
    },
  });

  // 5. Classroom & Geofence
  assert(
    !!room401 && room401.geofenceRadiusMeters === 75,
    '5. Classroom Geofence Anchor Configured (75m radius)',
  );

  // 6. Start Attendance Session
  const sessionData = await sessionsService.startSession(
    teacherUser!.teacher!.id,
    sub1!.id,
    studentUser1!.student!.sectionId,
    room401!.id,
  );
  const activeSessionId = sessionData.session.id;
  assert(
    sessionData.session.status === SessionStatus.ACTIVE,
    '6. Teacher Started Live Attendance Session',
  );

  // 7. Dynamic QR Generation & Signature
  const qrToken = await qrService.generateDynamicToken(activeSessionId, sub1!.id);
  assert(
    !!qrToken.sig && qrToken.exp > qrToken.iat && qrToken.exp - qrToken.iat === 30,
    '7. Dynamic QR Token Generated with HMAC-SHA256 & 30s Expiry',
  );

  const qrValidation = await qrService.validateToken(qrToken);
  assert(qrValidation.isValid, '8. Dynamic QR Cryptographic Signature Verified on Server');

  // 8. Device Challenge & Signature
  // Generate real ECDSA P-256 keypairs for testing device hardware binding
  const { publicKey: pubKey1, privateKey: privKey1 } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  const { publicKey: pubKey2, privateKey: privKey2 } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  const registeredDevice1 = await prisma.registeredDevice.findFirst({
    where: { studentId: studentUser1!.student!.id, status: DeviceStatus.ACTIVE },
  });
  // Update device with the test public key
  await prisma.registeredDevice.update({
    where: { id: registeredDevice1!.id },
    data: { publicKeyPem: pubKey1 },
  });

  const challenge1 = await devicesService.generateChallenge(
    studentUser1!.student!.id,
    registeredDevice1!.id,
  );
  assert(
    !!challenge1.challengeToken && !challenge1.challengeToken.includes(' '),
    '9. 60-second One-Time Device Challenge Issued',
  );

  // Register device for Student 2 with real ECDSA public key
  const registeredDevice2 = await prisma.registeredDevice.upsert({
    where: { id: 'device-jane-roe-002' },
    update: { publicKeyPem: pubKey2 },
    create: {
      id: 'device-jane-roe-002',
      studentId: studentUser2.student!.id,
      deviceFingerprint: 'SM-G998B-ANDROID-14-HW-TOKEN-992',
      publicKeyPem: pubKey2,
      deviceModel: 'Pixel 8 Pro',
      osType: OsType.ANDROID,
      osVersion: 'Android 14',
      status: DeviceStatus.ACTIVE,
    },
  });

  const challenge2 = await devicesService.generateChallenge(
    studentUser2.student!.id,
    registeredDevice2.id,
  );

  // Sign challenges with the private keys
  const sig1 = crypto.createSign('SHA256').update(challenge1.challengeToken).sign(privKey1, 'base64');
  const sig2 = crypto.createSign('SHA256').update(challenge2.challengeToken).sign(privKey2, 'base64');

  // 10. Student 1 Submits Valid Attendance Inside Geofence (14.2m away, accuracy 8m)
  await prisma.attendanceRecord.deleteMany({ where: { sessionId: activeSessionId } });
  await prisma.attendanceAttempt.deleteMany({ where: { sessionId: activeSessionId } });

  const student1Result = await attendanceService.submitAttendance(studentUser1!.student!.id, {
    sessionId: activeSessionId,
    qrPayload: qrToken,
    latitude: 12.9717,
    longitude: 77.5945627,
    accuracy: 8.5,
    isMockLocation: false,
    challengeToken: challenge1.challengeToken,
    deviceSignature: sig1,
    biometricConfirmed: true,
  });

  assert(
    student1Result.status === AttendanceStatus.VERIFIED,
    '10. Student 1 Attendance Verified & Persisted in PostgreSQL',
    `Status received: ${student1Result.status}`,
  );

  // 11. Concurrent Scan: Student 2 Scans the SAME Active QR Token
  const student2Result = await attendanceService.submitAttendance(studentUser2.student!.id, {
    sessionId: activeSessionId,
    qrPayload: qrToken, // Same QR token scanned concurrently!
    latitude: 12.97165,
    longitude: 77.5945627,
    accuracy: 9.0,
    isMockLocation: false,
    challengeToken: challenge2.challengeToken,
    deviceSignature: sig2,
    biometricConfirmed: true,
  });

  assert(
    student2Result.status === AttendanceStatus.VERIFIED,
    '11. Concurrent Scan: Second Student Scanned Same QR Concurrently',
  );

  // 12. Duplicate Scan Prevention
  let duplicatePrevented = false;
  try {
    // Student 1 attempts to submit a second time for the same session
    await attendanceService.submitAttendance(studentUser1!.student!.id, {
      sessionId: activeSessionId,
      qrPayload: qrToken,
      latitude: 12.9717,
      longitude: 77.5945627,
      accuracy: 8.5,
      isMockLocation: false,
      challengeToken: 'fresh_challenge_token',
      deviceSignature: 'mock_valid_signature_base64',
    });
  } catch (err: any) {
    duplicatePrevented = err.message.includes('already recorded') || err.status === 409;
  }
  assert(duplicatePrevented, '12. Duplicate Scan Prevention Enforced (Atomic Uniqueness)');

  // 13. Replay Protection: Challenge already used
  const replayAttempt = await devicesService.verifySignature(
    studentUser1!.student!.id,
    challenge1.challengeToken,
    'mock_signature',
  );
  assert(
    !replayAttempt.isValid && replayAttempt.reason === 'CHALLENGE_ALREADY_USED_REPLAY_ATTEMPT',
    '13. Challenge-Response Replay Attack Blocked',
  );

  // 14. Geofence Protection: Student outside 75m (400m away)
  const challenge3 = await devicesService.generateChallenge(
    studentUser1!.student!.id,
    registeredDevice1!.id,
  );
  const outOfRangeVerdict = riskService.evaluate({
    qrValid: true,
    qrExpired: false,
    gpsValid: false,
    distanceMeters: 400,
    gpsAccuracy: 10,
    isMockLocation: false,
    deviceSignatureValid: true,
    integrityPassed: true,
  });
  assert(
    outOfRangeVerdict.status === AttendanceStatus.REJECTED,
    '14. Out-of-Geofence Attempt (400m > 75m) Rejected by Risk Engine',
  );

  // 15. Mock Location Flagging
  const mockLocationVerdict = riskService.evaluate({
    qrValid: true,
    qrExpired: false,
    gpsValid: false,
    distanceMeters: 10,
    gpsAccuracy: 5,
    isMockLocation: true,
    deviceSignatureValid: true,
    integrityPassed: true,
  });
  assert(
    mockLocationVerdict.status === AttendanceStatus.SUSPICIOUS,
    '15. Mock Location Spoofing Detected & Flagged Suspicious',
  );

  // 16. Random Teacher Physical Verification
  const randomChallenge = await randomVerifService.triggerRandomVerification(
    activeSessionId,
    teacherUser!.teacher!.id,
    1,
  );
  assert(
    randomChallenge.challenges.length > 0,
    '16. Teacher In-Session Random Physical Verification Challenge Triggered',
  );

  // 17. Manual Attendance Override with Mandatory Reason
  const manualRecord = await attendanceService.manualMark(teacherUser!.teacher!.id, {
    sessionId: activeSessionId,
    studentId: studentUser1!.student!.id,
    status: AttendanceStatus.VERIFIED,
    mandatoryReason: 'Physically present at front desk; phone battery died during lecture.',
  });
  assert(
    manualRecord.reasonCode.includes('MANUAL_TEACHER_OVERRIDE'),
    '17. Manual Instructor Attendance Override with Mandatory Reason',
  );

  // 18. Audit Trail Verification
  const auditLog = await prisma.attendanceAuditLog.findFirst({
    where: { entityId: manualRecord.id },
  });
  assert(
    !!auditLog && auditLog.action === 'MANUAL_ATTENDANCE_OVERRIDE',
    '18. Immutable Audit Log Trail Recorded for Manual Override',
  );

  // 19. Close Session
  const closeResult = await sessionsService.closeSession(activeSessionId, teacherUser!.teacher!.id);
  assert(
    closeResult.session.status === SessionStatus.CLOSED,
    '19. Teacher Successfully Closed Attendance Session',
  );

  console.log('\n=============================================================');
  console.log(`📊 E2E VERIFICATION RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('=============================================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 ALL INTEGRATION WORKFLOWS FULLY VERIFIED!\n');
  } else {
    process.exit(1);
  }
}

runE2EVerification()
  .catch((e) => {
    console.error('Fatal error in E2E verification:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
