import 'package:flutter/material.dart';
import '../core/services/attendance_guider_service.dart';

class SubjectStatisticsScreen extends StatefulWidget {
  const SubjectStatisticsScreen({super.key});

  @override
  State<SubjectStatisticsScreen> createState() => _SubjectStatisticsScreenState();
}

class _SubjectStatisticsScreenState extends State<SubjectStatisticsScreen> {
  final AttendanceGuiderService _guiderService = AttendanceGuiderService();
  AttendanceGuiderReport? _report;
  bool _isLoading = true;
  double _selectedTarget = 75.0;
  String _activeFilter = 'ALL';

  final List<double> _targetPresets = [70.0, 75.0, 80.0, 85.0, 90.0];

  @override
  void initState() {
    super.initState();
    _loadReport();
  }

  Future<void> _loadReport() async {
    setState(() => _isLoading = true);
    final report = await _guiderService.fetchReport(targetPercentage: _selectedTarget);
    if (mounted) {
      setState(() {
        _report = report;
        _isLoading = false;
      });
    }
  }

  void _onTargetChanged(double newTarget) {
    if (_selectedTarget == newTarget) return;
    setState(() {
      _selectedTarget = newTarget;
      if (_report != null) {
        _report = _guiderService.recalculateReport(_report!, newTarget);
      }
    });
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'CRITICAL':
        return Colors.redAccent;
      case 'BORDERLINE':
        return Colors.amber;
      case 'HEALTHY':
      default:
        return const Color(0xFF22C55E);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Attendance Guider & Target'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Sync Live Stats',
            onPressed: _loadReport,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF22C55E)))
          : _report == null
              ? const Center(child: Text('Unable to load attendance statistics.'))
              : RefreshIndicator(
                  color: const Color(0xFF22C55E),
                  onRefresh: _loadReport,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // 1. Configurable Target Selector
                        _buildTargetSelector(),
                        const SizedBox(height: 16),

                        // 2. Semester Overall Predictive Summary
                        _buildOverallSummaryCard(_report!.overall),
                        const SizedBox(height: 16),

                        // 3. Urgent Shortage Alert Banner (if any subject < 75%)
                        if (_report!.overall.criticalSubjectsCount > 0) ...[
                          _buildCriticalShortageBanner(_report!.overall.criticalSubjectsCount),
                          const SizedBox(height: 16),
                        ],

                        // 4. Subject Filters
                        _buildFilterChips(),
                        const SizedBox(height: 14),

                        // 5. Subject Cards List
                        ..._buildSubjectCards(),
                        const SizedBox(height: 20),

                        // 6. Actionable Guidance & Recommendations
                        _buildRecommendationsCard(_report!.recommendations),
                        const SizedBox(height: 30),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildTargetSelector() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.tune, color: Color(0xFF22C55E), size: 18),
                    SizedBox(width: 8),
                    Text(
                      'Configurable Semester Target',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF22C55E).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFF22C55E).withValues(alpha: 0.4)),
                  ),
                  child: Text(
                    '${_selectedTarget.toStringAsFixed(0)}% Quota',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF22C55E)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: _targetPresets.map((preset) {
                final isSelected = _selectedTarget == preset;
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 3),
                    child: InkWell(
                      onTap: () => _onTargetChanged(preset),
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFF22C55E) : const Color(0xFF1E293B),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: isSelected ? const Color(0xFF22C55E) : const Color(0xFF334155),
                          ),
                        ),
                        child: Text(
                          '${preset.toStringAsFixed(0)}%',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: isSelected ? Colors.black : Colors.white70,
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOverallSummaryCard(GuiderOverallSummary overall) {
    final statusColor = _getStatusColor(overall.status);

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            statusColor.withValues(alpha: 0.18),
            const Color(0xFF0F172A),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: statusColor.withValues(alpha: 0.5)),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Overall Semester Attendance', style: TextStyle(color: Colors.grey, fontSize: 12)),
                  const SizedBox(height: 4),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      Text(
                        '${overall.overallPercentage.toStringAsFixed(1)}%',
                        style: TextStyle(fontSize: 34, fontWeight: FontWeight.bold, color: statusColor),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: statusColor.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          overall.status,
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: statusColor),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              SizedBox(
                height: 70,
                width: 70,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    CircularProgressIndicator(
                      value: (overall.overallPercentage / 100.0).clamp(0.0, 1.0),
                      strokeWidth: 8,
                      backgroundColor: const Color(0xFF334155),
                      color: statusColor,
                    ),
                    Text(
                      '${overall.overallPercentage.toStringAsFixed(0)}%',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(color: Color(0xFF334155), height: 1),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _summaryCell('Attended / Held', '${overall.totalClassesAttended} / ${overall.totalClassesHeld}', Colors.white),
              _summaryCell(
                overall.safeBunks > 0 ? 'Safe Bunks' : 'Required Lectures',
                overall.safeBunks > 0 ? '${overall.safeBunks} Classes' : '${overall.requiredConsecutiveLectures} Classes',
                overall.safeBunks > 0 ? const Color(0xFF22C55E) : Colors.redAccent,
              ),
              _summaryCell(
                'Shortage Count',
                '${overall.criticalSubjectsCount} Subjects',
                overall.criticalSubjectsCount > 0 ? Colors.redAccent : const Color(0xFF22C55E),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _summaryCell(String label, String value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: color)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 11)),
      ],
    );
  }

  Widget _buildCriticalShortageBanner(int count) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.redAccent.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.redAccent.withValues(alpha: 0.6)),
      ),
      child: Row(
        children: [
          const Icon(Icons.warning_amber_rounded, color: Colors.redAccent, size: 28),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'ATTENDANCE SHORTAGE WARNING',
                  style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 12),
                ),
                const SizedBox(height: 2),
                Text(
                  '$count subject(s) are below the mandatory 75% college minimum. Prioritize attending these classes to avoid semester exam detention.',
                  style: const TextStyle(color: Colors.white70, fontSize: 11),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChips() {
    final filters = [
      {'key': 'ALL', 'label': 'All Subjects'},
      {'key': 'CRITICAL', 'label': 'Critical (<75%)'},
      {'key': 'BORDERLINE', 'label': 'Borderline'},
      {'key': 'HEALTHY', 'label': 'Safe'},
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: filters.map((f) {
          final isSelected = _activeFilter == f['key'];
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: Text(f['label']!),
              selected: isSelected,
              onSelected: (_) => setState(() => _activeFilter = f['key']!),
              selectedColor: const Color(0xFF22C55E).withValues(alpha: 0.2),
              side: BorderSide(
                color: isSelected ? const Color(0xFF22C55E) : const Color(0xFF334155),
              ),
              labelStyle: TextStyle(
                color: isSelected ? const Color(0xFF22C55E) : Colors.grey,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                fontSize: 12,
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  List<Widget> _buildSubjectCards() {
    final allSubjects = _report!.subjects;
    final filtered = allSubjects.where((s) {
      if (_activeFilter == 'ALL') return true;
      return s.status == _activeFilter;
    }).toList();

    if (filtered.isEmpty) {
      return [
        const Padding(
          padding: EdgeInsets.symmetric(vertical: 20),
          child: Center(
            child: Text('No subjects match the selected filter.', style: TextStyle(color: Colors.grey)),
          ),
        ),
      ];
    }

    return filtered.map((s) => _buildSubjectCard(s)).toList();
  }

  Widget _buildSubjectCard(SubjectGuiderStat s) {
    final statusColor = _getStatusColor(s.status);

    return Card(
      margin: const EdgeInsets.only(bottom: 14),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top row: Code and Status percentage badge
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Text(
                      s.subjectCode,
                      style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF22C55E), fontSize: 13),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${s.credits} Credits',
                      style: const TextStyle(color: Colors.grey, fontSize: 11),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: statusColor.withValues(alpha: 0.4)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '${s.percentage.toStringAsFixed(1)}%',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: statusColor),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '• ${s.status}',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: statusColor),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(s.subjectName, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 12),

            // Progress bar
            LinearProgressIndicator(
              value: (s.percentage / 100.0).clamp(0.0, 1.0),
              backgroundColor: const Color(0xFF334155),
              color: statusColor,
              minHeight: 6,
              borderRadius: BorderRadius.circular(3),
            ),
            const SizedBox(height: 14),

            // Stat Metrics
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _statCell('Total Held', '${s.totalSessions}'),
                _statCell('Attended', '${s.attendedSessions}', color: const Color(0xFF22C55E)),
                _statCell('Missed', '${s.missedSessions}', color: Colors.redAccent),
                _statCell('Target Quota', '${_selectedTarget.toStringAsFixed(0)}%'),
              ],
            ),
            const SizedBox(height: 14),

            // Predictive Bunk & Attendance Recovery Action Pill
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: statusColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: statusColor.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  Icon(
                    s.safeBunks > 0 ? Icons.beach_access : Icons.assignment_late,
                    color: statusColor,
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      s.safeBunks > 0
                          ? 'Safe to miss: ${s.safeBunks} upcoming class(es) and remain >= ${_selectedTarget.toStringAsFixed(0)}%'
                          : 'Action required: Must attend next ${s.requiredConsecutiveLectures} consecutive classes to reach ${_selectedTarget.toStringAsFixed(0)}%',
                      style: TextStyle(
                        color: statusColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 11,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),

            // Next Class Impact Simulator
            Row(
              children: [
                const Icon(Icons.flash_on, color: Colors.amber, size: 14),
                const SizedBox(width: 4),
                Text(
                  'Next Class: +${s.nextClassImpact.deltaIfAttended}% if attended (${s.nextClassImpact.ifAttended}%)  |  ${s.nextClassImpact.deltaIfMissed}% if missed (${s.nextClassImpact.ifMissed}%)',
                  style: const TextStyle(fontSize: 10, color: Colors.grey),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _statCell(String label, String value, {Color? color}) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: color ?? Colors.white)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 11)),
      ],
    );
  }

  Widget _buildRecommendationsCard(List<String> recommendations) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.lightbulb_outline, color: Colors.amber, size: 20),
                SizedBox(width: 8),
                Text(
                  'Smart Semester Recommendations',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ...recommendations.map((rec) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('• ', style: TextStyle(color: Color(0xFF22C55E), fontWeight: FontWeight.bold)),
                      Expanded(
                        child: Text(
                          rec,
                          style: const TextStyle(fontSize: 12, color: Colors.white70, height: 1.3),
                        ),
                      ),
                    ],
                  ),
                )),
          ],
        ),
      ),
    );
  }
}
