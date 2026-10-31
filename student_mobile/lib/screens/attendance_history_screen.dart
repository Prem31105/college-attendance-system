import 'package:flutter/material.dart';

class AttendanceHistoryScreen extends StatelessWidget {
  const AttendanceHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final history = [
      {'subject': 'CS601: Distributed Systems', 'date': 'Today, 10:14 AM', 'status': 'VERIFIED', 'dist': '14.2m', 'color': Color(0xFF22C55E)},
      {'subject': 'CS602: Cryptography', 'date': 'Yesterday, 02:05 PM', 'status': 'VERIFIED', 'dist': '21.0m', 'color': Color(0xFF22C55E)},
      {'subject': 'CS603: Mobile App Dev', 'date': '29 Oct 2026, 09:12 AM', 'status': 'VERIFIED', 'dist': '8.5m', 'color': Color(0xFF22C55E)},
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Attendance History')),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: history.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final h = history[index];
          return Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(h['subject'] as String, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white)),
                      const SizedBox(height: 4),
                      Text('${h['date']} • Distance: ${h['dist']}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: (h['color'] as Color).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: (h['color'] as Color).withOpacity(0.3)),
                    ),
                    child: Text(
                      h['status'] as String,
                      style: TextStyle(color: h['color'] as Color, fontWeight: FontWeight.bold, fontSize: 11),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
