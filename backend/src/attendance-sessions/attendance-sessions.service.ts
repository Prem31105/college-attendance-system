import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QrService } from '../qr/qr.service';
import { EventsGateway } from '../gateway/events.gateway';
import { SessionStatus } from '@prisma/client';

@Injectable()
export class AttendanceSessionsService {
  constructor(
    private prisma: PrismaService,
    private qrService: QrService,
    private eventsGateway: EventsGateway,
  ) {}

  async startSession(teacherId: string, subjectId: string, sectionId: string, classroomId: string) {
    // 1. Verify Teacher assignment
    const assignment = await this.prisma.teacherSubjectAssignment.findFirst({
      where: {
        teacherId,
        subjectId,
        sectionId,
      },
    });

    if (!assignment) {
      throw new ForbiddenException('Teacher is not assigned to teach this subject and section');
    }

    // 2. Check for existing active session for this subject & section
    const existingActive = await this.prisma.attendanceSession.findFirst({
      where: {
        subjectId,
        sectionId,
        status: SessionStatus.ACTIVE,
      },
    });

    if (existingActive) {
      // Return existing active session rather than duplicating
      const currentQr = await this.qrService.generateDynamicToken(existingActive.id, subjectId);
      return {
        session: existingActive,
        currentQr,
      };
    }

    // 3. Fetch Classroom geofence radius
    const classroom = await this.prisma.classroom.findUnique({
      where: { id: classroomId },
    });

    if (!classroom) {
      throw new NotFoundException('Classroom not found');
    }

    // 4. Create Session in database
    const session = await this.prisma.attendanceSession.create({
      data: {
        teacherId,
        subjectId,
        sectionId,
        classroomId,
        geofenceRadiusMeters: classroom.geofenceRadiusMeters,
        status: SessionStatus.ACTIVE,
      },
      include: {
        subject: true,
        section: true,
        classroom: true,
      },
    });

    // 5. Generate initial dynamic QR token
    const initialQr = await this.qrService.generateDynamicToken(session.id, subjectId);

    // Broadcast QR over WebSocket
    this.eventsGateway.broadcastQrRefresh(session.id, initialQr);

    return {
      session,
      currentQr: initialQr,
    };
  }

  async closeSession(sessionId: string, teacherId: string) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Attendance session not found');
    }

    if (session.teacherId !== teacherId) {
      throw new ForbiddenException('Only the session creator teacher can close this attendance session');
    }

    const updated = await this.prisma.attendanceSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.CLOSED,
        endTime: new Date(),
      },
    });

    return {
      success: true,
      message: 'Attendance session closed successfully',
      session: updated,
    };
  }

  async getSessionDetails(sessionId: string) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        subject: true,
        section: true,
        classroom: true,
        teacher: {
          include: { user: true },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Total enrolled students
    const totalEnrolled = await this.prisma.enrollment.count({
      where: {
        subjectId: session.subjectId,
        sectionId: session.sectionId,
      },
    });

    // Counts by status
    const verifiedCount = await this.prisma.attendanceRecord.count({
      where: { sessionId, status: 'VERIFIED' },
    });
    const pendingCount = await this.prisma.attendanceRecord.count({
      where: { sessionId, status: 'PENDING' },
    });
    const suspiciousCount = await this.prisma.attendanceRecord.count({
      where: { sessionId, status: 'SUSPICIOUS' },
    });
    const rejectedCount = await this.prisma.attendanceRecord.count({
      where: { sessionId, status: 'REJECTED' },
    });

    return {
      ...session,
      stats: {
        totalEnrolled,
        verifiedCount,
        pendingCount,
        suspiciousCount,
        rejectedCount,
        unmarkedCount: Math.max(0, totalEnrolled - (verifiedCount + pendingCount + suspiciousCount)),
      },
    };
  }
}
