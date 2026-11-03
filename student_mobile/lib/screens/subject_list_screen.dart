import 'package:flutter/material.dart';
import '../core/services/attendance_guider_service.dart';

class SubjectListScreen extends StatefulWidget {
  const SubjectListScreen({super.key});

  @override
  State<SubjectListScreen> createState() => _SubjectListScreenState();
}

class _SubjectListScreenState extends State<SubjectListScreen> {
  final AttendanceGuiderService _guiderService = AttendanceGuiderService();
  AttendanceGuiderReport? _report;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSubjects();
  }

  Future<void> _loadSubjects() async {
    setState(() => _isLoading = true);
    final report = await _guiderService.fetchReport();
    if (mounted) {
      setState(() {
        _report = report;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Enrolled Subjects'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Sync Subjects',
            onPressed: _loadSubjects,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF22C55E)))
          : _report == null || _report!.subjects.isEmpty
              ? const Center(child: Text('No enrolled subjects found.'))
              : RefreshIndicator(
                  color: const Color(0xFF22C55E),
                  onRefresh: _loadSubjects,
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _report!.subjects.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final s = _report!.subjects[index];
                      final isShortage = s.isShortage;
                      final statusColor = isShortage
                          ? Colors.redAccent
                          : (s.status == 'BORDERLINE' ? Colors.amber : const Color(0xFF22C55E));

                      return Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Text(
                                          s.subjectCode,
                                          style: TextStyle(
                                            color: statusColor,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 12,
                                          ),
                                        ),
                                        if (s.isDemoFixture) ...[
                                          const SizedBox(width: 6),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                            decoration: BoxDecoration(
                                              color: Colors.amber.withValues(alpha: 0.2),
                                              borderRadius: BorderRadius.circular(4),
                                            ),
                                            child: const Text('DEMO', style: TextStyle(color: Colors.amber, fontSize: 9)),
                                          ),
                                        ],
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      s.subjectName,
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      '${s.credits} Credits • Attended: ${s.attendedSessions}/${s.totalSessions}',
                                      style: const TextStyle(color: Colors.grey, fontSize: 12),
                                    ),
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    '${s.percentage.toStringAsFixed(1)}%',
                                    style: TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                      color: statusColor,
                                    ),
                                  ),
                                  Text(
                                    isShortage ? 'Shortage' : s.status,
                                    style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.w600),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
