/**
 * PHASE 2.3 INDEPENDENT AUDIT SCRIPT
 * Tests: Auth, Role-Based API calls, Notification persistence, Duplicate prevention, DB verification
 * All tests use actual HTTP requests + direct DB queries. No mocks.
 */

import { PrismaClient, Role, NotificationPriority } from '@prisma/client';
import * as http from 'http';
import { io, Socket } from 'socket.io-client';

const BASE_URL = 'http://localhost:3000/api/v1';
const prisma = new PrismaClient();

let passCount = 0;
let failCount = 0;
const results: { name: string; status: 'PASS' | 'FAIL'; detail: string }[] = [];

function pass(name: string, detail: string) {
  passCount++;
  results.push({ name, status: 'PASS', detail });
  console.log(`  [PASS] ${name}: ${detail}`);
}

function fail(name: string, detail: string) {
  failCount++;
  results.push({ name, status: 'FAIL', detail });
  console.error(`  [FAIL] ${name}: ${detail}`);
}

async function httpRequest(
  method: string,
  path: string,
  body?: object,
  token?: string,
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const jsonBody = body ? JSON.stringify(body) : undefined;
    const options: http.RequestOptions = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/v1${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(jsonBody ? { 'Content-Length': Buffer.byteLength(jsonBody).toString() } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode!, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode!, body: data });
        }
      });
    });

    req.on('error', reject);
    if (jsonBody) req.write(jsonBody);
    req.end();
  });
}

async function loginAs(email: string, password: string): Promise<string | null> {
  const res = await httpRequest('POST', '/auth/login', { email, password });
  if (res.status === 200 && res.body.accessToken) return res.body.accessToken;
  console.error(`    Login failed for ${email}: status=${res.status} body=${JSON.stringify(res.body).substring(0, 100)}`);
  return null;
}

async function main() {
  console.log('\n========================================');
  console.log('  PHASE 2.3 INDEPENDENT AUDIT');
  console.log('========================================\n');

  // ----- SECTION 1: DB & SCHEMA -----
  console.log('--- SECTION 1: Database Schema Verification ---');

  try {
    await prisma.$connect();
    pass('DB Connection', 'Connected to PostgreSQL college_attendance');
  } catch (e: any) {
    fail('DB Connection', e.message);
    process.exit(1);
  }

  // Verify NotificationPriority enum
  try {
    const enumResult = await prisma.$queryRaw<{ enumlabel: string }[]>`
      SELECT enumlabel FROM pg_enum
      JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
      WHERE pg_type.typname = 'NotificationPriority'
      ORDER BY enumsortorder
    `;
    const labels = enumResult.map((r) => r.enumlabel);
    if (labels.includes('URGENT') && labels.includes('NORMAL') && labels.includes('INFORMATIONAL')) {
      pass('NotificationPriority Enum', `DB values: [${labels.join(', ')}]`);
    } else {
      fail('NotificationPriority Enum', `Unexpected values: ${labels}`);
    }
  } catch (e: any) {
    fail('NotificationPriority Enum', e.message);
  }

  // Verify Notification columns
  try {
    const cols = await prisma.$queryRaw<{ column_name: string }[]>`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'Notification' ORDER BY ordinal_position
    `;
    const colNames = cols.map((c) => c.column_name);
    const required = ['id', 'userId', 'title', 'message', 'type', 'priority', 'isRead', 'readAt', 'senderId', 'data', 'createdAt'];
    const missing = required.filter((c) => !colNames.includes(c));
    if (missing.length === 0) {
      pass('Notification Table Columns', `All ${required.length} required columns present`);
    } else {
      fail('Notification Table Columns', `Missing: [${missing.join(', ')}]`);
    }
  } catch (e: any) {
    fail('Notification Table Columns', e.message);
  }

  // Verify indexes
  try {
    const indexes = await prisma.$queryRaw<{ indexname: string }[]>`
      SELECT indexname FROM pg_indexes WHERE tablename = 'Notification'
    `;
    const idxNames = indexes.map((i) => i.indexname);
    const requiredIdx = ['Notification_userId_isRead_idx', 'Notification_userId_createdAt_idx', 'Notification_priority_idx'];
    const missingIdx = requiredIdx.filter((i) => !idxNames.includes(i));
    if (missingIdx.length === 0) {
      pass('Notification Indexes', `All 3 compound indexes present`);
    } else {
      fail('Notification Indexes', `Missing: [${missingIdx.join(', ')}]`);
    }
  } catch (e: any) {
    fail('Notification Indexes', e.message);
  }

  // Migration drift audit
  try {
    const migrations = await prisma.$queryRaw<{ migration_name: string; applied_steps_count: number }[]>`
      SELECT migration_name, applied_steps_count FROM _prisma_migrations ORDER BY started_at
    `;
    const mig = migrations[0];
    // 0_init was baseline resolved (not run), and db push added Phase 2.3 columns outside migration system
    if (mig.applied_steps_count === 0) {
      fail(
        'Migration vs Schema Drift',
        `FINDING: 0_init has applied_steps_count=0 (baseline resolved). Phase 2.3 columns (priority, readAt, senderId, data) were added via "prisma db push" and are NOT recorded in any migration file. The 0_init migration SQL does not include NotificationPriority enum or new columns.`
      );
    } else {
      pass('Migration History', `${migrations.length} applied: ${migrations.map((m) => m.migration_name).join(', ')}`);
    }
  } catch (e: any) {
    fail('Migration History', e.message);
  }

  // Verify real DB records
  try {
    const notifs = await prisma.notification.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
    if (notifs.length > 0) {
      const sample = notifs[0];
      pass('DB Notification Records', `${notifs.length} records. Sample: title="${sample.title}", priority=${sample.priority}, isRead=${sample.isRead}, readAt=${sample.readAt?.toISOString() ?? 'null'}`);
    } else {
      fail('DB Notification Records', 'No notification records found');
    }
  } catch (e: any) {
    fail('DB Notification Records', e.message);
  }

  // ----- SECTION 2: AUTHENTICATION -----
  console.log('\n--- SECTION 2: Role Authentication ---');

  const studentUser = await prisma.user.findFirst({ where: { role: Role.STUDENT, isActive: true } });
  const teacherUser = await prisma.user.findFirst({ where: { role: Role.TEACHER, isActive: true } });
  const adminUser = await prisma.user.findFirst({ where: { role: Role.ADMIN, isActive: true } });

  if (!studentUser || !teacherUser || !adminUser) {
    fail('User Fixtures', `Missing: student=${!!studentUser} teacher=${!!teacherUser} admin=${!!adminUser}`);
    await prisma.$disconnect();
    process.exit(1);
  }
  pass('DB User Fixtures', `student=${studentUser.email} | teacher=${teacherUser.email} | admin=${adminUser.email}`);

  // Passwords from backend/prisma/seed.ts
  const ADMIN_PASSWORD = 'AdminSecure123!';
  const TEACHER_PASSWORD = 'TeacherSecure123!';
  const STUDENT_PASSWORD = 'StudentSecure123!';
  let studentToken = await loginAs(studentUser.email, STUDENT_PASSWORD);
  let teacherToken = await loginAs(teacherUser.email, TEACHER_PASSWORD);
  let adminToken = await loginAs(adminUser.email, ADMIN_PASSWORD);

  studentToken ? pass('Student Auth', `JWT issued for ${studentUser.email}`) : fail('Student Auth', `Login failed`);
  teacherToken ? pass('Teacher Auth', `JWT issued for ${teacherUser.email}`) : fail('Teacher Auth', `Login failed`);
  adminToken ? pass('Admin Auth', `JWT issued for ${adminUser.email}`) : fail('Admin Auth', `Login failed`);

  // ----- SECTION 3: NOTIFICATION API -----
  console.log('\n--- SECTION 3: Authenticated Notification API ---');

  if (studentToken) {
    const notifRes = await httpRequest('GET', '/notifications', undefined, studentToken);
    if (notifRes.status === 200 && Array.isArray(notifRes.body?.notifications)) {
      pass('GET /notifications', `${notifRes.body.notifications.length} items, unreadCount=${notifRes.body.unreadCount} (from DB)`);
    } else {
      fail('GET /notifications', `status=${notifRes.status}`);
    }

    const cntRes = await httpRequest('GET', '/notifications/unread-count', undefined, studentToken);
    if (cntRes.status === 200 && typeof cntRes.body?.unreadCount === 'number') {
      const dbUnread = await prisma.notification.count({ where: { userId: studentUser.id, isRead: false } });
      if (cntRes.body.unreadCount === dbUnread) {
        pass('GET /notifications/unread-count', `API=${cntRes.body.unreadCount} matches DB=${dbUnread} — NOT hardcoded`);
      } else {
        fail('GET /notifications/unread-count', `API=${cntRes.body.unreadCount} vs DB=${dbUnread} — MISMATCH`);
      }
    } else {
      fail('GET /notifications/unread-count', `status=${cntRes.status}`);
    }
  }

  // ----- SECTION 4: ROLE AUTHORIZATION -----
  console.log('\n--- SECTION 4: Role Authorization Enforcement ---');

  // Student blocked from announce
  if (studentToken) {
    const res = await httpRequest('POST', '/notifications/announce', {
      title: 'Audit: Student Announce Attempt', message: 'Should be blocked', target: 'ROLE', targetRole: 'STUDENT', priority: 'NORMAL',
    }, studentToken);
    res.status === 403 ? pass('Student Blocked from Announce', `403 Forbidden`) : fail('Student Blocked from Announce', `Got ${res.status}`);
  }

  // Teacher blocked from ALL broadcast
  if (teacherToken) {
    const res = await httpRequest('POST', '/notifications/announce', {
      title: 'Audit: Teacher ALL Broadcast', message: 'Should be blocked', target: 'ALL', priority: 'NORMAL',
    }, teacherToken);
    res.status === 403 ? pass('Teacher Blocked from ALL', `403 Forbidden`) : fail('Teacher Blocked from ALL', `Got ${res.status}`);

    // Teacher can announce to STUDENT role
    const res2 = await httpRequest('POST', '/notifications/announce', {
      title: 'Audit: Legitimate Teacher Announcement', message: 'Valid teacher-to-student announcement', target: 'ROLE', targetRole: 'STUDENT', priority: 'NORMAL', type: 'CLASS_ANNOUNCEMENT',
    }, teacherToken);
    (res2.status === 201 && res2.body?.success) ? pass('Teacher Announce to Students', `count=${res2.body.count}`) : fail('Teacher Announce to Students', `status=${res2.status} body=${JSON.stringify(res2.body).substring(0,100)}`);
  }

  // Admin ALL + URGENT
  if (adminToken) {
    const res = await httpRequest('POST', '/notifications/announce', {
      title: 'Audit: Admin Urgent Broadcast', message: 'Admin urgent audit test broadcast', target: 'ALL', priority: 'URGENT', type: 'CAMPUS_BROADCAST',
    }, adminToken);
    (res.status === 201 && res.body?.success) ? pass('Admin Urgent ALL Broadcast', `count=${res.body.count}`) : fail('Admin Urgent ALL Broadcast', `status=${res.status}`);
  }

  // ----- SECTION 5: PERSISTENCE VERIFICATION -----
  console.log('\n--- SECTION 5: Mark-as-Read Persistence ---');

  if (studentToken) {
    const notifRes = await httpRequest('GET', '/notifications?isRead=false&limit=1', undefined, studentToken);
    const unread = notifRes.body?.notifications ?? [];
    if (unread.length > 0) {
      const targetId = unread[0].id;
      const patchRes = await httpRequest('PATCH', `/notifications/${targetId}/read`, undefined, studentToken);
      if (patchRes.status === 200) {
        const dbNotif = await prisma.notification.findUnique({ where: { id: targetId } });
        if (dbNotif?.isRead === true && dbNotif.readAt instanceof Date) {
          pass('Mark-as-Read Persistence', `DB isRead=true, readAt=${dbNotif.readAt.toISOString()} — persisted`);
        } else {
          fail('Mark-as-Read Persistence', `API 200 but DB: isRead=${dbNotif?.isRead}, readAt=${dbNotif?.readAt}`);
        }
      } else {
        fail('Mark-as-Read Persistence', `PATCH returned ${patchRes.status}`);
      }
    } else {
      pass('Mark-as-Read Persistence', 'No unread notifications for student (all previously marked read)');
    }
  }

  // ----- SECTION 6: DUPLICATE PREVENTION -----
  console.log('\n--- SECTION 6: Duplicate Prevention ---');

  if (adminToken) {
    const payload = {
      title: 'AUDIT-DUP: Deduplication Test',
      message: 'Exact duplicate sent within 30 seconds — should trigger dedup',
      target: 'ROLE',
      targetRole: 'ADMIN',
      priority: 'INFORMATIONAL',
    };
    const first = await httpRequest('POST', '/notifications/announce', payload, adminToken);
    const second = await httpRequest('POST', '/notifications/announce', payload, adminToken);

    if (first.status === 201 && second.status === 201 && second.body?.deduplicated === true) {
      pass('Duplicate Prevention', `1st: created (count=${first.body.count}). 2nd: deduplicated=true`);
    } else if (first.status === 201 && second.status === 409) {
      pass('Duplicate Prevention', `1st: 201. 2nd: 409 Conflict`);
    } else {
      fail('Duplicate Prevention', `1st: ${first.status}/${JSON.stringify(first.body).substring(0,50)}, 2nd: ${second.status}/${JSON.stringify(second.body).substring(0,50)}`);
    }
  }

  // ----- SECTION 7: AUDIT LOGS -----
  console.log('\n--- SECTION 7: Audit Log Verification ---');

  try {
    const auditLogs = await prisma.attendanceAuditLog.findMany({
      where: { action: 'ANNOUNCEMENT_BROADCAST' },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    if (auditLogs.length > 0) {
      const logData = JSON.parse(auditLogs[0].newValue ?? '{}');
      pass('Audit Logs Exist', `${auditLogs.length} ANNOUNCEMENT_BROADCAST logs in DB`);
      (logData.priority && logData.recipientCount !== undefined)
        ? pass('Audit Log Data', `priority=${logData.priority}, recipients=${logData.recipientCount}, target=${logData.target}`)
        : fail('Audit Log Data', `Missing fields: ${JSON.stringify(logData)}`);
    } else {
      fail('Audit Logs Exist', 'No ANNOUNCEMENT_BROADCAST audit logs found in DB');
    }
  } catch (e: any) {
    fail('Audit Logs', e.message);
  }

  // ----- SECTION 8: UNAUTHENTICATED ACCESS -----
  console.log('\n--- SECTION 8: Unauthenticated Access Rejection ---');

  const noAuthGet = await httpRequest('GET', '/notifications');
  noAuthGet.status === 401 ? pass('GET /notifications (no token)', '401 Unauthorized') : fail('GET /notifications (no token)', `Got ${noAuthGet.status}`);

  const noAuthPost = await httpRequest('POST', '/notifications/announce', { title: 'X', message: 'X', target: 'ALL', priority: 'NORMAL' });
  noAuthPost.status === 401 ? pass('POST /notifications/announce (no token)', '401 Unauthorized') : fail('POST /notifications/announce (no token)', `Got ${noAuthPost.status}`);

  // ----- SECTION 9: CROSS-USER ISOLATION -----
  console.log('\n--- SECTION 9: Cross-User Data Isolation ---');

  if (studentToken && adminUser) {
    const adminNotif = await prisma.notification.findFirst({ where: { userId: adminUser.id } });
    if (adminNotif) {
      const res = await httpRequest('PATCH', `/notifications/${adminNotif.id}/read`, undefined, studentToken);
      res.status === 403
        ? pass('Cross-User Isolation', `Student cannot mark Admin notification read — 403 Forbidden`)
        : fail('Cross-User Isolation', `Expected 403, got ${res.status} — SECURITY VULNERABILITY`);
    } else {
      pass('Cross-User Isolation', 'No admin notification found to test (skipped)');
    }
  }

  // ----- SECTION 10: WEBSOCKET REAL-TIME DELIVERY & AUTHORIZATION -----
  console.log('\n--- SECTION 10: WebSocket Delivery & Room Authorization ---');

  const WS_URL = 'http://localhost:3000';
  let studentSocket: Socket | null = null;
  let teacherSocket: Socket | null = null;
  let adminSocket: Socket | null = null;

  try {
    studentSocket = io(WS_URL, { transports: ['websocket'], autoConnect: true });
    teacherSocket = io(WS_URL, { transports: ['websocket'], autoConnect: true });
    adminSocket = io(WS_URL, { transports: ['websocket'], autoConnect: true });

    await Promise.all([
      new Promise<void>((resolve, reject) => {
        studentSocket!.on('connect', () => resolve());
        studentSocket!.on('connect_error', reject);
        setTimeout(() => reject(new Error('Student WS timeout')), 4000);
      }),
      new Promise<void>((resolve, reject) => {
        teacherSocket!.on('connect', () => resolve());
        teacherSocket!.on('connect_error', reject);
        setTimeout(() => reject(new Error('Teacher WS timeout')), 4000);
      }),
      new Promise<void>((resolve, reject) => {
        adminSocket!.on('connect', () => resolve());
        adminSocket!.on('connect_error', reject);
        setTimeout(() => reject(new Error('Admin WS timeout')), 4000);
      }),
    ]);

    pass('WebSocket Connection', 'Student, Teacher, and Admin connected to Socket.IO gateway');

    // Join proper rooms
    studentSocket.emit('join_user', studentUser.id);
    studentSocket.emit('join_role', 'STUDENT');
    teacherSocket.emit('join_user', teacherUser.id);
    teacherSocket.emit('join_role', 'TEACHER');
    adminSocket.emit('join_user', adminUser.id);
    adminSocket.emit('join_role', 'ADMIN');

    await new Promise((r) => setTimeout(r, 500));

    // Test 10.1: Global Announcement WebSocket Delivery
    const globalPromiseStudent = new Promise<any>((resolve) => {
      studentSocket!.once('global_announcement', resolve);
    });
    const globalPromiseTeacher = new Promise<any>((resolve) => {
      teacherSocket!.once('global_announcement', resolve);
    });

    if (adminToken) {
      await httpRequest('POST', '/notifications/announce', {
        title: 'Audit WS: Global Campus Alert',
        message: 'Real-time WebSocket global delivery test',
        target: 'ALL',
        priority: 'URGENT',
        type: 'CAMPUS_BROADCAST',
      }, adminToken);
    }

    const [globalStudentEvt, globalTeacherEvt] = await Promise.all([
      Promise.race([globalPromiseStudent, new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout')), 3000))]),
      Promise.race([globalPromiseTeacher, new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout')), 3000))]),
    ]);

    if (globalStudentEvt && globalTeacherEvt) {
      pass('WebSocket Global Delivery', `Received by Student ("${globalStudentEvt.title}") and Teacher ("${globalTeacherEvt.title}")`);
    } else {
      fail('WebSocket Global Delivery', 'Global announcement not received by all roles');
    }

    // Test 10.2: Role-based Announcement WebSocket Delivery
    const rolePromiseStudent = new Promise<any>((resolve) => {
      studentSocket!.once('role_announcement', resolve);
    });
    let teacherReceivedStudentRoleEvt = false;
    teacherSocket.once('role_announcement', () => {
      teacherReceivedStudentRoleEvt = true;
    });

    if (teacherToken) {
      await httpRequest('POST', '/notifications/announce', {
        title: 'Audit WS: Student-Only Announcement',
        message: 'Real-time WebSocket role delivery test',
        target: 'ROLE',
        targetRole: 'STUDENT',
        priority: 'NORMAL',
        type: 'CLASS_ANNOUNCEMENT',
      }, teacherToken);
    }

    const roleStudentEvt = await Promise.race([
      rolePromiseStudent,
      new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout')), 3000)),
    ]);

    await new Promise((r) => setTimeout(r, 500));

    if (roleStudentEvt && !teacherReceivedStudentRoleEvt) {
      pass('WebSocket Role Delivery', `Student received role announcement; Teacher correctly did NOT receive it`);
    } else {
      fail('WebSocket Role Delivery', `Student=${!!roleStudentEvt}, TeacherLeak=${teacherReceivedStudentRoleEvt}`);
    }

    // Test 10.3: Gateway Authentication Audit (Can client connect WITHOUT token?)
    // In EventsGateway, no JWT guard or token validation is implemented
    const unauthSocket = io(WS_URL, { transports: ['websocket'], autoConnect: true });
    let unauthConnected = false;
    await new Promise<void>((resolve) => {
      unauthSocket.on('connect', () => {
        unauthConnected = true;
        resolve();
      });
      unauthSocket.on('connect_error', () => resolve());
      setTimeout(() => resolve(), 2000);
    });
    unauthSocket.disconnect();

    if (unauthConnected) {
      fail('WebSocket JWT Auth Enforcement', 'DEFECT: EventsGateway accepts connections without JWT authentication. No WsGuard or handshake auth validation exists.');
    } else {
      pass('WebSocket JWT Auth Enforcement', 'Unauthenticated WebSocket connection rejected');
    }

    // Test 10.4: Room Authorization Audit (Can Student join role_ADMIN?)
    let studentReceivedAdminBroadcast = false;
    studentSocket.emit('join_role', 'ADMIN'); // Malicious student attempting to join role_ADMIN
    studentSocket.once('role_announcement', (data) => {
      if (data.title?.includes('Admin Confidential')) {
        studentReceivedAdminBroadcast = true;
      }
    });

    await new Promise((r) => setTimeout(r, 500));

    if (adminToken) {
      await httpRequest('POST', '/notifications/announce', {
        title: 'Audit WS: Admin Confidential Alert',
        message: 'Admin room test',
        target: 'ROLE',
        targetRole: 'ADMIN',
        priority: 'NORMAL',
        type: 'SYSTEM',
      }, adminToken);
    }

    await new Promise((r) => setTimeout(r, 1000));

    if (studentReceivedAdminBroadcast) {
      fail('WebSocket Room Authorization', 'DEFECT: Student successfully joined "role_ADMIN" and received Admin announcements. Room subscriptions are NOT authorized.');
    } else {
      pass('WebSocket Room Authorization', 'Student blocked from joining role_ADMIN');
    }

  } catch (e: any) {
    fail('WebSocket Delivery', e.message);
  } finally {
    if (studentSocket) studentSocket.disconnect();
    if (teacherSocket) teacherSocket.disconnect();
    if (adminSocket) adminSocket.disconnect();
  }

  // ----- FINAL SUMMARY -----
  console.log('\n========================================');
  console.log(`  AUDIT COMPLETE: ${passCount} PASSED / ${failCount} FAILED`);
  console.log('========================================');

  if (failCount > 0) {
    console.log('\nFailed checks:');
    results.filter((r) => r.status === 'FAIL').forEach((r) => console.log(`  • [FAIL] ${r.name}: ${r.detail}`));
  }

  await prisma.$disconnect();
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch((e) => { console.error('Fatal:', e); process.exit(1); });
