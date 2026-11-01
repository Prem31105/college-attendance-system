import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';
import { Role, NotificationPriority, Prisma } from '@prisma/client';
import { CreateAnnouncementDto, AnnouncementTarget } from './dto/create-announcement.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  /**
   * Retrieves paginated notifications for the current authenticated user
   */
  async getUserNotifications(userId: string, query: QueryNotificationsDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(query.isRead !== undefined && { isRead: query.isRead }),
      ...(query.priority && { priority: query.priority }),
      ...(query.type && { type: query.type }),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    };
  }

  /**
   * Retrieves the raw unread notification count for badge rendering
   */
  async getUnreadCount(userId: string): Promise<{ unreadCount: number }> {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { unreadCount: count };
  }

  /**
   * Retrieves single notification detail and marks it as read if not already read
   */
  async getNotificationDetail(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID '${id}' not found`);
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('You are not authorized to view this notification');
    }

    if (!notification.isRead) {
      return this.prisma.notification.update({
        where: { id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    }

    return notification;
  }

  /**
   * Marks a single notification as read
   */
  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID '${id}' not found`);
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('You are not authorized to update this notification');
    }

    return this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Marks all unread notifications for a user as read
   */
  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return {
      success: true,
      updatedCount: result.count,
      message: 'All notifications marked as read',
    };
  }

  /**
   * Dispatches role-authorized announcements with duplicate-delivery prevention,
   * audit logging, database persistence, and real-time WebSocket broadcasting.
   */
  async createAnnouncement(
    sender: { id: string; role: Role; firstName: string; lastName: string },
    dto: CreateAnnouncementDto,
  ) {
    // 1. Role-based permission verification
    if (sender.role === Role.STUDENT) {
      throw new ForbiddenException('Students are not authorized to create announcements or alerts');
    }

    const priority = dto.priority || NotificationPriority.NORMAL;

    // Strict priority controls: Only ADMIN and TEACHER can create URGENT / NORMAL / INFORMATIONAL announcements
    if (priority === NotificationPriority.URGENT && sender.role !== Role.ADMIN && sender.role !== Role.TEACHER) {
      throw new ForbiddenException('Only Administrators and Instructors can send Urgent announcements');
    }

    // Target permission controls: Only ADMIN can broadcast to ALL
    if (dto.target === AnnouncementTarget.ALL && sender.role !== Role.ADMIN) {
      throw new ForbiddenException('Only Administrators can broadcast announcements to all users');
    }

    // 2. Resolve recipient user IDs
    let recipientUserIds: string[] = [];

    switch (dto.target) {
      case AnnouncementTarget.ALL: {
        const users = await this.prisma.user.findMany({
          where: { isActive: true },
          select: { id: true },
        });
        recipientUserIds = users.map((u) => u.id);
        break;
      }

      case AnnouncementTarget.ROLE: {
        if (!dto.targetRole) {
          throw new BadRequestException('targetRole is required when target is ROLE');
        }
        // Teachers cannot send announcements targeting Admins
        if (sender.role === Role.TEACHER && dto.targetRole === Role.ADMIN) {
          throw new ForbiddenException('Teachers cannot target Administrators with announcements');
        }
        const users = await this.prisma.user.findMany({
          where: { role: dto.targetRole, isActive: true },
          select: { id: true },
        });
        recipientUserIds = users.map((u) => u.id);
        break;
      }

      case AnnouncementTarget.CLASS: {
        if (!dto.classSectionId) {
          throw new BadRequestException('classSectionId is required when target is CLASS');
        }
        const students = await this.prisma.student.findMany({
          where: { sectionId: dto.classSectionId },
          select: { userId: true },
        });
        recipientUserIds = students.map((s) => s.userId);
        break;
      }

      case AnnouncementTarget.INDIVIDUAL: {
        if (!dto.targetUserIds || dto.targetUserIds.length === 0) {
          throw new BadRequestException('targetUserIds array is required when target is INDIVIDUAL');
        }
        const users = await this.prisma.user.findMany({
          where: { id: { in: dto.targetUserIds }, isActive: true },
          select: { id: true },
        });
        recipientUserIds = users.map((u) => u.id);
        break;
      }

      default:
        throw new BadRequestException(`Unsupported target type: ${dto.target}`);
    }

    if (recipientUserIds.length === 0) {
      return {
        success: true,
        count: 0,
        message: 'No eligible recipients found for this announcement',
      };
    }

    // 3. Deduplication check (prevent duplicate accidental double-submit within 30 seconds)
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    const existingDuplicate = await this.prisma.notification.findFirst({
      where: {
        senderId: sender.id,
        title: dto.title,
        message: dto.message,
        createdAt: { gte: thirtySecondsAgo },
      },
    });

    if (existingDuplicate) {
      return {
        success: true,
        count: recipientUserIds.length,
        message: 'Duplicate announcement recently dispatched; reused existing broadcast',
        deduplicated: true,
      };
    }

    const payloadData = dto.data ? JSON.stringify(dto.data) : null;
    const notificationType = dto.type || 'CAMPUS_BROADCAST';

    // 4. Atomic persistence using Prisma transaction
    const notificationsToCreate = recipientUserIds.map((userId) => ({
      userId,
      title: dto.title,
      message: dto.message,
      type: notificationType,
      priority,
      isRead: false,
      senderId: sender.id,
      data: payloadData,
    }));

    await this.prisma.$transaction(async (tx) => {
      // Create notification records
      await tx.notification.createMany({
        data: notificationsToCreate,
      });

      // Audit log for broadcasts, urgent announcements, or admin actions
      if (
        sender.role === Role.ADMIN ||
        dto.target === AnnouncementTarget.ALL ||
        priority === NotificationPriority.URGENT
      ) {
        await tx.attendanceAuditLog.create({
          data: {
            action: 'ANNOUNCEMENT_BROADCAST',
            entityName: 'Notification',
            entityId: sender.id,
            actorId: sender.id,
            newValue: JSON.stringify({
              title: dto.title,
              priority,
              target: dto.target,
              targetRole: dto.targetRole,
              recipientCount: recipientUserIds.length,
            }),
          },
        });
      }
    });

    // 5. Real-time WebSocket delivery
    const livePayload = {
      title: dto.title,
      message: dto.message,
      priority,
      type: notificationType,
      senderName: `${sender.firstName} ${sender.lastName}`.trim(),
      createdAt: new Date().toISOString(),
      data: dto.data,
    };

    if (dto.target === AnnouncementTarget.ALL) {
      this.eventsGateway.broadcastGlobalAnnouncement(livePayload);
    } else if (dto.target === AnnouncementTarget.ROLE && dto.targetRole) {
      this.eventsGateway.broadcastNotificationToRole(dto.targetRole, livePayload);
    } else {
      for (const uid of recipientUserIds) {
        this.eventsGateway.broadcastNotificationToUser(uid, livePayload);
      }
    }

    return {
      success: true,
      count: recipientUserIds.length,
      priority,
      message: `Announcement successfully dispatched to ${recipientUserIds.length} recipient(s)`,
    };
  }
}
