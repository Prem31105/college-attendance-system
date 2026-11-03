import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Resolving Teacher Discrepancy & Seeding Faculty in PostgreSQL...');

  const teacherPassHash = await argon2.hash('TeacherSecure123!');
  const cseDept = await prisma.department.findUnique({ where: { code: 'CSE' } });
  if (!cseDept) throw new Error('CSE department not found');

  const sub1 = await prisma.subject.findUnique({ where: { code: 'CS601' } });
  const sub2 = await prisma.subject.findUnique({ where: { code: 'CS602' } });
  const sectionA = await prisma.classSection.findFirst();
  const room401 = await prisma.classroom.findFirst({ where: { name: 'Room 401' } });

  if (!sub1 || !sub2 || !sectionA || !room401) {
    throw new Error('Required subject, section, or classroom not found');
  }

  // 1. Verify/Upsert Prof. Rahul Mehta (CS601)
  const teacherUser1 = await prisma.user.upsert({
    where: { email: 'prof.mehta@college.edu' },
    update: { firstName: 'Rahul', lastName: 'Mehta', role: Role.TEACHER },
    create: {
      email: 'prof.mehta@college.edu',
      passwordHash: teacherPassHash,
      firstName: 'Rahul',
      lastName: 'Mehta',
      role: Role.TEACHER,
      isActive: true,
    },
  });

  const teacher1 = await prisma.teacher.upsert({
    where: { userId: teacherUser1.id },
    update: {},
    create: {
      userId: teacherUser1.id,
      employeeId: 'EMP-CSE-101',
      departmentId: cseDept.id,
      designation: 'Associate Professor',
    },
  });

  await prisma.teacherSubjectAssignment.upsert({
    where: {
      teacherId_subjectId_sectionId_academicYear: {
        teacherId: teacher1.id,
        subjectId: sub1.id,
        sectionId: sectionA.id,
        academicYear: '2026-2027',
      },
    },
    update: {},
    create: {
      teacherId: teacher1.id,
      subjectId: sub1.id,
      sectionId: sectionA.id,
      academicYear: '2026-2027',
    },
  });
  console.log('✅ Prof. Rahul Mehta verified and assigned to CS601');

  // 2. Upsert Prof. Sneha Kulkarni (CS602)
  const teacherUser2 = await prisma.user.upsert({
    where: { email: 'prof.kulkarni@college.edu' },
    update: { firstName: 'Sneha', lastName: 'Kulkarni', role: Role.TEACHER },
    create: {
      email: 'prof.kulkarni@college.edu',
      passwordHash: teacherPassHash,
      firstName: 'Sneha',
      lastName: 'Kulkarni',
      role: Role.TEACHER,
      isActive: true,
    },
  });

  const teacher2 = await prisma.teacher.upsert({
    where: { userId: teacherUser2.id },
    update: {},
    create: {
      userId: teacherUser2.id,
      employeeId: 'EMP-CSE-102',
      departmentId: cseDept.id,
      designation: 'Assistant Professor',
    },
  });

  await prisma.teacherSubjectAssignment.upsert({
    where: {
      teacherId_subjectId_sectionId_academicYear: {
        teacherId: teacher2.id,
        subjectId: sub2.id,
        sectionId: sectionA.id,
        academicYear: '2026-2027',
      },
    },
    update: {},
    create: {
      teacherId: teacher2.id,
      subjectId: sub2.id,
      sectionId: sectionA.id,
      academicYear: '2026-2027',
    },
  });
  console.log('✅ Prof. Sneha Kulkarni created and assigned to CS602');

  // 3. Upsert Prof. Amit Joshi
  const teacherUser3 = await prisma.user.upsert({
    where: { email: 'prof.joshi@college.edu' },
    update: { firstName: 'Amit', lastName: 'Joshi', role: Role.TEACHER },
    create: {
      email: 'prof.joshi@college.edu',
      passwordHash: teacherPassHash,
      firstName: 'Amit',
      lastName: 'Joshi',
      role: Role.TEACHER,
      isActive: true,
    },
  });

  const teacher3 = await prisma.teacher.upsert({
    where: { userId: teacherUser3.id },
    update: {},
    create: {
      userId: teacherUser3.id,
      employeeId: 'EMP-CSE-103',
      departmentId: cseDept.id,
      designation: 'Professor',
    },
  });
  console.log('✅ Prof. Amit Joshi created');

  // 4. Seed Timetable entries if none exist
  const existingTimetable = await prisma.timetable.count();
  if (existingTimetable === 0) {
    await prisma.timetable.createMany({
      data: [
        {
          subjectId: sub1.id,
          sectionId: sectionA.id,
          teacherId: teacher1.id,
          classroomId: room401.id,
          dayOfWeek: 1, // Monday
          startTime: '09:00',
          endTime: '10:30',
        },
        {
          subjectId: sub2.id,
          sectionId: sectionA.id,
          teacherId: teacher2.id,
          classroomId: room401.id,
          dayOfWeek: 1, // Monday
          startTime: '10:45',
          endTime: '12:15',
        },
      ],
    });
    console.log('✅ Real Timetable entries created in PostgreSQL for CS601 and CS602');
  }

  const finalTeachers = await prisma.teacher.findMany({ include: { user: true, assignments: { include: { subject: true } } } });
  console.log(`\n🎉 Total Teachers in PostgreSQL: ${finalTeachers.length}`);
  for (const t of finalTeachers) {
    console.log(`  - ${t.user.firstName} ${t.user.lastName} (${t.user.email}): ${t.assignments.map(a => a.subject.code).join(', ') || 'No subjects assigned'}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Failed to seed teachers:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
