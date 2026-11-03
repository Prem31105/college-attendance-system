import { PrismaClient, Role, OsType, DeviceStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Password Hashes (Argon2id)
  const adminPassHash = await argon2.hash('AdminSecure123!');
  const teacherPassHash = await argon2.hash('TeacherSecure123!');
  const studentPassHash = await argon2.hash('StudentSecure123!');

  // 2. System Settings
  const defaultSettings = [
    { key: 'QR_REFRESH_INTERVAL_SECONDS', value: '15', description: 'Dynamic QR token regeneration cycle' },
    { key: 'QR_TOKEN_VALIDITY_SECONDS', value: '30', description: 'Maximum validity window for scanned QR token' },
    { key: 'DEFAULT_GEOFENCE_RADIUS_METERS', value: '75', description: 'Classroom geofence proximity boundary' },
    { key: 'MAX_ACCEPTED_GPS_ACCURACY_METERS', value: '20', description: 'Reject or flag GPS readings with poor accuracy' },
  ];

  for (const s of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: s,
    });
  }

  // 3. Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@college.edu' },
    update: {},
    create: {
      email: 'admin@college.edu',
      passwordHash: adminPassHash,
      firstName: 'College',
      lastName: 'Administrator',
      role: Role.ADMIN,
      isActive: true,
    },
  });

  // 4. Department
  const cseDept = await prisma.department.upsert({
    where: { code: 'CSE' },
    update: {},
    create: {
      code: 'CSE',
      name: 'Computer Science and Engineering',
    },
  });

  // 5. Course & Semester
  const btechCourse = await prisma.course.upsert({
    where: { code: 'BTECH_CSE' },
    update: {},
    create: {
      code: 'BTECH_CSE',
      name: 'Bachelor of Technology in Computer Science',
      departmentId: cseDept.id,
    },
  });

  const sem6 = await prisma.semester.upsert({
    where: {
      courseId_semesterNumber_academicYear: {
        courseId: btechCourse.id,
        semesterNumber: 6,
        academicYear: '2026-2027',
      },
    },
    update: {},
    create: {
      courseId: btechCourse.id,
      semesterNumber: 6,
      academicYear: '2026-2027',
    },
  });

  // 6. Section
  const sectionA = await prisma.classSection.upsert({
    where: {
      semesterId_name: {
        semesterId: sem6.id,
        name: 'A',
      },
    },
    update: {},
    create: {
      semesterId: sem6.id,
      name: 'A',
    },
  });

  // 7. Subjects
  const sub1 = await prisma.subject.upsert({
    where: { code: 'CS601' },
    update: {},
    create: {
      code: 'CS601',
      name: 'Advanced Distributed Systems',
      courseId: btechCourse.id,
      semesterId: sem6.id,
      credits: 4,
    },
  });

  const sub2 = await prisma.subject.upsert({
    where: { code: 'CS602' },
    update: {},
    create: {
      code: 'CS602',
      name: 'Cryptography & Network Security',
      courseId: btechCourse.id,
      semesterId: sem6.id,
      credits: 4,
    },
  });

  // 8. Classrooms with precise coordinates
  const room401 = await prisma.classroom.upsert({
    where: { name: 'Room 401' },
    update: {},
    create: {
      name: 'Room 401',
      building: 'Technology Block A',
      latitude: 12.9715987,
      longitude: 77.5945627,
      geofenceRadiusMeters: 75,
    },
  });

  // 9. Teachers
  const teacherUser1 = await prisma.user.upsert({
    where: { email: 'prof.mehta@college.edu' },
    update: {
      firstName: 'Rahul',
      lastName: 'Mehta',
    },
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

  // Assign Teacher to Subject
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

  // Teacher 2: Prof. Sneha Kulkarni
  const teacherUser2 = await prisma.user.upsert({
    where: { email: 'prof.kulkarni@college.edu' },
    update: { firstName: 'Sneha', lastName: 'Kulkarni' },
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

  // Teacher 3: Prof. Amit Joshi
  const teacherUser3 = await prisma.user.upsert({
    where: { email: 'prof.joshi@college.edu' },
    update: { firstName: 'Amit', lastName: 'Joshi' },
    create: {
      email: 'prof.joshi@college.edu',
      passwordHash: teacherPassHash,
      firstName: 'Amit',
      lastName: 'Joshi',
      role: Role.TEACHER,
      isActive: true,
    },
  });

  await prisma.teacher.upsert({
    where: { userId: teacherUser3.id },
    update: {},
    create: {
      userId: teacherUser3.id,
      employeeId: 'EMP-CSE-103',
      departmentId: cseDept.id,
      designation: 'Professor',
    },
  });

  // 10. Students
  const studentUser1 = await prisma.user.upsert({
    where: { email: 'aarav.sharma@college.edu' },
    update: {
      firstName: 'Aarav',
      lastName: 'Sharma',
    },
    create: {
      email: 'aarav.sharma@college.edu',
      passwordHash: studentPassHash,
      firstName: 'Aarav',
      lastName: 'Sharma',
      role: Role.STUDENT,
      isActive: true,
    },
  });

  const student1 = await prisma.student.upsert({
    where: { userId: studentUser1.id },
    update: {},
    create: {
      userId: studentUser1.id,
      rollNumber: 'CS2026-001',
      registrationNumber: 'REG-9901',
      departmentId: cseDept.id,
      semesterId: sem6.id,
      sectionId: sectionA.id,
    },
  });

  // Enroll student
  await prisma.enrollment.upsert({
    where: {
      studentId_subjectId: {
        studentId: student1.id,
        subjectId: sub1.id,
      },
    },
    update: {},
    create: {
      studentId: student1.id,
      subjectId: sub1.id,
      sectionId: sectionA.id,
    },
  });

  // Register Aarav Sharma's Primary Device (Sample P-256 ECDSA public key)
  const demoPublicKeyPem = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE7p9r7E+k9hVb3W3Wd2WJ2+cI0q2a
b9/W4D0+zDq+Y4lU5K6tM3v7wO7N3nZ5G1h9j3K8l7k5h7b4k2m9l4a7wQ==
-----END PUBLIC KEY-----`;

  await prisma.registeredDevice.upsert({
    where: { id: 'device-aarav-sharma-001' },
    update: {},
    create: {
      id: 'device-aarav-sharma-001',
      studentId: student1.id,
      deviceFingerprint: 'SM-G998B-ANDROID-14-HW-TOKEN-991',
      publicKeyPem: demoPublicKeyPem,
      deviceModel: 'Samsung Galaxy S24 Ultra',
      osType: OsType.ANDROID,
      osVersion: 'Android 14 (API 34)',
      status: DeviceStatus.ACTIVE,
    },
  });

  console.log('✅ Database seeding completed successfully!');
  console.log('Credentials Summary:');
  console.log('  Admin:   admin@college.edu       / AdminSecure123!');
  console.log('  Teacher: prof.mehta@college.edu  / TeacherSecure123!');
  console.log('  Student: aarav.sharma@college.edu / StudentSecure123!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
