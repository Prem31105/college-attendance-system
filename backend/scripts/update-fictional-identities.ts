import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Safely updating User records to realistic fictional Indian college identities...');

  // 1. Aarav Sharma (Primary Student)
  const student1 = await prisma.user.findFirst({
    where: { email: { in: ['john.doe@college.edu', 'aarav.sharma@college.edu'] } },
  });
  if (student1) {
    const updated1 = await prisma.user.update({
      where: { id: student1.id },
      data: {
        email: 'aarav.sharma@college.edu',
        firstName: 'Aarav',
        lastName: 'Sharma',
      },
    });
    console.log(`✅ Student 1 updated: ${updated1.firstName} ${updated1.lastName} (${updated1.email})`);
  }

  // 2. Riya Patel (Secondary Student)
  const student2 = await prisma.user.findFirst({
    where: { email: { in: ['jane.roe@college.edu', 'riya.patel@college.edu'] } },
  });
  if (student2) {
    const updated2 = await prisma.user.update({
      where: { id: student2.id },
      data: {
        email: 'riya.patel@college.edu',
        firstName: 'Riya',
        lastName: 'Patel',
      },
    });
    console.log(`✅ Student 2 updated: ${updated2.firstName} ${updated2.lastName} (${updated2.email})`);
  }

  // 3. Aditya Verma (Third Student)
  const student3 = await prisma.user.findFirst({
    where: { email: { in: ['verify.student@college.edu', 'aditya.verma@college.edu'] } },
  });
  if (student3) {
    const updated3 = await prisma.user.update({
      where: { id: student3.id },
      data: {
        email: 'aditya.verma@college.edu',
        firstName: 'Aditya',
        lastName: 'Verma',
      },
    });
    console.log(`✅ Student 3 updated: ${updated3.firstName} ${updated3.lastName} (${updated3.email})`);
  }

  // 4. Prof. Rahul Mehta (Primary Teacher)
  const teacher1 = await prisma.user.findFirst({
    where: { email: { in: ['prof.smith@college.edu', 'prof.mehta@college.edu'] } },
  });
  if (teacher1) {
    const updatedT = await prisma.user.update({
      where: { id: teacher1.id },
      data: {
        email: 'prof.mehta@college.edu',
        firstName: 'Rahul',
        lastName: 'Mehta',
      },
    });
    console.log(`✅ Teacher 1 updated: ${updatedT.firstName} ${updatedT.lastName} (${updatedT.email})`);
  }

  // 5. Update RegisteredDevice IDs
  const oldDev1 = await prisma.registeredDevice.findUnique({ where: { id: 'device-john-doe-001' } });
  if (oldDev1) {
    await prisma.registeredDevice.create({
      data: {
        id: 'device-aarav-sharma-001',
        studentId: oldDev1.studentId,
        deviceFingerprint: oldDev1.deviceFingerprint,
        publicKeyPem: oldDev1.publicKeyPem,
        deviceModel: oldDev1.deviceModel,
        osType: oldDev1.osType,
        osVersion: oldDev1.osVersion,
        status: oldDev1.status,
      },
    });
    await prisma.deviceChallenge.updateMany({
      where: { deviceId: 'device-john-doe-001' },
      data: { deviceId: 'device-aarav-sharma-001' },
    });
    await prisma.registeredDevice.delete({ where: { id: 'device-john-doe-001' } });
    console.log('✅ Device 1 ID updated to device-aarav-sharma-001');
  }

  const oldDev2 = await prisma.registeredDevice.findUnique({ where: { id: 'device-jane-roe-002' } });
  if (oldDev2) {
    await prisma.registeredDevice.create({
      data: {
        id: 'device-riya-patel-002',
        studentId: oldDev2.studentId,
        deviceFingerprint: oldDev2.deviceFingerprint,
        publicKeyPem: oldDev2.publicKeyPem,
        deviceModel: oldDev2.deviceModel,
        osType: oldDev2.osType,
        osVersion: oldDev2.osVersion,
        status: oldDev2.status,
      },
    });
    await prisma.deviceChallenge.updateMany({
      where: { deviceId: 'device-jane-roe-002' },
      data: { deviceId: 'device-riya-patel-002' },
    });
    await prisma.registeredDevice.delete({ where: { id: 'device-jane-roe-002' } });
    console.log('✅ Device 2 ID updated to device-riya-patel-002');
  }

  console.log('🎉 Database identities updated successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Failed to update identities:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
