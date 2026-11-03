import 'dart:math';
import 'package:flutter/foundation.dart';
import 'api_service.dart';

class NextClassImpact {
  final double ifAttended;
  final double ifMissed;
  final double deltaIfAttended;
  final double deltaIfMissed;

  const NextClassImpact({
    required this.ifAttended,
    required this.ifMissed,
    required this.deltaIfAttended,
    required this.deltaIfMissed,
  });

  factory NextClassImpact.fromJson(Map<String, dynamic> json) {
    return NextClassImpact(
      ifAttended: (json['ifAttended'] as num?)?.toDouble() ?? 100.0,
      ifMissed: (json['ifMissed'] as num?)?.toDouble() ?? 0.0,
      deltaIfAttended: (json['deltaIfAttended'] as num?)?.toDouble() ?? 0.0,
      deltaIfMissed: (json['deltaIfMissed'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class SubjectGuiderStat {
  final String subjectId;
  final String subjectCode;
  final String subjectName;
  final int credits;
  final int totalSessions;
  final int attendedSessions;
  final int missedSessions;
  final double percentage;
  final int safeBunks;
  final int requiredConsecutiveLectures;
  final String status; // 'HEALTHY' | 'BORDERLINE' | 'CRITICAL'
  final bool isShortage;
  final NextClassImpact nextClassImpact;
  final bool isDemoFixture;

  const SubjectGuiderStat({
    required this.subjectId,
    required this.subjectCode,
    required this.subjectName,
    required this.credits,
    required this.totalSessions,
    required this.attendedSessions,
    required this.missedSessions,
    required this.percentage,
    required this.safeBunks,
    required this.requiredConsecutiveLectures,
    required this.status,
    required this.isShortage,
    required this.nextClassImpact,
    this.isDemoFixture = false,
  });

  factory SubjectGuiderStat.fromJson(Map<String, dynamic> json, double target, {bool isDemo = false}) {
    final attended = (json['attendedSessions'] as num?)?.toInt() ?? 0;
    final total = (json['totalSessions'] as num?)?.toInt() ?? 0;
    final missed = (json['missedSessions'] as num?)?.toInt() ?? max(0, total - attended);
    final pct = (json['percentage'] as num?)?.toDouble() ??
        (total > 0 ? (attended / total * 100.0) : 100.0);

    final metrics = AttendanceGuiderService.calculatePredictiveMetrics(attended, total, target);

    return SubjectGuiderStat(
      subjectId: json['subjectId'] as String? ?? 'sub-${json['subjectCode']}',
      subjectCode: json['subjectCode'] as String? ?? 'CS000',
      subjectName: json['subjectName'] as String? ?? 'General Subject',
      credits: (json['credits'] as num?)?.toInt() ?? 3,
      totalSessions: total,
      attendedSessions: attended,
      missedSessions: missed,
      percentage: double.parse(pct.toStringAsFixed(1)),
      safeBunks: metrics['safeBunks'] as int,
      requiredConsecutiveLectures: metrics['requiredConsecutiveLectures'] as int,
      status: metrics['status'] as String,
      isShortage: pct < 75.0,
      nextClassImpact: json['nextClassImpact'] != null
          ? NextClassImpact.fromJson(json['nextClassImpact'] as Map<String, dynamic>)
          : metrics['nextClassImpact'] as NextClassImpact,
      isDemoFixture: isDemo,
    );
  }
}

class GuiderOverallSummary {
  final int totalClassesHeld;
  final int totalClassesAttended;
  final int totalClassesMissed;
  final double overallPercentage;
  final int safeBunks;
  final int requiredConsecutiveLectures;
  final String status;
  final bool hasAttendanceShortage;
  final int criticalSubjectsCount;
  final NextClassImpact nextClassImpact;

  const GuiderOverallSummary({
    required this.totalClassesHeld,
    required this.totalClassesAttended,
    required this.totalClassesMissed,
    required this.overallPercentage,
    required this.safeBunks,
    required this.requiredConsecutiveLectures,
    required this.status,
    required this.hasAttendanceShortage,
    required this.criticalSubjectsCount,
    required this.nextClassImpact,
  });
}

class AttendanceGuiderReport {
  final String studentName;
  final String rollNumber;
  final String department;
  final double targetPercentage;
  final GuiderOverallSummary overall;
  final List<SubjectGuiderStat> subjects;
  final List<String> recommendations;
  final bool isDemoMode;

  const AttendanceGuiderReport({
    required this.studentName,
    required this.rollNumber,
    required this.department,
    required this.targetPercentage,
    required this.overall,
    required this.subjects,
    required this.recommendations,
    this.isDemoMode = false,
  });
}

class AttendanceGuiderService {
  static final AttendanceGuiderService _instance = AttendanceGuiderService._internal();
  factory AttendanceGuiderService() => _instance;
  AttendanceGuiderService._internal();

  final ValueNotifier<double> targetNotifier = ValueNotifier<double>(75.0);

  /// Pure client-side predictive calculation matching backend mathematical algorithm:
  /// 1. Safe Bunks = floor((Attended - (Target * Total)) / Target)
  /// 2. Required Consecutive = ceil(((Target * Total) - Attended) / (1 - Target))
  /// 3. Next Class Impact (+1 attended vs +0 attended over Total + 1)
  static Map<String, dynamic> calculatePredictiveMetrics(
    int attended,
    int total,
    double targetPercentage,
  ) {
    final clampedTarget = targetPercentage.clamp(50.0, 95.0);
    final target = clampedTarget / 100.0;
    final currentPercentage = total > 0 ? (attended / total) * 100.0 : 100.0;

    int safeBunks = 0;
    int requiredConsecutiveLectures = 0;
    String status;

    if (currentPercentage >= clampedTarget) {
      if (total == 0) {
        safeBunks = 0;
      } else {
        final numerator = attended - (target * total);
        safeBunks = max(0, (numerator / target).floor());
      }
      status = currentPercentage >= (clampedTarget + 5.0) ? 'HEALTHY' : 'BORDERLINE';
    } else {
      final numerator = (target * total) - attended;
      final denominator = 1.0 - target;
      requiredConsecutiveLectures = max(0, (numerator / denominator).ceil());
      status = 'CRITICAL';
    }

    final nextTotal = total + 1;
    final ifAttended = ((attended + 1) / nextTotal) * 100.0;
    final ifMissed = (attended / nextTotal) * 100.0;
    final deltaIfAttended = ifAttended - currentPercentage;
    final deltaIfMissed = ifMissed - currentPercentage;

    return {
      'currentPercentage': double.parse(currentPercentage.toStringAsFixed(1)),
      'targetPercentage': clampedTarget,
      'safeBunks': safeBunks,
      'requiredConsecutiveLectures': requiredConsecutiveLectures,
      'status': status,
      'nextClassImpact': NextClassImpact(
        ifAttended: double.parse(ifAttended.toStringAsFixed(1)),
        ifMissed: double.parse(ifMissed.toStringAsFixed(1)),
        deltaIfAttended: double.parse(deltaIfAttended.toStringAsFixed(1)),
        deltaIfMissed: double.parse(deltaIfMissed.toStringAsFixed(1)),
      ),
    };
  }

  /// Recalculates an entire report in-memory when the target threshold changes
  AttendanceGuiderReport recalculateReport(AttendanceGuiderReport original, double newTarget) {
    final updatedSubjects = original.subjects.map((s) {
      final m = calculatePredictiveMetrics(s.attendedSessions, s.totalSessions, newTarget);
      return SubjectGuiderStat(
        subjectId: s.subjectId,
        subjectCode: s.subjectCode,
        subjectName: s.subjectName,
        credits: s.credits,
        totalSessions: s.totalSessions,
        attendedSessions: s.attendedSessions,
        missedSessions: s.missedSessions,
        percentage: s.percentage,
        safeBunks: m['safeBunks'] as int,
        requiredConsecutiveLectures: m['requiredConsecutiveLectures'] as int,
        status: m['status'] as String,
        isShortage: s.percentage < 75.0,
        nextClassImpact: m['nextClassImpact'] as NextClassImpact,
        isDemoFixture: s.isDemoFixture,
      );
    }).toList();

    int totalHeld = 0;
    int totalAttended = 0;
    int criticalCount = 0;
    final List<String> criticalRecs = [];
    final List<String> borderlineRecs = [];
    final List<String> safeRecs = [];

    for (final s in updatedSubjects) {
      totalHeld += s.totalSessions;
      totalAttended += s.attendedSessions;
      if (s.status == 'CRITICAL') {
        criticalCount++;
        criticalRecs.add(
          '🚨 ${s.subjectCode}: Attendance is critical at ${s.percentage}%. Attend next ${s.requiredConsecutiveLectures} lectures to reach ${newTarget.toStringAsFixed(0)}%.',
        );
      } else if (s.status == 'BORDERLINE') {
        borderlineRecs.add(
          '⚠️ ${s.subjectCode}: Attendance is borderline at ${s.percentage}%. Missing the next class will cause a ${s.nextClassImpact.deltaIfMissed.abs()}% drop.',
        );
      } else {
        safeRecs.add(
          '✅ ${s.subjectCode}: Secure at ${s.percentage}%. You have ${s.safeBunks} safe bunk credit(s) available.',
        );
      }
    }

    final overallMetrics = calculatePredictiveMetrics(totalAttended, totalHeld, newTarget);
    final overallMissed = max(0, totalHeld - totalAttended);

    final recommendations = [
      ...criticalRecs,
      ...borderlineRecs,
      ...safeRecs,
    ];

    if (recommendations.isEmpty) {
      recommendations.add(
        'All subjects are in good standing. Maintain regular attendance to keep your semester average above ${newTarget.toStringAsFixed(0)}%.',
      );
    }

    return AttendanceGuiderReport(
      studentName: original.studentName,
      rollNumber: original.rollNumber,
      department: original.department,
      targetPercentage: newTarget,
      overall: GuiderOverallSummary(
        totalClassesHeld: totalHeld,
        totalClassesAttended: totalAttended,
        totalClassesMissed: overallMissed,
        overallPercentage: overallMetrics['currentPercentage'] as double,
        safeBunks: overallMetrics['safeBunks'] as int,
        requiredConsecutiveLectures: overallMetrics['requiredConsecutiveLectures'] as int,
        status: overallMetrics['status'] as String,
        hasAttendanceShortage: (overallMetrics['currentPercentage'] as double) < 75.0,
        criticalSubjectsCount: criticalCount,
        nextClassImpact: overallMetrics['nextClassImpact'] as NextClassImpact,
      ),
      subjects: updatedSubjects,
      recommendations: recommendations,
      isDemoMode: original.isDemoMode,
    );
  }

  /// Fetches real guider statistics from the backend (PostgreSQL verified records only),
  /// or returns clearly isolated demo fixtures when offline.
  Future<AttendanceGuiderReport> fetchReport({double targetPercentage = 75.0}) async {
    final response = await ApiService().getAttendanceGuider(targetPercentage);
    if (response['success'] == true && response['data'] != null) {
      final data = response['data'] as Map<String, dynamic>;
      final student = data['student'] as Map<String, dynamic>? ?? {};
      final overallData = data['overall'] as Map<String, dynamic>? ?? {};
      final subjectsList = (data['subjects'] as List<dynamic>? ?? []);
      final recommendationsList = (data['recommendations'] as List<dynamic>? ?? [])
          .map((e) => e.toString())
          .toList();

      // STRICT: Map ONLY the actual backend records returned from PostgreSQL
      final subjects = subjectsList
          .map((s) => SubjectGuiderStat.fromJson(s as Map<String, dynamic>, targetPercentage, isDemo: false))
          .toList();

      final report = AttendanceGuiderReport(
        studentName: student['name'] ?? 'John Doe',
        rollNumber: student['rollNumber'] ?? 'CS2026-001',
        department: student['department'] ?? 'Computer Science and Engineering',
        targetPercentage: targetPercentage,
        overall: GuiderOverallSummary(
          totalClassesHeld: (overallData['totalClassesHeld'] as num?)?.toInt() ?? 0,
          totalClassesAttended: (overallData['totalClassesAttended'] as num?)?.toInt() ?? 0,
          totalClassesMissed: (overallData['totalClassesMissed'] as num?)?.toInt() ?? 0,
          overallPercentage: (overallData['overallPercentage'] as num?)?.toDouble() ?? 100.0,
          safeBunks: (overallData['safeBunks'] as num?)?.toInt() ?? 0,
          requiredConsecutiveLectures:
              (overallData['requiredConsecutiveLectures'] as num?)?.toInt() ?? 0,
          status: overallData['status'] as String? ?? 'HEALTHY',
          hasAttendanceShortage: overallData['hasAttendanceShortage'] == true,
          criticalSubjectsCount: (overallData['criticalSubjectsCount'] as num?)?.toInt() ?? 0,
          nextClassImpact: overallData['nextClassImpact'] != null
              ? NextClassImpact.fromJson(overallData['nextClassImpact'] as Map<String, dynamic>)
              : const NextClassImpact(ifAttended: 100, ifMissed: 90, deltaIfAttended: 0, deltaIfMissed: -10),
        ),
        subjects: subjects,
        recommendations: recommendationsList,
        isDemoMode: false, // Live verified backend records
      );

      return recalculateReport(report, targetPercentage);
    }

    // Isolated offline fallback demo report
    return _getDefaultFallbackReport(targetPercentage);
  }

  /// Isolated offline demo fixtures, clearly marked as isDemoMode: true
  AttendanceGuiderReport _getDefaultFallbackReport(double target) {
    final subjects = [
      SubjectGuiderStat.fromJson({
        'subjectId': 'demo-cs601',
        'subjectCode': 'CS601',
        'subjectName': 'Advanced Distributed Systems',
        'credits': 4,
        'totalSessions': 10,
        'attendedSessions': 10,
      }, target, isDemo: true),
      SubjectGuiderStat.fromJson({
        'subjectId': 'demo-cs602',
        'subjectCode': 'CS602',
        'subjectName': 'Cryptography & Network Security',
        'credits': 4,
        'totalSessions': 10,
        'attendedSessions': 7,
      }, target, isDemo: true),
    ];

    final report = AttendanceGuiderReport(
      studentName: 'John Doe',
      rollNumber: 'CS2026-001',
      department: 'Computer Science and Engineering',
      targetPercentage: target,
      overall: const GuiderOverallSummary(
        totalClassesHeld: 20,
        totalClassesAttended: 17,
        totalClassesMissed: 3,
        overallPercentage: 85.0,
        safeBunks: 2,
        requiredConsecutiveLectures: 0,
        status: 'HEALTHY',
        hasAttendanceShortage: false,
        criticalSubjectsCount: 1,
        nextClassImpact: NextClassImpact(ifAttended: 85.7, ifMissed: 81.0, deltaIfAttended: 0.7, deltaIfMissed: -4.0),
      ),
      subjects: subjects,
      recommendations: [],
      isDemoMode: true, // Clearly isolated as demo fixture
    );

    return recalculateReport(report, target);
  }
}
