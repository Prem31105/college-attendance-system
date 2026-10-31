import 'package:flutter/material.dart';

class TimetableScreen extends StatelessWidget {
  const TimetableScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final schedule = [
      {'time': '09:00 AM - 10:30 AM', 'code': 'CS601', 'name': 'Advanced Distributed Systems', 'room': 'Room 401', 'teacher': 'Dr. Alan Smith'},
      {'time': '10:45 AM - 12:15 PM', 'code': 'CS602', 'name': 'Cryptography & Network Security', 'room': 'Room 402', 'teacher': 'Dr. Sarah Davis'},
      {'time': '01:30 PM - 03:00 PM', 'code': 'CS603', 'name': 'Mobile Application Development', 'room': 'Lab 3', 'teacher': 'Prof. Rajesh Kumar'},
    ];

    return Scaffold(
      appBar: AppBar(title: const Text("Today's Timetable")),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: schedule.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final item = schedule[index];
          return Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF22C55E).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: const Color(0xFF22C55E).withOpacity(0.3)),
                        ),
                        child: Text(item['code']!, style: const TextStyle(color: Color(0xFF22C55E), fontWeight: FontWeight.bold, fontSize: 11)),
                      ),
                      Text(item['time']!, style: const TextStyle(color: Colors.grey, fontSize: 12)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(item['name']!, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                  const SizedBox(height: 6),
                  Text('${item['room']} • ${item['teacher']}', style: const TextStyle(fontSize: 13, color: Colors.grey)),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
