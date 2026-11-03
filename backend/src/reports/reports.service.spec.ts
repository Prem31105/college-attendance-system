import { NotFoundException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ReportsService - Predictive Guider & Analytics', () => {
  let service: ReportsService;
  let mockPrismaService: any;

  beforeEach(() => {
    mockPrismaService = {
      student: {
        findUnique: jest.fn(),
      },
      attendanceSession: {
        count: jest.fn(),
      },
      attendanceRecord: {
        count: jest.fn(),
      },
    };

    service = new ReportsService(mockPrismaService as PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculatePredictiveMetrics()', () => {
    it('calculates safe bunks accurately when attendance exceeds target (75%)', () => {
      // 31 attended out of 34 total held = 91.2%
      // Safe Bunks = floor((31 - 0.75 * 34) / 0.75) = floor(5.5 / 0.75) = 7
      const metrics = service.calculatePredictiveMetrics(31, 34, 75.0);

      expect(metrics.currentPercentage).toBe(91.2);
      expect(metrics.safeBunks).toBe(7);
      expect(metrics.requiredConsecutiveLectures).toBe(0);
      expect(metrics.status).toBe('HEALTHY');

      // Verify that after 7 bunks, attendance is still >= 75%
      const afterBunks = (31 / (34 + 7)) * 100;
      expect(afterBunks).toBeGreaterThanOrEqual(75.0);

      // Verify that 8 bunks would drop below 75%
      const afterOverBunk = (31 / (34 + 8)) * 100;
      expect(afterOverBunk).toBeLessThan(75.0);
    });

    it('calculates required consecutive lectures accurately when attendance is below target (75%)', () => {
      // 16 attended out of 24 total held = 66.7%
      // Required = ceil((0.75 * 24 - 16) / (1 - 0.75)) = ceil(2 / 0.25) = 8
      const metrics = service.calculatePredictiveMetrics(16, 24, 75.0);

      expect(metrics.currentPercentage).toBe(66.7);
      expect(metrics.safeBunks).toBe(0);
      expect(metrics.requiredConsecutiveLectures).toBe(8);
      expect(metrics.status).toBe('CRITICAL');

      // Verify that attending 8 consecutive classes reaches target
      const afterRecovery = ((16 + 8) / (24 + 8)) * 100;
      expect(afterRecovery).toBeGreaterThanOrEqual(75.0);

      // Verify that attending 7 consecutive classes would still be under target
      const underRecovery = ((16 + 7) / (24 + 7)) * 100;
      expect(underRecovery).toBeLessThan(75.0);
    });

    it('identifies borderline attendance right at target threshold', () => {
      // 18 attended out of 24 held = 75.0%
      const metrics = service.calculatePredictiveMetrics(18, 24, 75.0);

      expect(metrics.currentPercentage).toBe(75.0);
      expect(metrics.safeBunks).toBe(0);
      expect(metrics.requiredConsecutiveLectures).toBe(0);
      expect(metrics.status).toBe('BORDERLINE');
    });

    it('calculates next class impact correctly', () => {
      // 18 attended out of 24 held
      // Next: 25 total. If attended: 19/25 = 76.0%. If missed: 18/25 = 72.0%
      const metrics = service.calculatePredictiveMetrics(18, 24, 75.0);

      expect(metrics.nextClassImpact.ifAttended).toBe(76.0);
      expect(metrics.nextClassImpact.ifMissed).toBe(72.0);
      expect(metrics.nextClassImpact.deltaIfAttended).toBe(1.0);
      expect(metrics.nextClassImpact.deltaIfMissed).toBe(-3.0);
    });

    it('handles zero sessions gracefully', () => {
      const metrics = service.calculatePredictiveMetrics(0, 0, 75.0);

      expect(metrics.currentPercentage).toBe(100.0);
      expect(metrics.safeBunks).toBe(0);
      expect(metrics.requiredConsecutiveLectures).toBe(0);
      expect(metrics.status).toBe('HEALTHY');
      expect(metrics.nextClassImpact.ifAttended).toBe(100.0);
      expect(metrics.nextClassImpact.ifMissed).toBe(0.0);
    });

    it('clamps target percentage within valid operational bounds [50%, 95%]', () => {
      const lowTarget = service.calculatePredictiveMetrics(10, 20, 30.0);
      expect(lowTarget.targetPercentage).toBe(50.0);

      const highTarget = service.calculatePredictiveMetrics(10, 20, 99.0);
      expect(highTarget.targetPercentage).toBe(95.0);
    });
  });

  describe('getStudentAttendanceGuider()', () => {
    it('throws NotFoundException if student does not exist', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue(null);

      await expect(service.getStudentAttendanceGuider('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns structured guider report with recommendations for enrolled student', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue({
        id: 'stud-123',
        rollNumber: 'CS2026-001',
        user: { firstName: 'Aarav', lastName: 'Sharma' },
        department: { name: 'Computer Science and Engineering' },
        enrollments: [
          {
            subjectId: 'sub-601',
            sectionId: 'sec-a',
            subject: { code: 'CS601', name: 'Advanced Distributed Systems', credits: 4 },
          },
          {
            subjectId: 'sub-602',
            sectionId: 'sec-a',
            subject: { code: 'CS602', name: 'Cryptography', credits: 4 },
          },
        ],
      });

      // Session counts: CS601 = 34 sessions, CS602 = 24 sessions
      mockPrismaService.attendanceSession.count
        .mockResolvedValueOnce(34)
        .mockResolvedValueOnce(24);

      // Verified records: CS601 = 31 attended, CS602 = 16 attended
      mockPrismaService.attendanceRecord.count
        .mockResolvedValueOnce(31)
        .mockResolvedValueOnce(16);

      const report = await service.getStudentAttendanceGuider('stud-123', 75.0);

      expect(report.student.rollNumber).toBe('CS2026-001');
      expect(report.targetPercentage).toBe(75.0);
      expect(report.subjects).toHaveLength(2);

      // Subject 1: CS601
      expect(report.subjects[0].subjectCode).toBe('CS601');
      expect(report.subjects[0].percentage).toBe(91.2);
      expect(report.subjects[0].safeBunks).toBe(7);
      expect(report.subjects[0].status).toBe('HEALTHY');

      // Subject 2: CS602
      expect(report.subjects[1].subjectCode).toBe('CS602');
      expect(report.subjects[1].percentage).toBe(66.7);
      expect(report.subjects[1].requiredConsecutiveLectures).toBe(8);
      expect(report.subjects[1].status).toBe('CRITICAL');

      // Overall: 31 + 16 = 47 attended / 34 + 24 = 58 total = 81.0%
      expect(report.overall.totalClassesHeld).toBe(58);
      expect(report.overall.totalClassesAttended).toBe(47);
      expect(report.overall.overallPercentage).toBe(81.0);
      expect(report.overall.criticalSubjectsCount).toBe(1);

      // Recommendations list should contain alert for CS602 and praise for CS601
      expect(report.recommendations.some((r: string) => r.includes('CS602'))).toBe(true);
      expect(report.recommendations.some((r: string) => r.includes('CS601'))).toBe(true);
    });
  });
});
