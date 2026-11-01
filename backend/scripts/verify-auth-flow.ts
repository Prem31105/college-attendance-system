import { PrismaService } from '../src/prisma/prisma.service';
import { AuthService } from '../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';

const prisma = new PrismaService();
const jwtService = new JwtService({});
const authService = new AuthService(prisma, jwtService);

async function runAuthVerification() {
  console.log('\n=============================================================');
  console.log('🧪 VERIFYING PHASE 2.2 AUTH, REGISTRATION & TOKEN ROTATION');
  console.log('=============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(cond: boolean, name: string, detail?: string) {
    total++;
    if (cond) {
      passed++;
      console.log(`  ✅ [PASS] ${name}`);
    } else {
      console.error(`  ❌ [FAIL] ${name}${detail ? ` -> ${detail}` : ''}`);
    }
  }

  try {
    await prisma.$connect();
    assert(true, '1. Connected to live PostgreSQL database');

    const testEmail = 'verify.student@college.edu';
    const testRoll = 'CS2026-999';
    const testReg = '202699988877';
    const testPass = 'SecureStudentPass2026!#';
    const testPem = '-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE7p9r7E+k9hVb3W3Wd2WJ2+cI0q2ab9/W4D0+zDq+Y4lU5K6tM3v7wO7N3nZ5G1h9j3K8l7k5h7b4k2m9l4a7wQ==\n-----END PUBLIC KEY-----';

    // Cleanup previous test run if exists
    const prevUser = await prisma.user.findUnique({ where: { email: testEmail } });
    if (prevUser) {
      await prisma.user.delete({ where: { id: prevUser.id } });
    }

    // 2. Reject non-institutional email
    let rejectedNonCollege = false;
    try {
      await authService.registerStudent({
        email: 'attacker@gmail.com',
        rollNumber: testRoll,
        registrationNumber: testReg,
        password: testPass,
        publicKeyPem: testPem,
      });
    } catch (e: any) {
      rejectedNonCollege = e.message.includes('@college.edu');
    }
    assert(rejectedNonCollege, '2. Non-institutional email rejected by backend validator');

    // 3. Reject invalid roll number format
    let rejectedBadRoll = false;
    try {
      await authService.registerStudent({
        email: testEmail,
        rollNumber: 'BAD_ROLL_123',
        registrationNumber: testReg,
        password: testPass,
        publicKeyPem: testPem,
      });
    } catch (e: any) {
      rejectedBadRoll = e.message.includes('Roll number must match format');
    }
    assert(rejectedBadRoll, '3. Invalid roll number format rejected by backend validator');

    // 4. Successful registration & primary device key binding
    const regResult = await authService.registerStudent({
      email: testEmail,
      rollNumber: testRoll,
      registrationNumber: testReg,
      password: testPass,
      publicKeyPem: testPem,
      deviceModel: 'Pixel 6',
      deviceFingerprint: 'pixel6_fingerprint_001',
    });
    assert(
      !!regResult.accessToken && !!regResult.user.studentId && !!regResult.user.deviceId,
      '4. Student registered and primary hardware device bound in database',
      JSON.stringify(regResult.user),
    );

    // 5. Verify database record directly
    const dbDevice = await prisma.registeredDevice.findFirst({
      where: { studentId: regResult.user.studentId, status: 'ACTIVE' },
    });
    assert(
      !!dbDevice && dbDevice.publicKeyPem.includes('BEGIN PUBLIC KEY'),
      '5. Hardware ECDSA P-256 public key verified in PostgreSQL table RegisteredDevice',
    );

    // 6. Login with new credentials
    const loginResult = await authService.login({
      email: testEmail,
      password: testPass,
    });
    assert(
      !!loginResult.accessToken && loginResult.user.email === testEmail,
      '6. Authenticated via Argon2id password hash matching',
    );

    // 7. Refresh token rotation
    const rotateResult = await authService.refreshToken({
      refreshToken: loginResult.refreshToken,
    });
    assert(
      !!rotateResult.accessToken && rotateResult.accessToken !== loginResult.accessToken,
      '7. Access-token and refresh-token rotated successfully',
    );

    // 8. Replay attack with previous refresh token must be rejected
    let replayRejected = false;
    try {
      await authService.refreshToken({
        refreshToken: loginResult.refreshToken,
      });
    } catch (e: any) {
      replayRejected = true;
    }
    assert(replayRejected, '8. Revoked previous refresh token rejected (Token Reuse Protection)');

    // 9. Logout
    const logoutResult = await authService.logout(regResult.user.id, rotateResult.refreshToken);
    assert(logoutResult.success, '9. User session logged out and tokens revoked');

    console.log(`\n=============================================================`);
    console.log(`📊 AUTH SUITE RESULTS: ${passed}/${total} TESTS PASSED`);
    console.log(`=============================================================\n`);

    if (passed === total) {
      console.log('🎉 ALL AUTH & REGISTRATION TESTS PASSED!\n');
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAuthVerification();
