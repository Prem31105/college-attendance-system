import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const allSubjects = await prisma.subject.findMany();
  console.log('ALL SUBJECTS IN DB:');
  console.table(allSubjects.map((s) => ({ id: s.id, code: s.code, name: s.name, credits: s.credits })));

  const student = await prisma.student.findFirst({
    where: { rollNumber: 'CS2026-001' },
    include: {
      enrollments: {
        include: { subject: true, section: true },
      },
    },
  });

  console.log('STUDENT:', student?.rollNumber);
  console.log(
    'ENROLLMENTS:',
    student?.enrollments.map((e) => ({
      code: e.subject.code,
      name: e.subject.name,
      section: e.section.name,
    })),
  );

  const sessions = await prisma.attendanceSession.findMany({
    include: { subject: true },
  });
  console.log('SESSIONS COUNT:', sessions.length);
  console.table(sessions.map((s) => ({ id: s.id, subject: s.subject.code, status: s.status })));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
