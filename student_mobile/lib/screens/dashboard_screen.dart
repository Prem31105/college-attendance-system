import 'package:flutter/material.dart';
import '../core/services/notification_service.dart';
import 'attendance_scanner_screen.dart';
import 'timetable_screen.dart';
import 'subject_list_screen.dart';
import 'attendance_history_screen.dart';
import 'notifications_screen.dart';
import 'notification_detail_screen.dart';
import 'profile_screen.dart';
import 'settings_screen.dart';
import 'device_info_screen.dart';
import 'attendance_correction_screen.dart';
import 'gps_status_screen.dart';
import 'subject_statistics_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    NotificationService().startSync();
    NotificationService().fetchNotifications();
  }

  @override
  void dispose() {
    NotificationService().stopSync();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('SmartCampus'),
        actions: [
          ValueListenableBuilder<int>(
            valueListenable: NotificationService().unreadCountNotifier,
            builder: (context, unreadCount, _) {
              return Stack(
                alignment: Alignment.center,
                children: [
                  IconButton(
                    icon: const Icon(Icons.notifications_outlined),
                    tooltip: 'Notification Center',
                    onPressed: () async {
                      await Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const NotificationsScreen()),
                      );
                      NotificationService().refreshUnreadCount();
                    },
                  ),
                  if (unreadCount > 0)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: Colors.redAccent,
                          shape: BoxShape.circle,
                        ),
                        constraints: const BoxConstraints(
                          minWidth: 16,
                          minHeight: 16,
                        ),
                        child: Text(
                          unreadCount > 9 ? '9+' : unreadCount.toString(),
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                ],
              );
            },
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
            // Urgent Notification Alert Banner (if unread urgent notification exists)
            ValueListenableBuilder<List<NotificationItem>>(
              valueListenable: NotificationService().notificationsNotifier,
              builder: (context, notifs, _) {
                final urgentUnread = notifs.where((n) => n.isUrgent && !n.isRead).toList();
                if (urgentUnread.isEmpty) return const SizedBox.shrink();

                final firstUrgent = urgentUnread.first;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 16.0),
                  child: InkWell(
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => NotificationDetailScreen(notification: firstUrgent)),
                    ),
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.redAccent.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.redAccent.withValues(alpha: 0.6)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.warning_amber_rounded, color: Colors.redAccent, size: 24),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: Colors.redAccent,
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: const Text('URGENT', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                                    ),
                                    const SizedBox(width: 6),
                                    Expanded(
                                      child: Text(
                                        firstUrgent.title,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  firstUrgent.message,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontSize: 11, color: Colors.white70),
                                ),
                              ],
                            ),
                          ),
                          const Icon(Icons.arrow_forward_ios, size: 12, color: Colors.redAccent),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
            // Overall Attendance Card
            const Card(
              child: Padding(
                padding: EdgeInsets.all(20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Overall Attendance', style: TextStyle(color: Colors.grey, fontSize: 13)),
                        SizedBox(height: 4),
                        Text('88.4%', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Color(0xFF22C55E))),
                        SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(Icons.check_circle, size: 14, color: Color(0xFF22C55E)),
                            SizedBox(width: 4),
                            Text('Above 75% Requirement', style: TextStyle(color: Colors.grey, fontSize: 12)),
                          ],
                        ),
                      ],
                    ),
                    SizedBox(
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
                border: Border.all(color: const Color(0xFF3B82F6), width: 1),
              ),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
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
              crossAxisCount: 4,
              crossAxisSpacing: 8,
              mainAxisSpacing: 8,
              children: [
                _buildActionItem(context, Icons.calendar_today, 'Timetable', const TimetableScreen()),
                _buildActionItem(context, Icons.book, 'Subjects', const SubjectListScreen()),
                _buildActionItem(context, Icons.bar_chart, 'Stats', const SubjectStatisticsScreen()),
                _buildActionItem(context, Icons.my_location, 'GPS Check', const GpsStatusScreen()),
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
