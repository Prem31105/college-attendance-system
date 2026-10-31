import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CorrectionStatus, DeviceStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  /**
   * System-wide dashboard statistics for administrators.
   */
  async getDashboardAnalytics() {
    const totalStudents = await this.prisma.student.count();
    const totalTeachers = await this.prisma.teacher.count();
    const totalClassrooms = await this.prisma.classroom.count();
    const totalSessions = await this.prisma.attendanceSession.count();
    const totalAttendanceRecords = await this.prisma.attendanceRecord.count();
    const verifiedRecords = await this.prisma.attendanceRecord.count({ where: { status: 'VERIFIED' } });
    const suspiciousRecords = await this.prisma.attendanceRecord.count({ where: { status: 'SUSPICIOUS' } });
    const pendingCorrections = await this.prisma.attendanceCorrectionRequest.count({ where: { status: 'PENDING' } });

    const attendanceRate = totalAttendanceRecords > 0 ? Math.round((verifiedRecords / totalAttendanceRecords) * 1000) / 10 : 100;

    return {
      totalStudents,
      totalTeachers,
      totalClassrooms,
      totalSessions,
      totalAttendanceRecords,
      verifiedRecords,
      suspiciousRecords,
      pendingCorrections,
      attendanceRate,
    };
  }

  /**
   * List suspicious attendance incidents for review.
   */
  async getSuspiciousIncidents() {
    return this.prisma.attendanceRecord.findMany({
      where: {
        status: { in: ['SUSPICIOUS', 'REJECTED'] },
      },
      include: {
        student: {
          include: {
            user: true,
            department: true,
          },
        },
        session: {
          include: {
            subject: true,
            classroom: true,
          },
        },
      },
      orderBy: { markedAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Resolve suspicious attendance record.
   */
  async resolveSuspiciousRecord(recordId: string, adminId: string, resolution: 'VERIFIED' | 'REJECTED', note: string) {
    const record = await this.prisma.attendanceRecord.findUnique({
      where: { id: recordId },
    });

    if (!record) {
      throw new NotFoundException('Attendance record not found');
    }

    const updated = await this.prisma.attendanceRecord.update({
      where: { id: recordId },
      data: {
        status: resolution,
        reasonCode: `ADMIN_RESOLUTION (${resolution}): ${note}`,
      },
    });

    // Record audit log
    await this.prisma.attendanceAuditLog.create({
      data: {
        action: 'RESOLVE_SUSPICIOUS_ATTENDANCE',
        entityName: 'AttendanceRecord',
        entityId: recordId,
        actorId: adminId,
        oldValue: record.status,
        newValue: resolution,
      },
    });

    return updated;
  }

  /**
   * Classroom geofence configuration.
   */
  async createClassroom(data: { name: string; building: string; latitude: number; longitude: number; geofenceRadiusMeters?: number }) {
    return this.prisma.classroom.create({
      data: {
        name: data.name,
        building: data.building,
        latitude: data.latitude,
        longitude: data.longitude,
        geofenceRadiusMeters: data.geofenceRadiusMeters || 75,
      },
    });
  }

  async getAllClassrooms() {
    return this.prisma.classroom.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * System Audit Logs viewer.
   */
  async getAuditLogs(limit = 100) {
    return this.prisma.attendanceAuditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }
}
