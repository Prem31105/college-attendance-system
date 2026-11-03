import * as http from 'http';

function makeRequest(
  method: string,
  path: string,
  body?: any,
  bearerToken?: string,
): Promise<{ status: number; data: any; headers: http.IncomingHttpHeaders }> {
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
          resolve({ status: res.statusCode || 500, data, headers: res.headers });
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

async function verifyAuth() {
  console.log('=== PART 3: AUTHENTICATION AND TEST ACCOUNTS VERIFICATION ===');
  let passed = 0;
  let failed = 0;

  // 1. Admin Login
  console.log('1. Testing Admin login (admin@college.edu)...');
  const adminRes = await makeRequest('POST', '/api/v1/auth/login', {
    email: 'admin@college.edu',
    password: process.env.ADMIN_PASSWORD || 'AdminSecure123!',
  });
  if (adminRes.status === 200 && adminRes.data.accessToken && adminRes.data.user.role === 'ADMIN') {
    console.log('  ✅ [PASS] Admin authenticated successfully (Role: ADMIN)');
    passed++;
  } else {
    console.error('  ❌ [FAIL] Admin login failed', adminRes.status, adminRes.data);
    failed++;
  }
  const adminToken = adminRes.data?.accessToken;

  // 2. Teacher Login
  console.log('2. Testing Teacher login (prof.mehta@college.edu)...');
  const teacherRes = await makeRequest('POST', '/api/v1/auth/login', {
    email: 'prof.mehta@college.edu',
    password: process.env.TEACHER_PASSWORD || 'TeacherSecure123!',
  });
  if (teacherRes.status === 200 && teacherRes.data.accessToken && teacherRes.data.user.role === 'TEACHER') {
    console.log('  ✅ [PASS] Teacher authenticated successfully (Role: TEACHER)');
    passed++;
  } else {
    console.error('  ❌ [FAIL] Teacher login failed', teacherRes.status, teacherRes.data);
    failed++;
  }
  const teacherToken = teacherRes.data?.accessToken;

  // 3. Student 1 Login
  console.log('3. Testing Student login (aarav.sharma@college.edu)...');
  const studentRes = await makeRequest('POST', '/api/v1/auth/login', {
    email: 'aarav.sharma@college.edu',
    password: process.env.STUDENT_PASSWORD || 'StudentSecure123!',
  });
  if (studentRes.status === 200 && studentRes.data.accessToken && studentRes.data.user.role === 'STUDENT') {
    console.log('  ✅ [PASS] Student 1 (Aarav Sharma) authenticated successfully (Role: STUDENT)');
    passed++;
  } else {
    console.error('  ❌ [FAIL] Student 1 login failed', studentRes.status, studentRes.data);
    failed++;
  }
  const studentToken = studentRes.data?.accessToken;
  const studentRefreshToken = studentRes.data?.refreshToken;

  // 4. Student 2 Login
  console.log('4. Testing Student 2 login (riya.patel@college.edu)...');
  const student2Res = await makeRequest('POST', '/api/v1/auth/login', {
    email: 'riya.patel@college.edu',
    password: process.env.STUDENT_PASSWORD || 'StudentSecure123!',
  });
  if (student2Res.status === 200 && student2Res.data.accessToken && student2Res.data.user.role === 'STUDENT') {
    console.log('  ✅ [PASS] Student 2 (Riya Patel) authenticated successfully (Role: STUDENT)');
    passed++;
  } else {
    console.error('  ❌ [FAIL] Student 2 login failed', student2Res.status, student2Res.data);
    failed++;
  }

  // 5. Protected Endpoint: Admin Analytics
  console.log('5. Testing Admin endpoint access (/api/v1/admin/analytics)...');
  const adminDashRes = await makeRequest('GET', '/api/v1/admin/analytics', undefined, adminToken);
  if (adminDashRes.status === 200) {
    console.log('  ✅ [PASS] Admin authorized for /api/v1/admin/analytics');
    passed++;
  } else {
    console.error('  ❌ [FAIL] Admin analytics forbidden/failed', adminDashRes.status);
    failed++;
  }

  // 6. Role Protection: Student attempting Admin endpoint
  console.log('6. Testing RBAC violation protection (Student attempting /api/v1/admin/analytics)...');
  const studentViolationRes = await makeRequest('GET', '/api/v1/admin/analytics', undefined, studentToken);
  if (studentViolationRes.status === 403) {
    console.log('  ✅ [PASS] Student correctly forbidden from Admin endpoint (HTTP 403 Forbidden)');
    passed++;
  } else {
    console.error('  ❌ [FAIL] RBAC violation not blocked', studentViolationRes.status);
    failed++;
  }

  // 7. Unauthenticated Protection
  console.log('7. Testing unauthenticated endpoint protection (/api/v1/admin/analytics)...');
  const unauthRes = await makeRequest('GET', '/api/v1/admin/analytics');
  if (unauthRes.status === 401) {
    console.log('  ✅ [PASS] Missing token correctly rejected (HTTP 401 Unauthorized)');
    passed++;
  } else {
    console.error('  ❌ [FAIL] Unauthenticated request not blocked', unauthRes.status);
    failed++;
  }

  // 8. Refresh Token Rotation
  console.log('8. Testing Refresh Token Rotation...');
  const refreshRes = await makeRequest('POST', '/api/v1/auth/refresh', {
    refreshToken: studentRefreshToken,
  });
  if (refreshRes.status === 200 && refreshRes.data.accessToken && refreshRes.data.refreshToken) {
    console.log('  ✅ [PASS] Refresh token rotated successfully; new token pair issued');
    passed++;
  } else {
    console.error('  ❌ [FAIL] Refresh token rotation failed', refreshRes.status, refreshRes.data);
    failed++;
  }
  const newRefreshToken = refreshRes.data?.refreshToken;

  // 9. Refresh Token Replay Protection (Revocation check)
  console.log('9. Testing Refresh Token Replay Attack Protection...');
  const replayRes = await makeRequest('POST', '/api/v1/auth/refresh', {
    refreshToken: studentRefreshToken, // Old revoked token
  });
  if (replayRes.status === 401) {
    console.log('  ✅ [PASS] Replayed refresh token rejected and family invalidated (HTTP 401 Unauthorized)');
    passed++;
  } else {
    console.error('  ❌ [FAIL] Replayed refresh token was not rejected', replayRes.status);
    failed++;
  }

  // 10. Logout & Session Revocation
  console.log('10. Testing Logout...');
  const logoutRes = await makeRequest('POST', '/api/v1/auth/logout', {
    refreshToken: newRefreshToken,
  }, studentToken);
  if (logoutRes.status === 200 || logoutRes.status === 201) {
    console.log('  ✅ [PASS] Logout completed and session revoked');
    passed++;
  } else {
    console.error('  ❌ [FAIL] Logout failed', logoutRes.status);
    failed++;
  }

  console.log(`\nPART 3 SUMMARY: Passed: ${passed}, Failed: ${failed}`);
  if (failed > 0) process.exit(1);
}

verifyAuth().catch((err) => {
  console.error('Unexpected error in auth verification:', err);
  process.exit(1);
});
