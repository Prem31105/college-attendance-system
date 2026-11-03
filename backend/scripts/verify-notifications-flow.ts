import { PrismaClient, Role, NotificationPriority } from '@prisma/client';
import { NotificationsService } from '../src/notifications/notifications.service';
import { EventsGateway } from '../src/gateway/events.gateway';
import { AnnouncementTarget } from '../src/notifications/dto/create-announcement.dto';

async function runNotificationsVerification() {
  console.log('\n=============================================================');
  console.log('🧪 VERIFYING PHASE 2.3 NOTIFICATIONS & ANNOUNCEMENTS SYSTEM');
  console.log('=============================================================\n');

  const prisma = new PrismaClient();
  let passed = 0;

  try {
    await prisma.$connect();
    console.log('  ✅ [PASS] 1. Connected to live PostgreSQL database');
    passed++;

    // Find actors (Admin, Teacher, Student)
    const admin = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
    const teacher = await prisma.user.findFirst({ where: { role: Role.TEACHER } });
    const student = await prisma.user.findFirst({ where: { role: Role.STUDENT } });

    if (!admin || !teacher || !student) {
      throw new Error('Database missing seeded admin, teacher, or student');
    }

    // Mock EventsGateway
    const mockEventsGateway = {
      broadcastNotificationToUser: () => {},
      broadcastNotificationToRole: () => {},
      broadcastGlobalAnnouncement: () => {},
    } as unknown as EventsGateway;

    const notificationsService = new NotificationsService(prisma as any, mockEventsGateway);

    // 2. Clean previous test notifications for the student
    await prisma.notification.deleteMany({
      where: { userId: student.id },
    });

    // Seed 4 sample notifications for student with varied priorities
    await prisma.notification.createMany({
      data: [
        {
          userId: student.id,
          title: 'Class Cancelled',
          message: 'Distributed Systems lecture on Friday is cancelled.',
          priority: NotificationPriority.URGENT,
          type: 'CLASS_ANNOUNCEMENT',
          isRead: false,
        },
        {
          userId: student.id,
          title: 'Attendance Warning',
          message: 'Your overall attendance in CS601 is nearing 75%.',
          priority: NotificationPriority.URGENT,
          type: 'ATTENDANCE_ALERT',
          isRead: false,
        },
        {
          userId: student.id,
          title: 'Lab Submission Deadline',
          message: 'Submit Lab 4 by Wednesday 5 PM.',
          priority: NotificationPriority.NORMAL,
          type: 'CLASS_ANNOUNCEMENT',
          isRead: false,
        },
        {
          userId: student.id,
          title: 'Cultural Fest Registration',
          message: 'Registrations are now open for the annual cultural fest.',
          priority: NotificationPriority.INFORMATIONAL,
          type: 'CAMPUS_BROADCAST',
          isRead: true,
          readAt: new Date(),
        },
      ],
    });

    // 3. Test list notifications and pagination
    const listResult = await notificationsService.getUserNotifications(student.id, {
      page: 1,
      limit: 2,
    });

    if (listResult.notifications.length === 2 && listResult.total === 4 && listResult.unreadCount === 3) {
      console.log('  ✅ [PASS] 2. User notifications listed with pagination and unread counts');
      passed++;
    } else {
      throw new Error(`Pagination check failed: ${JSON.stringify(listResult)}`);
    }

    // 4. Test priority filter (URGENT only)
    const urgentResult = await notificationsService.getUserNotifications(student.id, {
      priority: NotificationPriority.URGENT,
    });

    if (urgentResult.notifications.length === 2 && urgentResult.notifications.every((n) => n.priority === 'URGENT')) {
      console.log('  ✅ [PASS] 3. Priority-based filtering verified (URGENT notifications only)');
      passed++;
    } else {
      throw new Error('Priority filtering failed');
    }

    // 5. Test raw unread count endpoint
    const unreadCountRes = await notificationsService.getUnreadCount(student.id);
    if (unreadCountRes.unreadCount === 3) {
      console.log('  ✅ [PASS] 4. Accurate unread badge count verified (3 unread)');
      passed++;
    } else {
      throw new Error(`Expected 3 unread, got ${unreadCountRes.unreadCount}`);
    }

    // 6. Test mark single notification as read
    const unreadItem = listResult.notifications.find((n) => !n.isRead);
    if (unreadItem) {
      const updated = await notificationsService.markAsRead(unreadItem.id, student.id);
      if (updated.isRead === true && updated.readAt !== null) {
        console.log('  ✅ [PASS] 5. Individual mark-as-read verified with read timestamp');
        passed++;
      } else {
        throw new Error('Failed to mark individual notification as read');
      }
    }

    // 7. Test mark-all-as-read
    const markAllRes = await notificationsService.markAllAsRead(student.id);
    const postMarkAllUnread = await notificationsService.getUnreadCount(student.id);
    if (markAllRes.success && postMarkAllUnread.unreadCount === 0) {
      console.log('  ✅ [PASS] 6. Mark-all-as-read verified (unread count reset to 0)');
      passed++;
    } else {
      throw new Error(`Mark all as read failed: ${JSON.stringify(postMarkAllUnread)}`);
    }

    // 8. Test role-based authorization: Student attempting to send announcement
    let studentBlocked = false;
    try {
      await notificationsService.createAnnouncement(
        { id: student.id, role: Role.STUDENT, firstName: student.firstName, lastName: student.lastName },
        {
          title: 'Hacked Announcement',
          message: 'Student trying to broadcast',
          target: AnnouncementTarget.ALL,
        },
      );
    } catch (e: any) {
      if (e.status === 403) {
        studentBlocked = true;
      }
    }

    if (studentBlocked) {
      console.log('  ✅ [PASS] 7. Unauthorized student announcement strictly blocked (HTTP 403)');
      passed++;
    } else {
      throw new Error('Student was able to create announcement');
    }

    // 9. Test role-based authorization: Teacher attempting global broadcast to ALL
    let teacherAllBlocked = false;
    try {
      await notificationsService.createAnnouncement(
        { id: teacher.id, role: Role.TEACHER, firstName: teacher.firstName, lastName: teacher.lastName },
        {
          title: 'Teacher Global Broadcast',
          message: 'Trying to broadcast to everyone',
          target: AnnouncementTarget.ALL,
        },
      );
    } catch (e: any) {
      if (e.status === 403) {
        teacherAllBlocked = true;
      }
    }

    if (teacherAllBlocked) {
      console.log('  ✅ [PASS] 8. Teacher broadcast to ALL strictly blocked (HTTP 403)');
      passed++;
    } else {
      throw new Error('Teacher was able to broadcast to ALL');
    }

    // 10. Teacher valid announcement to STUDENT role
    const teacherAnnouncement = await notificationsService.createAnnouncement(
      { id: teacher.id, role: Role.TEACHER, firstName: teacher.firstName, lastName: teacher.lastName },
      {
        title: 'Quiz Tomorrow',
        message: 'Surprise quiz on Chapter 3 tomorrow morning at 9 AM.',
        priority: NotificationPriority.NORMAL,
        target: AnnouncementTarget.ROLE,
        targetRole: Role.STUDENT,
        type: 'CLASS_ANNOUNCEMENT',
      },
    );

    if (teacherAnnouncement.success && teacherAnnouncement.count > 0) {
      console.log(`  ✅ [PASS] 9. Teacher announcement to STUDENT role dispatched (${teacherAnnouncement.count} recipients)`);
      passed++;
    } else {
      throw new Error('Teacher announcement failed');
    }

    // 11. Admin valid URGENT global broadcast to ALL
    const adminBroadcast = await notificationsService.createAnnouncement(
      { id: admin.id, role: Role.ADMIN, firstName: admin.firstName, lastName: admin.lastName },
      {
        title: 'Campus Emergency Evacuation Drill',
        message: 'A mandatory campus-wide drill will commence at 2 PM sharp.',
        priority: NotificationPriority.URGENT,
        target: AnnouncementTarget.ALL,
        type: 'CAMPUS_BROADCAST',
      },
    );

    if (adminBroadcast.success && adminBroadcast.priority === 'URGENT') {
      console.log(`  ✅ [PASS] 10. Admin URGENT global broadcast dispatched (${adminBroadcast.count} recipients)`);
      passed++;
    } else {
      throw new Error('Admin broadcast failed');
    }

    // 12. Audit log entry verified for Admin broadcast
    const auditLog = await prisma.attendanceAuditLog.findFirst({
      where: {
        action: 'ANNOUNCEMENT_BROADCAST',
        actorId: admin.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (auditLog && auditLog.newValue?.includes('Campus Emergency Evacuation Drill')) {
      console.log('  ✅ [PASS] 11. Immutable Audit Log recorded for administrative broadcast');
      passed++;
    } else {
      throw new Error('Audit log record missing for administrative broadcast');
    }

    // 13. Test Deduplication / Idempotent delivery
    const duplicateSubmission = await notificationsService.createAnnouncement(
      { id: admin.id, role: Role.ADMIN, firstName: admin.firstName, lastName: admin.lastName },
      {
        title: 'Campus Emergency Evacuation Drill',
        message: 'A mandatory campus-wide drill will commence at 2 PM sharp.',
        priority: NotificationPriority.URGENT,
        target: AnnouncementTarget.ALL,
      },
    );

    if (duplicateSubmission.deduplicated === true) {
      console.log('  ✅ [PASS] 12. Idempotent duplicate delivery prevention verified (30s window)');
      passed++;
    } else {
      throw new Error('Duplicate delivery was not prevented');
    }

    console.log('\n=============================================================');
    console.log(`📊 NOTIFICATION SUITE RESULTS: ${passed}/12 TESTS PASSED`);
    console.log('=============================================================\n');
    console.log('🎉 ALL BACKEND NOTIFICATION & ANNOUNCEMENT WORKFLOWS VERIFIED!\n');
  } catch (err) {
    console.error('\n❌ NOTIFICATION TEST FAILURE:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runNotificationsVerification();
