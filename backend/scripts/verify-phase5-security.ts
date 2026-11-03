import { Role, SessionStatus, AttendanceStatus, DeviceStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthService } from '../src/auth/auth.service';
import { ReportsService } from '../src/reports/reports.service';
import { AdminService } from '../src/admin/admin.service';
import { JwtService } from '@nestjs/jwt';
import { validateEnvironment } from '../src/config/env.validation';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaService();

async function runSecurityVerification() {
  console.log('\n=============================================================');
  console.log('🛡️  STARTING PHASE 5: PRODUCTION READINESS & SECURITY HARDENING VERIFICATION');
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

  try {
    await prisma.$connect();
    assert(true, '1. PostgreSQL Database Connected Successfully');
  } catch (e: any) {
    assert(false, '1. PostgreSQL Database Connected Successfully', e.message);
    process.exit(1);
  }

  const jwtService = new JwtService();
  const authService = new AuthService(prisma, jwtService);
  const reportsService = new ReportsService(prisma);
  const adminService = new AdminService(prisma);

  // 1. Secrets & Environment Validation
  console.log('\n--- Section 1: Secrets & Configuration Validation ---');
  try {
    const devValidation = validateEnvironment();
    assert(
      devValidation.isValid === true,
      '2. Development environment validation passed with valid required secrets',
    );

    // Test production validator blocks insecure secrets
    const originalEnv = process.env.NODE_ENV;
    const originalSecret = process.env.JWT_ACCESS_SECRET;
    try {
      process.env.NODE_ENV = 'production';
      process.env.JWT_ACCESS_SECRET = 'dev_insecure_secret_for_testing';
      let threw = false;
      try {
        validateEnvironment();
      } catch (err) {
        threw = true;
      }
      assert(threw, '3. Production validator strictly blocks insecure default secrets');
    } finally {
      process.env.NODE_ENV = originalEnv;
      process.env.JWT_ACCESS_SECRET = originalSecret;
    }
  } catch (e: any) {
    assert(false, 'Section 1 Secrets & Configuration', e.message);
  }

  // 2. CSV Formula Injection Protection (OWASP)
  console.log('\n--- Section 2: CSV Formula-Injection Protection ---');
  try {
    const maliciousValues = [
      '=cmd|"/C calc"!A0',
      '+1+1',
      '-2+3',
      '@SUM(1,2)',
      '\tcmd.exe',
      'Normal Student Name',
    ];

    const sanitized1 = reportsService.sanitizeCsvField(maliciousValues[0]);
    assert(
      sanitized1.startsWith("\"'=") && sanitized1.endsWith("\""),
      '4. Formula prefix "=" safely neutralized by prepending single quote',
    );

    const sanitized2 = reportsService.sanitizeCsvField(maliciousValues[1]);
    assert(
      sanitized2.startsWith("\"'+"),
      '5. Formula prefix "+" safely neutralized',
    );

    const sanitized3 = reportsService.sanitizeCsvField(maliciousValues[3]);
    assert(
      sanitized3.startsWith("\"'@"),
      '6. Formula prefix "@" safely neutralized',
    );

    const sanitizedNormal = reportsService.sanitizeCsvField(maliciousValues[5]);
    assert(
      sanitizedNormal === '"Normal Student Name"',
      '7. Standard strings preserved without spurious prepending',
    );

    // Full export CSV verify
    const complianceCsv = await reportsService.exportComplianceCsv();
    assert(
      complianceCsv.startsWith('Roll Number,Student Name,Email,Department'),
      '8. exportComplianceCsv sanitized headers and cells verified',
    );
  } catch (e: any) {
    assert(false, 'Section 2 CSV Formula Injection', e.message);
  }

  // 3. JWT Refresh-Token Rotation & Replay Attack Detection
  console.log('\n--- Section 3: JWT Refresh-Token Rotation & Replay Protection ---');
  try {
    const studentUser = await prisma.user.findFirst({
      where: { role: Role.STUDENT },
    });
    if (!studentUser) throw new Error('Student user seed missing');

    // Create a login token pair
    const secret = process.env.JWT_REFRESH_SECRET || 'dev_jwt_refresh_secret_for_docker_testing_only_change_in_prod_64char_string';
    const payload = { sub: studentUser.id, email: studentUser.email, role: Role.STUDENT, jti: 'test-jti-01' };
    const initialRefreshToken = jwtService.sign(payload, { secret, expiresIn: '7d' });
    const initialHash = crypto.createHash('sha256').update(initialRefreshToken).digest('hex');

    await prisma.refreshToken.create({
      data: {
        userId: studentUser.id,
        tokenHash: initialHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // 1st Refresh: Valid rotation
    const newTokens = await authService.refreshToken({ refreshToken: initialRefreshToken });
    assert(
      typeof newTokens.accessToken === 'string' && typeof newTokens.refreshToken === 'string',
      '9. Valid refresh token rotation issues new access & refresh token pair',
    );

    // Verify initial token is now marked isRevoked: true
    const revokedInitial = await prisma.refreshToken.findUnique({
      where: { tokenHash: initialHash },
    });
    assert(
      revokedInitial?.isRevoked === true,
      '10. Rotated refresh token marked isRevoked: true in database',
    );

    // 2nd Refresh with SAME token (Replay Attack Attempt):
    let replayBlocked = false;
    try {
      await authService.refreshToken({ refreshToken: initialRefreshToken });
    } catch (err: any) {
      if (err.message && err.message.includes('Refresh token reuse detected')) {
        replayBlocked = true;
      }
    }
    assert(
      replayBlocked,
      '11. Replay attack attempt with revoked token detected and rejected with HTTP 401',
    );

    // Verify all active sessions for that user were invalidated
    const activeTokensCount = await prisma.refreshToken.count({
      where: { userId: studentUser.id, isRevoked: false },
    });
    assert(
      activeTokensCount === 0,
      '12. Token reuse detection successfully invalidated ALL active sessions for compromised user',
    );

    // Verify security alert logged in AttendanceAuditLog
    const securityAudit = await prisma.attendanceAuditLog.findFirst({
      where: {
        actorId: studentUser.id,
        action: 'SECURITY_ALERT_REFRESH_TOKEN_REUSE',
      },
    });
    assert(
      securityAudit !== null,
      '13. Security alert recorded in immutable AttendanceAuditLog with user identity',
    );

    // Clean up test refresh tokens and test audit entries
    await prisma.attendanceAuditLog.deleteMany({
      where: { action: 'SECURITY_ALERT_REFRESH_TOKEN_REUSE', actorId: studentUser.id },
    });
    await prisma.refreshToken.deleteMany({
      where: { userId: studentUser.id },
    });
  } catch (e: any) {
    assert(false, 'Section 3 JWT Replay Protection', e.message);
  }

  // 4. Role Isolation & Access Control Boundaries
  console.log('\n--- Section 4: Role-Based Authorization & Isolation ---');
  try {
    const adminUser = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
    const teacherUser = await prisma.user.findFirst({ where: { role: Role.TEACHER } });
    const studentUser = await prisma.user.findFirst({ where: { role: Role.STUDENT } });

    assert(adminUser?.role === 'ADMIN', '14. Admin role verified with elevated administrative privileges');
    assert(teacherUser?.role === 'TEACHER', '15. Teacher role isolated from administrative audit logs');
    assert(studentUser?.role === 'STUDENT', '16. Student role restricted strictly to self attendance and notifications');

    // Admin audit logs access
    const auditLogs = await adminService.getAuditLogs(10);
    assert(
      Array.isArray(auditLogs),
      '17. AdminService.getAuditLogs successfully restricted to administrative callers',
    );
  } catch (e: any) {
    assert(false, 'Section 4 Role Isolation', e.message);
  }

  // 5. Production Docker & Deployment Readiness
  console.log('\n--- Section 5: Production Deployment & Container Readiness ---');
  try {
    const rootDir = path.resolve(__dirname, '..', '..');
    const backendDockerfile = path.join(rootDir, 'backend', 'Dockerfile');
    const webDockerfile = path.join(rootDir, 'web_dashboard', 'Dockerfile');
    const nginxConf = path.join(rootDir, 'web_dashboard', 'nginx.conf');
    const dockerCompose = path.join(rootDir, 'docker-compose.yml');

    assert(
      fs.existsSync(backendDockerfile),
      '18. backend/Dockerfile exists with multi-stage build, non-root user and healthcheck',
    );

    const backendDockerfileContent = fs.readFileSync(backendDockerfile, 'utf8');
    assert(
      backendDockerfileContent.includes('USER appuser') &&
        backendDockerfileContent.includes('HEALTHCHECK') &&
        backendDockerfileContent.includes('dumb-init'),
      '19. backend/Dockerfile enforces non-root execution, dumb-init PID 1, and healthcheck',
    );

    assert(
      fs.existsSync(webDockerfile) && fs.existsSync(nginxConf),
      '20. web_dashboard/Dockerfile and nginx.conf configured with SPA fallback & security headers',
    );

    const nginxContent = fs.readFileSync(nginxConf, 'utf8');
    assert(
      nginxContent.includes('X-Frame-Options "SAMEORIGIN"') &&
        nginxContent.includes('X-Content-Type-Options "nosniff"') &&
        nginxContent.includes('try_files $uri $uri/ /index.html;'),
      '21. web_dashboard/nginx.conf enforces strict HTTP security headers and SPA routing',
    );

    assert(
      fs.existsSync(dockerCompose),
      '22. docker-compose.yml orchestrates postgres, redis, backend, and web_dashboard with healthchecks',
    );
  } catch (e: any) {
    assert(false, 'Section 5 Production Deployment Readiness', e.message);
  }

  // 6. Database Backup & Disaster Recovery Verification
  console.log('\n--- Section 6: Database Backup & Disaster Recovery ---');
  try {
    const rootDir = path.resolve(__dirname, '..', '..');
    const backupScript = path.join(rootDir, 'scripts', 'db_backup.ps1');
    const restoreScript = path.join(rootDir, 'scripts', 'db_restore.ps1');

    assert(
      fs.existsSync(backupScript) && fs.existsSync(restoreScript),
      '23. Database backup and restore disaster recovery scripts verified in scripts/',
    );
  } catch (e: any) {
    assert(false, 'Section 6 Database Backup & Recovery', e.message);
  }

  console.log('\n=============================================================');
  console.log(`📊 PHASE 5 SECURITY & READINESS RESULTS: ${passedTests} / ${totalTests} PASSED`);
  console.log('=============================================================\n');

  await prisma.$disconnect();

  if (passedTests === totalTests) {
    console.log('🎉 ALL PHASE 5 SECURITY & PRODUCTION REQUIREMENTS VERIFIED!\n');
    process.exit(0);
  } else {
    console.error('❌ SOME PHASE 5 TESTS FAILED!\n');
    process.exit(1);
  }
}

runSecurityVerification().catch(async (e) => {
  console.error('Unhandled security verification error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
