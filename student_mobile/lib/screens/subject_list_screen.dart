import 'package:flutter/material.dart';

class SubjectListScreen extends StatelessWidget {
  const SubjectListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final subjects = [
      {'code': 'CS601', 'name': 'Advanced Distributed Systems', 'credits': '4 Credits', 'attendance': '91.2%', 'attended': '31/34'},
      {'code': 'CS602', 'name': 'Cryptography & Network Security', 'credits': '4 Credits', 'attendance': '85.7%', 'attended': '24/28'},
      {'code': 'CS603', 'name': 'Mobile Application Development', 'credits': '3 Credits', 'attendance': '89.5%', 'attended': '17/19'},
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Enrolled Subjects')),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: subjects.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final s = subjects[index];
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
                        Text(s['code']!, style: const TextStyle(color: Color(0xFF22C55E), fontWeight: FontWeight.bold, fontSize: 12)),
                        const SizedBox(height: 4),
                        Text(s['name']!, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white)),
                        const SizedBox(height: 4),
                        Text('${s['credits']} • Attended: ${s['attended']}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(s['attendance']!, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF22C55E))),
                      const Text('Attendance', style: TextStyle(color: Colors.grey, fontSize: 10)),
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
}
