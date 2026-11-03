import * as http from 'http';

function makeRequest(
  method: string,
  path: string,
  body?: any,
  bearerToken?: string,
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (bearerToken) {
      headers['Authorization'] = `Bearer ${bearerToken}`;
    }
    if (postData) {
      headers['Content-Length'] = Buffer.byteLength(postData).toString();
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path,
        method,
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let data = null;
          try {
            data = JSON.parse(raw);
          } catch (_) {
            data = raw;
          }
          resolve({ status: res.statusCode || 500, data });
        });
      },
    );

    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function verifyDashboards() {
  console.log('=== PARTS 4, 7, 8: TEACHER & ADMIN DASHBOARDS LIVE API VERIFICATION ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name}${detail ? ` -> ${detail}` : ''}`);
      failed++;
    }
  }

  // 1. Teacher Authentication
  const teacherLogin = await makeRequest('POST', '/api/v1/auth/login', {
    email: 'prof.mehta@college.edu',
    password: process.env.TEACHER_PASSWORD || 'TeacherSecure123!',
  });
  assert(teacherLogin.status === 200, '1. Teacher login verified', JSON.stringify(teacherLogin.data));
  const teacherToken = teacherLogin.data.accessToken;

  // 2. Teacher Classrooms List
  const classroomsRes = await makeRequest('GET', '/api/v1/sessions/classrooms/all', undefined, teacherToken);
  assert(classroomsRes.status === 200 && Array.isArray(classroomsRes.data), '2. Teacher classrooms list retrieved');
  const room = classroomsRes.data.find((c: any) => c.name === 'Room 401') || classroomsRes.data[0];

  // 3. Admin Authentication
  const adminLogin = await makeRequest('POST', '/api/v1/auth/login', {
    email: 'admin@college.edu',
    password: process.env.ADMIN_PASSWORD || 'AdminSecure123!',
  });
  assert(adminLogin.status === 200, '3. Admin login verified');
  const adminToken = adminLogin.data.accessToken;

  // 4. Admin Analytics
  const analyticsRes = await makeRequest('GET', '/api/v1/admin/analytics', undefined, adminToken);
  assert(
    analyticsRes.status === 200 && typeof analyticsRes.data.totalStudents === 'number',
    '4. Admin analytics retrieved successfully',
    JSON.stringify(analyticsRes.data),
  );

  // 5. Admin Classrooms
  const adminClassroomsRes = await makeRequest('GET', '/api/v1/admin/classrooms', undefined, adminToken);
  assert(adminClassroomsRes.status === 200 && Array.isArray(adminClassroomsRes.data), '5. Admin classrooms retrieved');

  // 6. Admin Suspicious Incidents Queue
  const suspiciousRes = await makeRequest('GET', '/api/v1/admin/suspicious', undefined, adminToken);
  assert(suspiciousRes.status === 200 && Array.isArray(suspiciousRes.data), '6. Admin suspicious incidents queue retrieved');

  // 7. Admin Audit Logs
  const auditLogsRes = await makeRequest('GET', '/api/v1/admin/audit-logs', undefined, adminToken);
  assert(auditLogsRes.status === 200 && Array.isArray(auditLogsRes.data), '7. Admin immutable audit logs retrieved');

  // 8. Admin Compliance CSV Export
  const complianceCsvRes = await makeRequest('GET', '/api/v1/reports/export/csv', undefined, adminToken);
  assert(
    complianceCsvRes.status === 200 && typeof complianceCsvRes.data === 'string' && complianceCsvRes.data.includes('Roll Number') && complianceCsvRes.data.includes('Student Name'),
    '8. Admin compliance CSV report generated',
    `Status: ${complianceCsvRes.status}, data: ${String(complianceCsvRes.data).slice(0, 100)}`,
  );

  // 9. Admin Shortage CSV Export
  const shortageCsvRes = await makeRequest('GET', '/api/v1/reports/export/shortage/csv', undefined, adminToken);
  assert(
    shortageCsvRes.status === 200 && typeof shortageCsvRes.data === 'string' && shortageCsvRes.data.includes('Roll Number'),
    '9. Admin shortage CSV report generated',
    `Status: ${shortageCsvRes.status}, data: ${String(shortageCsvRes.data).slice(0, 100)}`,
  );

  // 10. Student Attendance Guider
  const studentLogin = await makeRequest('POST', '/api/v1/auth/login', {
    email: 'aarav.sharma@college.edu',
    password: process.env.STUDENT_PASSWORD || 'StudentSecure123!',
  });
  assert(studentLogin.status === 200, '10. Student (Aarav Sharma) login verified');
  const studentToken = studentLogin.data.accessToken;

  const guiderRes = await makeRequest('GET', '/api/v1/reports/guider?target=75.0', undefined, studentToken);
  assert(
    guiderRes.status === 200 && guiderRes.data.student && guiderRes.data.student.name === 'Aarav Sharma',
    '11. Student Attendance Guider returned realistic Aarav Sharma identity',
    JSON.stringify(guiderRes.data?.student),
  );

  // 12. Student Notifications
  const notifsRes = await makeRequest('GET', '/api/v1/notifications', undefined, studentToken);
  assert(notifsRes.status === 200 && Array.isArray(notifsRes.data?.notifications), '12. Student notifications retrieved');

  console.log(`\n=============================================================`);
  console.log(`📊 LIVE DASHBOARDS VERIFICATION: ${passed}/${passed + failed} PASSED`);
  console.log(`=============================================================\n`);

  if (failed > 0) process.exit(1);
}

verifyDashboards().catch((e) => {
  console.error('Fatal error in dashboards verification:', e);
  process.exit(1);
});
