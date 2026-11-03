import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsGateway } from '../gateway/events.gateway';
import { DisputeStatus, AttendanceStatus, Role } from '@prisma/client';
import { CreateDisputeDto } from './dto/dispute.dto';

@Injectable()
export class DisputesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private eventsGateway: EventsGateway,
  ) {}

  /**
   * Student creates a new attendance dispute.
   */
  async createDispute(studentId: string, userId: string, dto: CreateDisputeDto) {
    if (!dto.reason || dto.reason.trim().length < 5) {
      throw new BadRequestException('Dispute explanation must be at least 5 characters long.');
    }
    if (dto.reason.trim().length > 1000) {
      throw new BadRequestException('Dispute explanation cannot exceed 1000 characters.');
    }

    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: dto.sessionId },
      include: {
        subject: true,
        classroom: true,
        teacher: { include: { user: true } },
      },
    });

    if (!session) {
      throw new NotFoundException('Attendance session not found.');
    }

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found.');
    }

    // Check for existing dispute for this session and student
    const existingDispute = await this.prisma.attendanceDispute.findFirst({
      where: {
        sessionId: dto.sessionId,
        studentId,
      },
    });

    if (existingDispute) {
      if (existingDispute.status === DisputeStatus.RESOLVED) {
        throw new ConflictException('Attendance for this session has already been verified and resolved.');
      }
      if (existingDispute.status === DisputeStatus.PENDING || existingDispute.status === DisputeStatus.UNDER_REVIEW) {
        throw new ConflictException(
          'An active attendance dispute is already open for this session. Please check your existing dispute thread.',
        );
      }
      throw new ConflictException('An attendance dispute for this session has already been processed.');
    }

    // Check if an attendance record exists
    let record = null;
    if (dto.attendanceRecordId) {
      record = await this.prisma.attendanceRecord.findUnique({
        where: { id: dto.attendanceRecordId },
      });
    } else {
      record = await this.prisma.attendanceRecord.findUnique({
        where: {
          sessionId_studentId: {
            sessionId: dto.sessionId,
            studentId,
          },
        },
      });
    }

    // Teacher assignment lookup
    const teacherId = session.teacherId;

    // Create dispute and first message atomically
    const dispute = await this.prisma.$transaction(async (tx) => {
      const created = await tx.attendanceDispute.create({
        data: {
          studentId,
          teacherId,
          sessionId: dto.sessionId,
          attendanceRecordId: record?.id || null,
          status: DisputeStatus.PENDING,
          reason: dto.reason.trim(),
          messages: {
            create: {
              senderId: userId,
              message: dto.reason.trim(),
            },
          },
        },
        include: {
          student: { include: { user: true } },
          teacher: { include: { user: true } },
          session: { include: { subject: true, classroom: true } },
          messages: true,
        },
      });

      // Audit log entry
      await tx.attendanceAuditLog.create({
        data: {
          action: 'CREATE_ATTENDANCE_DISPUTE',
          entityName: 'AttendanceDispute',
          entityId: created.id,
          actorId: userId,
          newValue: JSON.stringify({
            sessionId: dto.sessionId,
            subject: session.subject.name,
            reason: dto.reason.trim(),
          }),
        },
      });

      return created;
    });

    // Notify assigned teacher
    await this.notificationsService.createNotification({
      userId: session.teacher.userId,
      title: 'New Attendance Dispute Received',
      message: `${student.user.firstName} ${student.user.lastName} (${student.rollNumber}) disputed attendance for ${session.subject.name}.`,
      type: 'ATTENDANCE_DISPUTE',
      senderId: userId,
    });

    return dispute;
  }

  /**
   * List disputes for a student.
   */
  async getStudentDisputes(studentId: string) {
    return this.prisma.attendanceDispute.findMany({
      where: { studentId },
      include: {
        teacher: { include: { user: true } },
        session: { include: { subject: true, classroom: true } },
        attendanceRecord: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * List disputes for a teacher.
   */
  async getTeacherDisputes(teacherId?: string, status?: DisputeStatus, isAdmin = false) {
    const where: any = {};
    if (!isAdmin && teacherId) {
      where.teacherId = teacherId;
    }
    if (status) {
      where.status = status;
    }

    const disputes = await this.prisma.attendanceDispute.findMany({
      where,
      include: {
        student: { include: { user: true } },
        teacher: { include: { user: true } },
        session: { include: { subject: true, classroom: true } },
        attendanceRecord: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return disputes;
  }

  /**
   * Get dispute details and conversation history.
   */
  async getDisputeById(disputeId: string, userId: string, role: string) {
    const dispute = await this.prisma.attendanceDispute.findUnique({
      where: { id: disputeId },
      include: {
        student: { include: { user: true } },
        teacher: { include: { user: true } },
        session: { include: { subject: true, classroom: true } },
        attendanceRecord: true,
        resolvedBy: true,
        messages: {
          include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found.');
    }

    // Role-based access validation
    if (role === Role.STUDENT && dispute.student.userId !== userId) {
      throw new ForbiddenException('You are not authorized to view this dispute.');
    }
    if (role === Role.TEACHER && dispute.teacher.userId !== userId) {
      throw new ForbiddenException('You are not authorized to review this dispute.');
    }

    // Mark unread messages sent by the other party as read
    await this.prisma.disputeMessage.updateMany({
      where: {
        disputeId,
        senderId: { not: userId },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return dispute;
  }

  /**
   * Send a message in a dispute conversation.
   */
  async sendMessage(disputeId: string, senderId: string, role: string, message: string) {
    if (!message || message.trim().length === 0) {
      throw new BadRequestException('Message cannot be empty.');
    }
    if (message.trim().length > 2000) {
      throw new BadRequestException('Message cannot exceed 2000 characters.');
    }

    const dispute = await this.prisma.attendanceDispute.findUnique({
      where: { id: disputeId },
      include: {
        student: { include: { user: true } },
        teacher: { include: { user: true } },
        session: { include: { subject: true } },
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found.');
    }

    // Authorization
    if (role === Role.STUDENT && dispute.student.userId !== senderId) {
      throw new ForbiddenException('You cannot send messages in this dispute.');
    }
    if (role === Role.TEACHER && dispute.teacher.userId !== senderId) {
      throw new ForbiddenException('You cannot send messages in this dispute.');
    }

    const createdMessage = await this.prisma.disputeMessage.create({
      data: {
        disputeId,
        senderId,
        message: message.trim(),
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });

    // Notify recipient
    const recipientUserId =
      role === Role.STUDENT ? dispute.teacher.userId : dispute.student.userId;
    const senderName =
      role === Role.STUDENT
        ? `${dispute.student.user.firstName} ${dispute.student.user.lastName}`
        : `${dispute.teacher.user.firstName} ${dispute.teacher.user.lastName}`;

    await this.notificationsService.createNotification({
      userId: recipientUserId,
      title: `Dispute Message from ${senderName}`,
      message: message.trim().slice(0, 150),
      type: 'ATTENDANCE_DISPUTE_MESSAGE',
      senderId,
    });

    return createdMessage;
  }

  /**
   * Update dispute status to UNDER_REVIEW.
   */
  async updateStatus(disputeId: string, userId: string, status: DisputeStatus) {
    const dispute = await this.prisma.attendanceDispute.findUnique({
      where: { id: disputeId },
      include: { teacher: true, student: { include: { user: true } } },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found.');
    }

    const updated = await this.prisma.attendanceDispute.update({
      where: { id: disputeId },
      data: { status },
    });

    await this.notificationsService.createNotification({
      userId: dispute.student.userId,
      title: 'Dispute Status Updated',
      message: `Your dispute is now ${status.replace('_', ' ')}.`,
      type: 'ATTENDANCE_DISPUTE',
      senderId: userId,
    });

    return updated;
  }

  /**
   * Approve attendance dispute correction.
   */
  async approveDispute(disputeId: string, actorId: string, resolutionNote?: string) {
    const dispute = await this.prisma.attendanceDispute.findUnique({
      where: { id: disputeId },
      include: {
        student: { include: { user: true } },
        teacher: { include: { user: true } },
        session: { include: { subject: true } },
        attendanceRecord: true,
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found.');
    }

    if (dispute.status === DisputeStatus.RESOLVED) {
      throw new BadRequestException('Dispute is already resolved.');
    }

    const note = resolutionNote?.trim() || 'Attendance verified and approved by instructor.';

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Update dispute status
      const resolvedDispute = await tx.attendanceDispute.update({
        where: { id: disputeId },
        data: {
          status: DisputeStatus.RESOLVED,
          resolvedAt: new Date(),
          resolvedById: actorId,
          resolutionNote: note,
        },
      });

      // 2. Update or create AttendanceRecord to VERIFIED
      let updatedRecord;
      if (dispute.attendanceRecordId) {
        updatedRecord = await tx.attendanceRecord.update({
          where: { id: dispute.attendanceRecordId },
          data: {
            status: AttendanceStatus.VERIFIED,
            reasonCode: `DISPUTE_CORRECTION_APPROVED: ${note}`,
            verificationLayerMask: { increment: 64 }, // Bitmask 64: Dispute correction verified
          },
        });
      } else {
        updatedRecord = await tx.attendanceRecord.upsert({
          where: {
            sessionId_studentId: {
              sessionId: dispute.sessionId,
              studentId: dispute.studentId,
            },
          },
          update: {
            status: AttendanceStatus.VERIFIED,
            reasonCode: `DISPUTE_CORRECTION_APPROVED: ${note}`,
          },
          create: {
            sessionId: dispute.sessionId,
            studentId: dispute.studentId,
            status: AttendanceStatus.VERIFIED,
            distanceMeters: 0,
            gpsAccuracy: 0,
            riskScore: 0,
            verificationLayerMask: 64,
            reasonCode: `DISPUTE_CORRECTION_APPROVED: ${note}`,
          },
        });
      }

      // 3. Immutable audit log entry
      await tx.attendanceAuditLog.create({
        data: {
          action: 'DISPUTE_ATTENDANCE_CORRECTION_APPROVED',
          entityName: 'AttendanceRecord',
          entityId: updatedRecord.id,
          actorId,
          oldValue: JSON.stringify({ status: 'ABSENT' }),
          newValue: JSON.stringify({
            status: 'VERIFIED',
            disputeId: dispute.id,
            resolutionNote: note,
            approverId: actorId,
          }),
        },
      });

      return { dispute: resolvedDispute, record: updatedRecord };
    });

    // Notify student
    await this.notificationsService.createNotification({
      userId: dispute.student.userId,
      title: 'Attendance Dispute Approved ✅',
      message: `Your dispute for ${dispute.session.subject.name} was approved. Attendance has been marked Present.`,
      type: 'ATTENDANCE_CORRECTION',
      senderId: actorId,
    });

    return result;
  }

  /**
   * Reject attendance dispute correction.
   */
  async rejectDispute(disputeId: string, actorId: string, rejectionReason: string) {
    if (!rejectionReason || rejectionReason.trim().length < 5) {
      throw new BadRequestException('A mandatory rejection reason of at least 5 characters is required.');
    }

    const dispute = await this.prisma.attendanceDispute.findUnique({
      where: { id: disputeId },
      include: {
        student: { include: { user: true } },
        session: { include: { subject: true } },
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found.');
    }

    if (dispute.status === DisputeStatus.RESOLVED || dispute.status === DisputeStatus.REJECTED) {
      throw new BadRequestException('Dispute has already been resolved or rejected.');
    }

    const note = rejectionReason.trim();

    const result = await this.prisma.$transaction(async (tx) => {
      const rejected = await tx.attendanceDispute.update({
        where: { id: disputeId },
        data: {
          status: DisputeStatus.REJECTED,
          resolvedAt: new Date(),
          resolvedById: actorId,
          resolutionNote: note,
        },
      });

      await tx.attendanceAuditLog.create({
        data: {
          action: 'DISPUTE_ATTENDANCE_CORRECTION_REJECTED',
          entityName: 'AttendanceDispute',
          entityId: dispute.id,
          actorId,
          newValue: JSON.stringify({
            status: 'REJECTED',
            rejectionReason: note,
          }),
        },
      });

      return rejected;
    });

    // Notify student
    await this.notificationsService.createNotification({
      userId: dispute.student.userId,
      title: 'Attendance Dispute Rejected',
      message: `Your dispute for ${dispute.session.subject.name} was rejected: "${note}"`,
      type: 'ATTENDANCE_DISPUTE',
      senderId: actorId,
    });

    return result;
  }
}
