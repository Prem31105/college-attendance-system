import { PrismaClient, SessionStatus, AttendanceStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Checking and populating real multi-subject attendance records in PostgreSQL...');

  const student = await prisma.student.findFirst({
    where: { rollNumber: 'CS2026-001' },
    include: { section: true },
  });

  if (!student) {
    throw new Error('Student CS2026-001 not found');
  }

  const sub2 = await prisma.subject.findFirst({
    where: { code: 'CS602' },
  });

  if (!sub2) {
    throw new Error('Subject CS602 not found');
  }

  const teacher = await prisma.teacher.findFirst();
  if (!teacher) {
    throw new Error('Teacher not found');
  }

  const classroom = await prisma.classroom.findFirst();
  if (!classroom) {
    throw new Error('Classroom not found');
  }

  // 1. Enroll Aarav Sharma in CS602 if not already enrolled
  await prisma.enrollment.upsert({
    where: {
      studentId_subjectId: {
        studentId: student.id,
        subjectId: sub2.id,
      },
    },
    update: {},
    create: {
      studentId: student.id,
      subjectId: sub2.id,
      sectionId: student.sectionId,
    },
  });
  console.log('✅ Student enrolled in CS602 in PostgreSQL');

  // 2. Check if CS602 sessions already exist
  const existingCs602Sessions = await prisma.attendanceSession.count({
    where: { subjectId: sub2.id, sectionId: student.sectionId },
  });

  if (existingCs602Sessions < 10) {
    console.log(`Creating ${10 - existingCs602Sessions} realistic closed sessions for CS602...`);
    const now = new Date();

    for (let i = existingCs602Sessions; i < 10; i++) {
      const sessionDate = new Date(now.getTime() - (10 - i) * 24 * 60 * 60 * 1000);
      const session = await prisma.attendanceSession.create({
        data: {
          teacherId: teacher.id,
          subjectId: sub2.id,
          sectionId: student.sectionId,
          classroomId: classroom.id,
          status: SessionStatus.CLOSED,
          startTime: sessionDate,
          endTime: new Date(sessionDate.getTime() + 60 * 60 * 1000),
          geofenceRadiusMeters: 75,
        },
      });

      // Attend 7 out of 10 sessions (sessions 0 to 6 attended, 7, 8, 9 missed)
      if (i < 7) {
        await prisma.attendanceRecord.create({
          data: {
            sessionId: session.id,
            studentId: student.id,
            status: AttendanceStatus.VERIFIED,
            verificationLayerMask: 7, // QR + GPS + Device
            distanceMeters: 22.5,
            gpsAccuracy: 12.0,
            riskScore: 5.0,
            reasonCode: 'ALL_CHECKS_PASSED',
            markedAt: new Date(sessionDate.getTime() + 5 * 60 * 1000),
          },
        });
      }
    }
    console.log('✅ Created real CS602 attendance records: 7 attended out of 10 sessions (70% attendance rate)');
  } else {
    console.log('✅ CS602 sessions already exist in PostgreSQL.');
  }

  // 3. Verify final state
  const stats = await prisma.enrollment.findMany({
    where: { studentId: student.id },
    include: { subject: true },
  });

  console.log('Final student enrolled subjects in PostgreSQL:');
  for (const e of stats) {
    const total = await prisma.attendanceSession.count({
      where: { subjectId: e.subjectId, sectionId: student.sectionId, status: SessionStatus.CLOSED },
    });
    const attended = await prisma.attendanceRecord.count({
      where: {
        studentId: student.id,
        session: { subjectId: e.subjectId },
        status: AttendanceStatus.VERIFIED,
      },
    });
    console.log(`  - ${e.subject.code} (${e.subject.name}): ${attended}/${total} attended (${total > 0 ? (attended/total*100).toFixed(1) : 0}%)`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
