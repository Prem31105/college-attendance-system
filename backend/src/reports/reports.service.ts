import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generates comprehensive attendance statistics for a student.
   */
  async getStudentAttendanceStats(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        department: true,
        enrollments: {
          include: {
            subject: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const subjectStats = [];
    let totalClassesHeldAll = 0;
    let totalClassesAttendedAll = 0;

    for (const enrollment of student.enrollments) {
      const subjectId = enrollment.subjectId;

      // Count total sessions held for this subject & section
      const totalSessions = await this.prisma.attendanceSession.count({
        where: {
          subjectId,
          sectionId: enrollment.sectionId,
          status: 'CLOSED',
        },
      });

      // Count attended sessions (status = VERIFIED)
      const verifiedRecords = await this.prisma.attendanceRecord.count({
        where: {
          studentId,
          session: {
            subjectId,
          },
          status: 'VERIFIED',
        },
      });

      const percentage = totalSessions > 0 ? Math.round((verifiedRecords / totalSessions) * 1000) / 10 : 100.0;

      subjectStats.push({
        subjectId,
        subjectCode: enrollment.subject.code,
        subjectName: enrollment.subject.name,
        credits: enrollment.subject.credits,
        totalSessions,
        attendedSessions: verifiedRecords,
        percentage,
        isShortage: percentage < 75.0, // Standard 75% attendance threshold
      });

      totalClassesHeldAll += totalSessions;
      totalClassesAttendedAll += verifiedRecords;
    }

    const overallPercentage =
      totalClassesHeldAll > 0
        ? Math.round((totalClassesAttendedAll / totalClassesHeldAll) * 1000) / 10
        : 100.0;

    return {
      student: {
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        rollNumber: student.rollNumber,
        department: student.department.name,
      },
      overall: {
        totalClassesHeld: totalClassesHeldAll,
        totalClassesAttended: totalClassesAttendedAll,
        overallPercentage,
        hasAttendanceShortage: overallPercentage < 75.0,
      },
      subjects: subjectStats,
    };
  }

  /**
   * Generates class-wide attendance report for a teacher / subject.
   */
  async getSubjectAttendanceReport(subjectId: string, sectionId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { subjectId, sectionId },
      include: {
        student: {
          include: { user: true },
        },
      },
    });

    const totalSessions = await this.prisma.attendanceSession.count({
      where: { subjectId, sectionId, status: 'CLOSED' },
    });

    const studentReports = [];

    for (const e of enrollments) {
      const attended = await this.prisma.attendanceRecord.count({
        where: {
          studentId: e.studentId,
          session: { subjectId, sectionId },
          status: 'VERIFIED',
        },
      });

      const percentage = totalSessions > 0 ? Math.round((attended / totalSessions) * 1000) / 10 : 0;

      studentReports.push({
        studentId: e.student.id,
        rollNumber: e.student.rollNumber,
        name: `${e.student.user.firstName} ${e.student.user.lastName}`,
        email: e.student.user.email,
        attended,
        totalSessions,
        percentage,
        status: percentage >= 75 ? 'ELIGIBLE' : 'SHORTAGE',
      });
    }

    return {
      subjectId,
      sectionId,
      totalSessionsHeld: totalSessions,
      students: studentReports,
    };
  }
}
