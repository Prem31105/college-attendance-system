import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:student_mobile/core/services/attendance_guider_service.dart';
import 'package:student_mobile/screens/subject_statistics_screen.dart';

void main() {
  group('AttendanceGuiderService Mathematical Calculations', () {
    test('calculates safe bunks accurately when attendance exceeds target (75%)', () {
      // 31 attended out of 34 = 91.2%
      // Safe Bunks = floor((31 - 0.75 * 34) / 0.75) = floor(5.5 / 0.75) = 7
      final metrics = AttendanceGuiderService.calculatePredictiveMetrics(31, 34, 75.0);

      expect(metrics['currentPercentage'], 91.2);
      expect(metrics['safeBunks'], 7);
      expect(metrics['requiredConsecutiveLectures'], 0);
      expect(metrics['status'], 'HEALTHY');

      // Verify mathematical invariant: attending 31 out of (34 + 7) = 31/41 = 75.61% >= 75%
      const afterBunks = (31 / 41) * 100.0;
      expect(afterBunks, greaterThanOrEqualTo(75.0));

      // 8 bunks would drop below 75%: 31/42 = 73.8%
      const afterOverBunk = (31 / 42) * 100.0;
      expect(afterOverBunk, lessThan(75.0));
    });

    test('calculates required consecutive lectures when attendance is below target (75%)', () {
      // 16 attended out of 24 = 66.7%
      // Required = ceil((0.75 * 24 - 16) / (1 - 0.75)) = ceil(2 / 0.25) = 8
      final metrics = AttendanceGuiderService.calculatePredictiveMetrics(16, 24, 75.0);

      expect(metrics['currentPercentage'], 66.7);
      expect(metrics['safeBunks'], 0);
      expect(metrics['requiredConsecutiveLectures'], 8);
      expect(metrics['status'], 'CRITICAL');

      // Verify mathematical invariant: attending next 8 in a row: 24/32 = 75.0%
      const afterRecovery = ((16 + 8) / (24 + 8)) * 100.0;
      expect(afterRecovery, greaterThanOrEqualTo(75.0));

      // Attending only 7 would be 23/31 = 74.19% < 75%
      const underRecovery = ((16 + 7) / (24 + 7)) * 100.0;
      expect(underRecovery, lessThan(75.0));
    });

    test('identifies borderline attendance exactly at target', () {
      // 18 attended out of 24 = 75.0%
      final metrics = AttendanceGuiderService.calculatePredictiveMetrics(18, 24, 75.0);

      expect(metrics['currentPercentage'], 75.0);
      expect(metrics['safeBunks'], 0);
      expect(metrics['requiredConsecutiveLectures'], 0);
      expect(metrics['status'], 'BORDERLINE');
    });

    test('calculates next class impact metrics correctly', () {
      // 18 attended out of 24
      // Next: 25 total. If attended: 19/25 = 76.0%. If missed: 18/25 = 72.0%
      final metrics = AttendanceGuiderService.calculatePredictiveMetrics(18, 24, 75.0);
      final impact = metrics['nextClassImpact'] as NextClassImpact;

      expect(impact.ifAttended, 76.0);
      expect(impact.ifMissed, 72.0);
      expect(impact.deltaIfAttended, 1.0);
      expect(impact.deltaIfMissed, -3.0);
    });

    test('handles zero total sessions without division by zero', () {
      final metrics = AttendanceGuiderService.calculatePredictiveMetrics(0, 0, 75.0);

      expect(metrics['currentPercentage'], 100.0);
      expect(metrics['safeBunks'], 0);
      expect(metrics['requiredConsecutiveLectures'], 0);
      expect(metrics['status'], 'HEALTHY');
    });

    test('clamps target percentage between 50% and 95%', () {
      final low = AttendanceGuiderService.calculatePredictiveMetrics(10, 20, 25.0);
      expect(low['targetPercentage'], 50.0);

      final high = AttendanceGuiderService.calculatePredictiveMetrics(10, 20, 99.0);
      expect(high['targetPercentage'], 95.0);
    });

    test('recalculates report in-memory when target increases from 75% to 85%', () {
      final service = AttendanceGuiderService();
      final report75 = service.recalculateReport(
        AttendanceGuiderReport(
          studentName: 'Test Student',
          rollNumber: 'CS2026-001',
          department: 'CSE',
          targetPercentage: 75.0,
          overall: const GuiderOverallSummary(
            totalClassesHeld: 58,
            totalClassesAttended: 47,
            totalClassesMissed: 11,
            overallPercentage: 81.0,
            safeBunks: 4,
            requiredConsecutiveLectures: 0,
            status: 'HEALTHY',
            hasAttendanceShortage: false,
            criticalSubjectsCount: 0,
            nextClassImpact: NextClassImpact(ifAttended: 81.4, ifMissed: 79.7, deltaIfAttended: 0.4, deltaIfMissed: -1.3),
          ),
          subjects: [
            SubjectGuiderStat.fromJson({
              'subjectId': 'sub-1',
              'subjectCode': 'CS601',
              'subjectName': 'ADS',
              'credits': 4,
              'totalSessions': 34,
              'attendedSessions': 31,
            }, 75.0),
          ],
          recommendations: [],
        ),
        85.0,
      );

      expect(report75.targetPercentage, 85.0);
      expect(report75.subjects[0].safeBunks, lessThan(7)); // Safe bunks reduce when target increases
    });
  });

  group('SubjectStatisticsScreen Widget Tests', () {
    testWidgets('renders target presets, overall attendance, and subject cards', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: SubjectStatisticsScreen(),
        ),
      );

      // Allow async initial load
      await tester.pumpAndSettle();

      // Check AppBar title
      expect(find.text('Attendance Guider & Target'), findsOneWidget);

      // Check Configurable Semester Target card and presets
      expect(find.text('Configurable Semester Target'), findsOneWidget);
      expect(find.text('70%'), findsOneWidget);
      expect(find.text('75%'), findsWidgets); // Header pill and preset
      expect(find.text('80%'), findsOneWidget);
      expect(find.text('85%'), findsWidgets); // Preset and overall attendance
      expect(find.text('90%'), findsOneWidget);

      // Check Overall Semester Attendance title
      expect(find.text('Overall Semester Attendance'), findsOneWidget);

      // Check Subject code rendering (e.g. CS601, CS602)
      expect(find.text('CS601'), findsOneWidget);

      // Check Smart Semester Recommendations section
      expect(find.text('Smart Semester Recommendations'), findsOneWidget);
    });

    testWidgets('tapping target preset 80% updates active quota', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: SubjectStatisticsScreen(),
        ),
      );

      await tester.pumpAndSettle();

      // Tap on the 80% preset
      await tester.tap(find.text('80%'));
      await tester.pumpAndSettle();

      // Verify that header pill now shows '80% Quota'
      expect(find.text('80% Quota'), findsOneWidget);
    });
  });
}
