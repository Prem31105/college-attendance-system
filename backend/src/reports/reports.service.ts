import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface NextClassImpact {
  ifAttended: number;
  ifMissed: number;
  deltaIfAttended: number;
  deltaIfMissed: number;
}

export interface PredictiveMetrics {
  currentPercentage: number;
  targetPercentage: number;
  safeBunks: number;
  requiredConsecutiveLectures: number;
  status: 'HEALTHY' | 'BORDERLINE' | 'CRITICAL';
  nextClassImpact: NextClassImpact;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Pure mathematical calculation of predictive attendance metrics:
   * 1. Safe Bunks = floor((Attended - (Target * Total)) / Target)
   * 2. Required Consecutive Lectures = ceil(((Target * Total) - Attended) / (1 - Target))
   * 3. Next Class Impact (+1 attended vs +0 attended over Total + 1)
   */
  calculatePredictiveMetrics(
    attended: number,
    total: number,
    targetPercentage: number = 75.0,
  ): PredictiveMetrics {
    // Clamp target percentage between 50% and 95%
    const targetPct = Math.min(Math.max(targetPercentage, 50.0), 95.0);
    const target = targetPct / 100.0;
    const currentPercentage =
      total > 0 ? Math.round((attended / total) * 1000) / 10 : 100.0;

    let safeBunks = 0;
    let requiredConsecutiveLectures = 0;
    let status: 'HEALTHY' | 'BORDERLINE' | 'CRITICAL';

    if (currentPercentage >= targetPct) {
      // Current attendance meets or exceeds target
      if (total === 0) {
        safeBunks = 0;
      } else {
        const numerator = attended - target * total;
        safeBunks = Math.max(0, Math.floor(numerator / target));
      }
      status = currentPercentage >= targetPct + 5.0 ? 'HEALTHY' : 'BORDERLINE';
    } else {
      // Current attendance is below target
      const numerator = target * total - attended;
      const denominator = 1.0 - target;
      requiredConsecutiveLectures = Math.max(0, Math.ceil(numerator / denominator));
      status = 'CRITICAL';
    }

    // Calculate impact of the next upcoming class
    const nextTotal = total + 1;
    const ifAttended = Math.round(((attended + 1) / nextTotal) * 1000) / 10;
    const ifMissed = Math.round((attended / nextTotal) * 1000) / 10;
    const deltaIfAttended = Math.round((ifAttended - currentPercentage) * 10) / 10;
    const deltaIfMissed = Math.round((ifMissed - currentPercentage) * 10) / 10;

    return {
      currentPercentage,
      targetPercentage: targetPct,
      safeBunks,
      requiredConsecutiveLectures,
      status,
      nextClassImpact: {
        ifAttended,
        ifMissed,
        deltaIfAttended,
        deltaIfMissed,
      },
    };
  }

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

      const percentage =
        totalSessions > 0 ? Math.round((verifiedRecords / totalSessions) * 1000) / 10 : 100.0;

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
   * Generates Smart Attendance Guider report with predictive bunking & recovery recommendations.
   */
  async getStudentAttendanceGuider(studentId: string, targetPercentage: number = 75.0) {
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

    const targetPct = Math.min(Math.max(targetPercentage, 50.0), 95.0);
    const subjectStats = [];
    let totalClassesHeldAll = 0;
    let totalClassesAttendedAll = 0;
    let criticalCount = 0;

    const criticalRecommendations: string[] = [];
    const borderlineRecommendations: string[] = [];
    const safeRecommendations: string[] = [];

    for (const enrollment of student.enrollments) {
      const subjectId = enrollment.subjectId;

      const totalSessions = await this.prisma.attendanceSession.count({
        where: {
          subjectId,
          sectionId: enrollment.sectionId,
          status: 'CLOSED',
        },
      });

      const verifiedRecords = await this.prisma.attendanceRecord.count({
        where: {
          studentId,
          session: {
            subjectId,
          },
          status: 'VERIFIED',
        },
      });

      const metrics = this.calculatePredictiveMetrics(
        verifiedRecords,
        totalSessions,
        targetPct,
      );

      const missedSessions = Math.max(0, totalSessions - verifiedRecords);

      subjectStats.push({
        subjectId,
        subjectCode: enrollment.subject.code,
        subjectName: enrollment.subject.name,
        credits: enrollment.subject.credits,
        totalSessions,
        attendedSessions: verifiedRecords,
        missedSessions,
        percentage: metrics.currentPercentage,
        safeBunks: metrics.safeBunks,
        requiredConsecutiveLectures: metrics.requiredConsecutiveLectures,
        status: metrics.status,
        nextClassImpact: metrics.nextClassImpact,
        isShortage: metrics.currentPercentage < 75.0,
      });

      totalClassesHeldAll += totalSessions;
      totalClassesAttendedAll += verifiedRecords;

      if (metrics.status === 'CRITICAL') {
        criticalCount++;
        criticalRecommendations.push(
          `🚨 ${enrollment.subject.code}: Attendance is critical at ${metrics.currentPercentage}%. Attend the next ${metrics.requiredConsecutiveLectures} consecutive lectures to reach your ${targetPct}% target.`,
        );
      } else if (metrics.status === 'BORDERLINE') {
        borderlineRecommendations.push(
          `⚠️ ${enrollment.subject.code}: Attendance is borderline at ${metrics.currentPercentage}%. Missing the next class will cause a ${Math.abs(metrics.nextClassImpact.deltaIfMissed)}% drop.`,
        );
      } else {
        safeRecommendations.push(
          `✅ ${enrollment.subject.code}: Secure at ${metrics.currentPercentage}%. You have ${metrics.safeBunks} safe bunk credit(s) available.`,
        );
      }
    }

    const overallMetrics = this.calculatePredictiveMetrics(
      totalClassesAttendedAll,
      totalClassesHeldAll,
      targetPct,
    );

    const overallMissed = Math.max(0, totalClassesHeldAll - totalClassesAttendedAll);

    // Compile prioritized recommendations
    const allRecommendations = [
      ...criticalRecommendations,
      ...borderlineRecommendations,
      ...safeRecommendations,
    ];

    if (allRecommendations.length === 0) {
      allRecommendations.push(
        `All attendance records are in good standing. Maintain regular attendance to keep your semester average above ${targetPct}%.`,
      );
    }

    return {
      student: {
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        rollNumber: student.rollNumber,
        department: student.department.name,
      },
      targetPercentage: targetPct,
      overall: {
        totalClassesHeld: totalClassesHeldAll,
        totalClassesAttended: totalClassesAttendedAll,
        totalClassesMissed: overallMissed,
        overallPercentage: overallMetrics.currentPercentage,
        safeBunks: overallMetrics.safeBunks,
        requiredConsecutiveLectures: overallMetrics.requiredConsecutiveLectures,
        status: overallMetrics.status,
        hasAttendanceShortage: overallMetrics.currentPercentage < 75.0,
        criticalSubjectsCount: criticalCount,
        nextClassImpact: overallMetrics.nextClassImpact,
      },
      subjects: subjectStats,
      recommendations: allRecommendations,
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

  /**
   * Generates department-wide attendance audit and compliance report.
   */
  async getDepartmentComplianceReport(departmentId?: string) {
    const students = await this.prisma.student.findMany({
      where: departmentId ? { departmentId } : {},
      include: {
        user: true,
        department: true,
        enrollments: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: { rollNumber: 'asc' },
    });

    const studentSummaries = [];
    let compliantCount = 0;
    let shortageCount = 0;

    for (const student of students) {
      const subjectIds = student.enrollments.map((e) => e.subjectId);

      const totalHeld = await this.prisma.attendanceSession.count({
        where: {
          subjectId: { in: subjectIds },
          sectionId: student.sectionId,
          status: 'CLOSED',
        },
      });

      const totalAttended = await this.prisma.attendanceRecord.count({
        where: {
          studentId: student.id,
          status: 'VERIFIED',
        },
      });

      const percentage = totalHeld > 0 ? Math.round((totalAttended / totalHeld) * 1000) / 10 : 100.0;
      const isShortage = percentage < 75.0;

      if (isShortage) {
        shortageCount++;
      } else {
        compliantCount++;
      }

      const predictive = this.calculatePredictiveMetrics(totalAttended, totalHeld, 75.0);

      studentSummaries.push({
        studentId: student.id,
        rollNumber: student.rollNumber,
        name: `${student.user.firstName} ${student.user.lastName}`,
        email: student.user.email,
        department: student.department.name,
        departmentCode: student.department.code,
        classesHeld: totalHeld,
        classesAttended: totalAttended,
        classesMissed: Math.max(0, totalHeld - totalAttended),
        percentage,
        status: isShortage ? 'CRITICAL_SHORTAGE' : 'COMPLIANT',
        safeBunks: predictive.safeBunks,
        requiredRecoveryLectures: predictive.requiredConsecutiveLectures,
      });
    }

    const totalStudents = students.length;
    const complianceRate = totalStudents > 0 ? Math.round((compliantCount / totalStudents) * 1000) / 10 : 100.0;

    return {
      departmentId: departmentId || 'ALL_DEPARTMENTS',
      totalStudents,
      compliantStudents: compliantCount,
      shortageStudents: shortageCount,
      complianceRate,
      generatedAt: new Date().toISOString(),
      students: studentSummaries,
    };
  }

  /**
   * Generates RFC 4180 compliant CSV export of student attendance.
   */
  async exportComplianceCsv(departmentId?: string): Promise<string> {
    const report = await this.getDepartmentComplianceReport(departmentId);

    const headers = [
      'Roll Number',
      'Student Name',
      'Email',
      'Department',
      'Classes Held',
      'Classes Attended',
      'Classes Missed',
      'Percentage (%)',
      'Compliance Status',
      'Safe Bunks (at 75%)',
      'Required Recovery Lectures',
    ];

    const rows = report.students.map((s) => [
      `"${s.rollNumber}"`,
      `"${s.name}"`,
      `"${s.email}"`,
      `"${s.department}"`,
      s.classesHeld,
      s.classesAttended,
      s.classesMissed,
      `${s.percentage}%`,
      `"${s.status}"`,
      s.safeBunks,
      s.requiredRecoveryLectures,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  }

  /**
   * Generates CSV export containing only students with attendance shortfall (<75%).
   */
  async exportShortageCsv(departmentId?: string): Promise<string> {
    const report = await this.getDepartmentComplianceReport(departmentId);
    const shortageStudents = report.students.filter((s) => s.percentage < 75.0);

    const headers = [
      'Roll Number',
      'Student Name',
      'Email',
      'Department',
      'Classes Held',
      'Classes Attended',
      'Attendance (%)',
      'Mandatory Target',
      'Required Consecutive Lectures to Qualify',
      'Shortage Warning',
    ];

    const rows = shortageStudents.map((s) => [
      `"${s.rollNumber}"`,
      `"${s.name}"`,
      `"${s.email}"`,
      `"${s.department}"`,
      s.classesHeld,
      s.classesAttended,
      `${s.percentage}%`,
      '75%',
      s.requiredRecoveryLectures,
      '"CRITICAL: Risk of semester examination detention"',
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  }
}
