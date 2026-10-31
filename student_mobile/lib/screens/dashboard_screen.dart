import 'package:flutter/material.dart';
import 'attendance_scanner_screen.dart';
import 'timetable_screen.dart';
import 'subject_list_screen.dart';
import 'attendance_history_screen.dart';
import 'notifications_screen.dart';
import 'profile_screen.dart';
import 'settings_screen.dart';
import 'device_info_screen.dart';
import 'attendance_correction_screen.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('SmartCampus'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen())),
          ),
          IconButton(
            icon: const Icon(Icons.person_outline),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfileScreen())),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Overall Attendance Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Overall Attendance', style: TextStyle(color: Colors.grey, fontSize: 13)),
                        const SizedBox(height: 4),
                        const Text('88.4%', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Color(0xFF22C55E))),
                        const SizedBox(height: 4),
                        Row(
                          children: const [
                            Icon(Icons.check_circle, size: 14, color: Color(0xFF22C55E)),
                            SizedBox(width: 4),
                            Text('Above 75% Requirement', style: TextStyle(color: Colors.grey, fontSize: 12)),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(
                      height: 70,
                      width: 70,
                      child: CircularProgressIndicator(
                        value: 0.884,
                        strokeWidth: 8,
                        backgroundColor: Color(0xFF334155),
                        color: Color(0xFF22C55E),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Active Session Alert Card
            Container(
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF1E3A8A), Color(0xFF0F172A)]),
                borderRadius: BorderRadius.circular(16),
                border: Border.parseBorder('1px solid #3B82F6'),
              ),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: const [
                      Icon(Icons.radio_button_checked, color: Color(0xFF38BDF8), size: 16),
                      SizedBox(width: 6),
                      Text('ACTIVE ATTENDANCE SESSION', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF38BDF8))),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text('CS601: Advanced Distributed Systems', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                  const SizedBox(height: 2),
                  const Text('Room 401 • Dr. Alan Smith • 75m Geofence', style: TextStyle(fontSize: 12, color: Colors.grey)),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const AttendanceScannerScreen()),
                      );
                    },
                    icon: const Icon(Icons.qr_code_scanner, color: Colors.black),
                    label: const Text('Scan Dynamic QR Now', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black)),
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF22C55E)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Quick Actions Grid
            const Text('Quick Access', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 12),
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 3,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              children: [
                _buildActionItem(context, Icons.calendar_today, 'Timetable', const TimetableScreen()),
                _buildActionItem(context, Icons.book, 'Subjects', const SubjectListScreen()),
                _buildActionItem(context, Icons.history, 'History', const AttendanceHistoryScreen()),
                _buildActionItem(context, Icons.phonelink_lock, 'Device', const DeviceInfoScreen()),
                _buildActionItem(context, Icons.edit_note, 'Correction', const AttendanceCorrectionScreen()),
                _buildActionItem(context, Icons.settings, 'Settings', const SettingsScreen()),
              ],
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const AttendanceScannerScreen()));
        },
        backgroundColor: const Color(0xFF22C55E),
        icon: const Icon(Icons.qr_code_scanner, color: Colors.black),
        label: const Text('Scan QR', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildActionItem(BuildContext context, IconData icon, String label, Widget screen) {
    return InkWell(
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => screen)),
      borderRadius: BorderRadius.circular(12),
      child: Card(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: const Color(0xFF22C55E), size: 28),
            const SizedBox(height: 8),
            Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}
