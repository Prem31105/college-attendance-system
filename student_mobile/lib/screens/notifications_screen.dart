import 'package:flutter/material.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final notifications = [
      {'title': 'Physical Verification Notice', 'body': 'Instructor initiated a physical verification check for CS601.', 'time': '10 mins ago', 'type': 'ALERT'},
      {'title': 'Attendance Verified', 'body': 'Your attendance for CS601 has been verified with 14.2m GPS proximity.', 'time': '1 hour ago', 'type': 'SUCCESS'},
      {'title': 'System Announcement', 'body': 'Semester 6 examinations timetable has been published.', 'time': 'Yesterday', 'type': 'INFO'},
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: notifications.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final n = notifications[index];
          return Card(
            child: ListTile(
              leading: Icon(
                n['type'] == 'ALERT'
                    ? Icons.warning_amber_rounded
                    : n['type'] == 'SUCCESS'
                        ? Icons.check_circle_outline
                        : Icons.info_outline,
                color: n['type'] == 'ALERT'
                    ? Colors.amber
                    : n['type'] == 'SUCCESS'
                        ? const Color(0xFF22C55E)
                        : Colors.blue,
              ),
              title: Text(n['title']!, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              subtitle: Text(n['body']!, style: const TextStyle(fontSize: 12, color: Colors.grey)),
              trailing: Text(n['time']!, style: const TextStyle(fontSize: 10, color: Colors.grey)),
            ),
          );
        },
      ),
    );
  }
}
