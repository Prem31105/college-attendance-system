import { PrismaClient, SessionStatus, AttendanceStatus, DisputeStatus } from '@prisma/client';

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:3000/api/v1';

async function loginUser(email: string, pass: string): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pass }),
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.accessToken;
}

async function run() {
  console.log('================================================================');
  console.log('   PHASE 7 VERIFICATION: TWO-WAY ATTENDANCE DISPUTES & CONSISTENCY');
  console.log('================================================================\n');

  try {
    // -------------------------------------------------------------
    // STEP 1: Verify Fictional College Identities & Teachers
    // -------------------------------------------------------------
    console.log('[STEP 1] Verifying Database Faculty Members...');
    const teachers = await prisma.teacher.findMany({
      include: {
        user: true,
        assignments: { include: { subject: true } },
      },
    });

    console.log(`Found ${teachers.length} faculty members:`);
    for (const t of teachers) {
      const subs = t.assignments.map((a) => a.subject.code).join(', ');
      console.log(`  - Prof. ${t.user.firstName} ${t.user.lastName} (${t.user.email}) [${t.employeeId}] Assigned: ${subs || 'None'}`);
    }

    if (teachers.length < 3) {
      throw new Error(`Expected at least 3 teachers, found ${teachers.length}`);
    }

    // Verify Student Aarav Sharma
    const aaravUser = await prisma.user.findUnique({
      where: { email: 'aarav.sharma@college.edu' },
      include: { student: true },
    });
    if (!aaravUser || !aaravUser.student) {
      throw new Error('Student Aarav Sharma not found');
    }
    const student = aaravUser.student;
    console.log(`Verified Student: ${aaravUser.firstName} ${aaravUser.lastName} (Roll: ${student.rollNumber})\n`);

    // -------------------------------------------------------------
    // STEP 2: Ensure Closed Session for Dispute Testing
    // -------------------------------------------------------------
    console.log('[STEP 2] Setting up Closed Session for CS601 (Prof. Rahul Mehta)...');
    const mehtaTeacher = teachers.find((t) => t.user.email === 'prof.mehta@college.edu');
    if (!mehtaTeacher) throw new Error('Prof. Rahul Mehta not found');

    const cs601 = await prisma.subject.findUnique({ where: { code: 'CS601' } });
    const room401 = await prisma.classroom.findFirst({ where: { name: 'Room 401' } });
    if (!cs601 || !room401) throw new Error('CS601 or Room 401 not found');

    // Create or find a closed session for CS601 where Aarav does not have a verified record
    let disputeSession = await prisma.attendanceSession.findFirst({
      where: {
        subjectId: cs601.id,
        teacherId: mehtaTeacher.id,
        status: SessionStatus.CLOSED,
      },
      include: { records: { where: { studentId: student.id } } },
    });

    if (!disputeSession) {
      disputeSession = await prisma.attendanceSession.create({
        data: {
          subjectId: cs601.id,
          classroomId: room401.id,
          teacherId: mehtaTeacher.id,
          sectionId: student.sectionId,
          status: SessionStatus.CLOSED,
          startTime: new Date(Date.now() - 3600000 * 2),
          endTime: new Date(Date.now() - 3600000),
          geofenceRadiusMeters: 75.0,
        },
        include: { records: { where: { studentId: student.id } } },
      });
      console.log(`Created closed session: ${disputeSession.id}`);
    } else {
      console.log(`Using existing closed session: ${disputeSession.id}`);
    }

    // Ensure Aarav does not have a VERIFIED record in this session initially, or clean previous dispute for fresh test
    await prisma.attendanceDispute.deleteMany({
      where: { sessionId: disputeSession.id, studentId: student.id },
    });
    await prisma.attendanceRecord.deleteMany({
      where: { sessionId: disputeSession.id, studentId: student.id },
    });
    console.log(`Ensured student is marked ABSENT (no record) for session ${disputeSession.id}.\n`);

    // -------------------------------------------------------------
    // STEP 3: Student Checks Attendance History
    // -------------------------------------------------------------
    console.log('[STEP 3] Student queries Attendance History via API...');
    const studentToken = await loginUser('aarav.sharma@college.edu', 'StudentSecure123!');
    const historyRes = await fetch(`${API_BASE}/attendance/student/history`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (!historyRes.ok) {
      throw new Error(`Failed to fetch history: ${historyRes.status} ${await historyRes.text()}`);
    }
    const historyData = await historyRes.json();
    console.log(`Attendance History returned ${historyData.length} records.`);
    const targetSessionHistory = historyData.find((h: any) => h.sessionId === disputeSession!.id);
    if (!targetSessionHistory) {
      throw new Error('Target closed session not found in student history');
    }
    console.log(`Target Session Status: ${targetSessionHistory.status} (Teacher: ${targetSessionHistory.teacherName})\n`);

    // -------------------------------------------------------------
    // STEP 4: Student Submits Attendance Dispute
    // -------------------------------------------------------------
    console.log('[STEP 4] Student files dispute for marked ABSENT...');
    const disputeReason = "Prof. Mehta, I was physically present in Room 401 during the lecture. My phone battery died while scanning the QR code. Kindly verify my attendance.";
    const createDisputeRes = await fetch(`${API_BASE}/disputes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        sessionId: disputeSession.id,
        reason: disputeReason,
      }),
    });

    if (createDisputeRes.status !== 201) {
      throw new Error(`Failed to create dispute: ${createDisputeRes.status} ${await createDisputeRes.text()}`);
    }
    const dispute = await createDisputeRes.json();
    console.log(`✅ Dispute created successfully! ID: ${dispute.id}, Status: ${dispute.status}`);

    // Verify initial message was persisted
    if (!dispute.messages || dispute.messages.length === 0) {
      throw new Error('Initial dispute message was not recorded');
    }
    console.log(`   Initial message: "${dispute.messages[0].message}"`);

    // Verify teacher notification was created in database
    const teacherNotif = await prisma.notification.findFirst({
      where: {
        userId: mehtaTeacher.userId,
        title: 'New Attendance Dispute Received',
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!teacherNotif) {
      throw new Error('Notification for teacher was not created');
    }
    console.log(`✅ Teacher notification verified: "${teacherNotif.title}" -> "${teacherNotif.message}"\n`);

    // -------------------------------------------------------------
    // STEP 5: Teacher Views Disputes & Sets Under Review
    // -------------------------------------------------------------
    console.log('[STEP 5] Teacher (Prof. Rahul Mehta) reviews dispute...');
    const teacherToken = await loginUser('prof.mehta@college.edu', 'TeacherSecure123!');
    const teacherDisputesRes = await fetch(`${API_BASE}/disputes/teacher`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    if (!teacherDisputesRes.ok) {
      throw new Error(`Failed to get teacher disputes: ${teacherDisputesRes.status}`);
    }
    const teacherDisputes = await teacherDisputesRes.json();
    const foundDispute = teacherDisputes.find((d: any) => d.id === dispute.id);
    if (!foundDispute) {
      throw new Error('Dispute not visible in teacher inbox');
    }
    console.log(`✅ Teacher retrieved dispute from student: ${foundDispute.student.user.firstName} ${foundDispute.student.user.lastName} (Roll: ${foundDispute.student.rollNumber})`);

    // Update status to UNDER_REVIEW
    const updateStatusRes = await fetch(`${API_BASE}/disputes/${dispute.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({ status: DisputeStatus.UNDER_REVIEW }),
    });
    if (!updateStatusRes.ok) {
      throw new Error(`Failed to update status: ${updateStatusRes.status}`);
    }
    console.log('✅ Dispute status updated to UNDER_REVIEW');

    // -------------------------------------------------------------
    // STEP 6: Two-Way Messaging Between Teacher and Student
    // -------------------------------------------------------------
    console.log('\n[STEP 6] Testing Two-Way Messaging...');
    // Teacher sends reply
    const teacherMsgText = "Aarav, please confirm which row and bench you were seated in during the CS601 lecture.";
    const teacherMsgRes = await fetch(`${API_BASE}/disputes/${dispute.id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({ message: teacherMsgText }),
    });
    if (teacherMsgRes.status !== 201) {
      throw new Error(`Teacher failed to send message: ${teacherMsgRes.status}`);
    }
    console.log(`✅ Teacher sent reply: "${teacherMsgText}"`);

    // Student sends follow-up
    const studentReplyText = "I was sitting in row 2 near the projector, right beside Riya Patel.";
    const studentMsgRes = await fetch(`${API_BASE}/disputes/${dispute.id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ message: studentReplyText }),
    });
    if (studentMsgRes.status !== 201) {
      throw new Error(`Student failed to send message: ${studentMsgRes.status}`);
    }
    console.log(`✅ Student responded: "${studentReplyText}"`);

    // Verify conversation history
    const conversationRes = await fetch(`${API_BASE}/disputes/${dispute.id}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const convData = await conversationRes.json();
    console.log(`✅ Conversation verified with ${convData.messages.length} messages in PostgreSQL thread.`);

    // -------------------------------------------------------------
    // STEP 7: Teacher Approves Dispute & Updates Attendance
    // -------------------------------------------------------------
    console.log('\n[STEP 7] Teacher Approves Attendance Dispute...');
    const resolutionNote = "Verified with row 2 seating record and peer confirmation with Riya Patel. Attendance corrected.";
    const approveRes = await fetch(`${API_BASE}/disputes/${dispute.id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({ resolutionNote }),
    });
    if (!approveRes.ok) {
      throw new Error(`Failed to approve dispute: ${approveRes.status} ${await approveRes.text()}`);
    }
    const resolvedData = await approveRes.json();
    const resolvedDispute = resolvedData.dispute || resolvedData;
    console.log(`✅ Dispute RESOLVED! Status: ${resolvedDispute.status}, Note: "${resolvedDispute.resolutionNote}"`);

    // Verify AttendanceRecord in database
    const updatedRecord = await prisma.attendanceRecord.findFirst({
      where: { sessionId: disputeSession.id, studentId: student.id },
    });
    if (!updatedRecord || updatedRecord.status !== AttendanceStatus.VERIFIED) {
      throw new Error(`AttendanceRecord status is not VERIFIED: ${updatedRecord?.status}`);
    }
    if (updatedRecord.verificationLayerMask !== 64) {
      throw new Error(`Expected verificationLayerMask 64 (Dispute Correction), got ${updatedRecord.verificationLayerMask}`);
    }
    console.log(`✅ AttendanceRecord verified: Status: ${updatedRecord.status}, Bitmask: ${updatedRecord.verificationLayerMask}`);

    // Verify Immutable Audit Log
    const auditLog = await prisma.attendanceAuditLog.findFirst({
      where: {
        entityId: updatedRecord.id,
        action: 'DISPUTE_ATTENDANCE_CORRECTION_APPROVED',
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!auditLog) {
      throw new Error('AttendanceAuditLog entry for dispute approval was not found');
    }
    console.log(`✅ Immutable Audit Log verified! Action: ${auditLog.action}, Actor: ${auditLog.actorId}`);

    // Verify Student Notification
    const studentNotif = await prisma.notification.findFirst({
      where: {
        userId: aaravUser.id,
        title: { contains: 'Attendance Dispute Approved' },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!studentNotif) {
      throw new Error('Student resolution notification not found');
    }
    console.log(`✅ Student notification verified: "${studentNotif.title}" -> "${studentNotif.message}"`);

    // -------------------------------------------------------------
    // STEP 8: Test Edge Cases (Duplicate, Rejection, RBAC)
    // -------------------------------------------------------------
    console.log('\n[STEP 8] Testing Edge Cases & Security...');

    // 8a. Duplicate dispute prevention
    console.log('  Testing duplicate dispute prevention (HTTP 409)...');
    const dupRes = await fetch(`${API_BASE}/disputes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        sessionId: disputeSession.id,
        reason: 'Attempting to file another dispute for the same session.',
      }),
    });
    if (dupRes.status === 409) {
      console.log('  ✅ Duplicate dispute successfully rejected with 409 Conflict!');
    } else {
      throw new Error(`Expected 409 Conflict for duplicate dispute, got ${dupRes.status}`);
    }

    // 8b. Rejection Workflow
    console.log('  Testing Dispute Rejection Workflow with Mandatory Justification...');
    const kulkarniTeacher = teachers.find((t) => t.user.email === 'prof.kulkarni@college.edu');
    const cs602 = await prisma.subject.findUnique({ where: { code: 'CS602' } });
    if (!kulkarniTeacher || !cs602) throw new Error('Prof. Kulkarni or CS602 not found');

    let session2 = await prisma.attendanceSession.findFirst({
      where: { subjectId: cs602.id, teacherId: kulkarniTeacher.id, status: SessionStatus.CLOSED },
    });
    if (!session2) {
      session2 = await prisma.attendanceSession.create({
        data: {
          subjectId: cs602.id,
          classroomId: room401.id,
          teacherId: kulkarniTeacher.id,
          sectionId: student.sectionId,
          status: SessionStatus.CLOSED,
          startTime: new Date(Date.now() - 3600000 * 4),
          endTime: new Date(Date.now() - 3600000 * 3),
        },
      });
    }

    // Clean any prior dispute on session2
    await prisma.attendanceDispute.deleteMany({
      where: { sessionId: session2.id, studentId: student.id },
    });

    // Student creates dispute 2
    const disp2Res = await fetch(`${API_BASE}/disputes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        sessionId: session2.id,
        reason: "Prof. Kulkarni, I was present in the back row during CS602.",
      }),
    });
    const disp2 = await disp2Res.json();
    console.log(`  Created second dispute: ${disp2.id}`);

    // Kulkarni rejects with mandatory reason
    const kulkarniToken = await loginUser('prof.kulkarni@college.edu', 'TeacherSecure123!');
    const rejectRes = await fetch(`${API_BASE}/disputes/${disp2.id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${kulkarniToken}`,
      },
      body: JSON.stringify({
        rejectionReason: "CCTV footage and laboratory workstation sign-in sheet confirm student was not present.",
      }),
    });
    if (!rejectRes.ok) {
      throw new Error(`Failed to reject dispute: ${rejectRes.status} ${await rejectRes.text()}`);
    }
    const rejectedDisp = await rejectRes.json();
    if (rejectedDisp.status !== DisputeStatus.REJECTED) {
      throw new Error(`Expected REJECTED status, got ${rejectedDisp.status}`);
    }
    console.log(`  ✅ Dispute rejection verified! Status: REJECTED, Reason: "${rejectedDisp.resolutionNote}"`);

    // Verify Rejection Audit Log
    const rejectAudit = await prisma.attendanceAuditLog.findFirst({
      where: {
        entityId: disp2.id,
        action: 'DISPUTE_ATTENDANCE_CORRECTION_REJECTED',
      },
    });
    if (!rejectAudit) throw new Error('Rejection audit log not found');
    console.log(`  ✅ Rejection audit log verified: ${rejectAudit.action}`);

    // 8c. RBAC & Ownership Security
    console.log('  Testing RBAC & Ownership Security (Unauthorized Access -> 403)...');
    const riyaToken = await loginUser('riya.patel@college.edu', 'StudentSecure123!');
    // Riya tries to view Aarav's dispute
    const unauthRes = await fetch(`${API_BASE}/disputes/${dispute.id}`, {
      headers: { Authorization: `Bearer ${riyaToken}` },
    });
    if (unauthRes.status === 403) {
      console.log('  ✅ Cross-student dispute access properly blocked with 403 Forbidden!');
    } else {
      throw new Error(`Expected 403 Forbidden for unauthorized dispute access, got ${unauthRes.status}`);
    }

    console.log('\n================================================================');
    console.log('   ALL PHASE 7 VERIFICATION CHECKS PASSED SUCCESSFULLY! ✅');
    console.log('================================================================');
  } catch (err: any) {
    console.error('\n❌ VERIFICATION FAILED:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
