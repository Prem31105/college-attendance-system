import 'package:flutter/material.dart';

class SubjectStatisticsScreen extends StatelessWidget {
  const SubjectStatisticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final stats = [
      {
        'code': 'CS601',
        'name': 'Advanced Distributed Systems',
        'total': 34,
        'attended': 31,
        'missed': 3,
        'percentage': 91.2,
        'status': 'HEALTHY',
      },
      {
        'code': 'CS602',
        'name': 'Cryptography & Network Security',
        'total': 28,
        'attended': 24,
        'missed': 4,
        'percentage': 85.7,
        'status': 'HEALTHY',
      },
      {
        'code': 'CS603',
        'name': 'Mobile Application Development',
        'total': 24,
        'attended': 18,
        'missed': 6,
        'percentage': 75.0,
        'status': 'BORDERLINE',
      },
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Subject-Wise Statistics')),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: stats.length,
        separatorBuilder: (_, __) => const SizedBox(height: 16),
        itemBuilder: (context, index) {
          final s = stats[index];
          final pct = s['percentage'] as double;
          final isWarning = pct < 75.0;
          final isBorderline = pct == 75.0;

          return Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(s['code'] as String, style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF22C55E), fontSize: 13)),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: isWarning
                              ? Colors.redAccent.withOpacity(0.15)
                              : isBorderline
                                  ? Colors.amber.withOpacity(0.15)
                                  : const Color(0xFF22C55E).withOpacity(0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          '${pct.toStringAsFixed(1)}%',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                            color: isWarning
                                ? Colors.redAccent
                                : isBorderline
                                    ? Colors.amber
                                    : const Color(0xFF22C55E),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(s['name'] as String, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                  const SizedBox(height: 12),
                  LinearProgressIndicator(
                    value: pct / 100.0,
                    backgroundColor: const Color(0xFF334155),
                    color: isWarning
                        ? Colors.redAccent
                        : isBorderline
                            ? Colors.amber
                            : const Color(0xFF22C55E),
                    minHeight: 6,
                    borderRadius: BorderRadius.circular(3),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _statCell('Total Held', '${s['total']}'),
                      _statCell('Attended', '${s['attended']}', color: const Color(0xFF22C55E)),
                      _statCell('Missed', '${s['missed']}', color: Colors.redAccent),
                      _statCell('Min Quota', '75%'),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _statCell(String label, String value, {Color? color}) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: color ?? Colors.white)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 11)),
      ],
    );
  }
}
