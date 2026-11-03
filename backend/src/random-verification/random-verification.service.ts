import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';
import { RandomVerificationStatus } from '@prisma/client';

@Injectable()
export class RandomVerificationService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  /**
   * Teacher triggers random verification challenge for a subset of students present in the session.
   */
  async triggerRandomVerification(sessionId: string, teacherId: string, sampleCount = 3) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        records: {
          where: { status: 'VERIFIED' },
          include: {
            student: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!session || session.teacherId !== teacherId) {
      throw new ForbiddenException('Only session instructor can initiate physical verification');
    }

    if (session.records.length === 0) {
      throw new BadRequestException('No verified student attendance records available to sample');
    }

    // Randomly sample students using Fisher-Yates shuffle
    const shuffled = [...session.records].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(sampleCount, shuffled.length));

    const challenges = [];
    for (const record of selected) {
      const challenge = await this.prisma.randomVerificationChallenge.create({
        data: {
          sessionId,
          studentId: record.studentId,
          status: RandomVerificationStatus.PENDING,
        },
        include: {
          student: {
            include: { user: true },
          },
        },
      });
      challenges.push(challenge);

      // Create Notification for the student
      await this.prisma.notification.create({
        data: {
          userId: record.student.userId,
          title: 'Physical Verification Request',
          message: 'Instructor has requested physical verification in the classroom. Please present yourself to the teacher.',
          type: 'VERIFICATION_ALERT',
        },
      });
    }

    // Broadcast challenge to live teacher dashboard
    this.eventsGateway.broadcastRandomVerification(sessionId, challenges);

    return {
      message: `Triggered random verification for ${challenges.length} student(s)`,
      challenges,
    };
  }

  /**
   * Teacher records outcome of physical check.
   */
  async recordOutcome(
    challengeId: string,
    teacherId: string,
    status: RandomVerificationStatus,
    notes?: string,
  ) {
    const challenge = await this.prisma.randomVerificationChallenge.findUnique({
      where: { id: challengeId },
      include: { session: true },
    });

    if (!challenge || challenge.session.teacherId !== teacherId) {
      throw new ForbiddenException('Instructor not authorized to update this verification challenge');
    }

    const updated = await this.prisma.randomVerificationChallenge.update({
      where: { id: challengeId },
      data: {
        status,
        verifiedByTeacherId: teacherId,
        verifiedAt: new Date(),
        notes,
      },
      include: {
        student: {
          include: { user: true },
        },
      },
    });

    // If student was marked ABSENT during physical check, update attendance record status to SUSPICIOUS or REJECTED
    if (status === RandomVerificationStatus.ABSENT) {
      await this.prisma.attendanceRecord.updateMany({
        where: {
          sessionId: challenge.sessionId,
          studentId: challenge.studentId,
        },
        data: {
          status: 'SUSPICIOUS',
          reasonCode: `FAILED_RANDOM_PHYSICAL_VERIFICATION: ${notes || 'Student absent during teacher physical check'}`,
        },
      });
    }

    return updated;
  }

  /**
   * Retrieves all random verification challenges for a session.
   */
  async getSessionChallenges(sessionId: string) {
    return this.prisma.randomVerificationChallenge.findMany({
      where: { sessionId },
      include: {
        student: {
          include: { user: true },
        },
      },
    });
  }
}
