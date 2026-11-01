import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../core/services/notification_service.dart';

class NotificationDetailScreen extends StatefulWidget {
  final NotificationItem notification;

  const NotificationDetailScreen({super.key, required this.notification});

  @override
  State<NotificationDetailScreen> createState() => _NotificationDetailScreenState();
}

class _NotificationDetailScreenState extends State<NotificationDetailScreen> {
  @override
  void initState() {
    super.initState();
    // Automatically mark as read on view
    NotificationService().markAsRead(widget.notification.id);
  }

  Color _getPriorityColor(String priority) {
    switch (priority.toUpperCase()) {
      case 'URGENT':
        return Colors.redAccent;
      case 'NORMAL':
        return const Color(0xFF3B82F6);
      case 'INFORMATIONAL':
      default:
        return const Color(0xFF22C55E);
    }
  }

  IconData _getPriorityIcon(String priority) {
    switch (priority.toUpperCase()) {
      case 'URGENT':
        return Icons.warning_amber_rounded;
      case 'NORMAL':
        return Icons.info_outline;
      case 'INFORMATIONAL':
      default:
        return Icons.campaign_outlined;
    }
  }

  String _formatCategory(String type) {
    switch (type.toUpperCase()) {
      case 'ATTENDANCE_ALERT':
        return 'Attendance Alert';
      case 'CLASS_ANNOUNCEMENT':
        return 'Class Announcement';
      case 'CAMPUS_BROADCAST':
        return 'Campus Broadcast';
      default:
        return 'System Notification';
    }
  }

  @override
  Widget build(BuildContext context) {
    final priorityColor = _getPriorityColor(widget.notification.priority);
    final priorityIcon = _getPriorityIcon(widget.notification.priority);
    final isUrgent = widget.notification.isUrgent;

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        title: const Text('Notification Details'),
        backgroundColor: const Color(0xFF1E293B),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Urgent Banner if URGENT
            if (isUrgent) ...[
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.redAccent.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.redAccent.withValues(alpha: 0.5)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.report_problem, color: Colors.redAccent, size: 24),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Urgent Notification: Requires immediate attention and action.',
                        style: TextStyle(color: Colors.redAccent, fontSize: 13, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Priority and Category Pills
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: priorityColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: priorityColor.withValues(alpha: 0.4)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(priorityIcon, size: 14, color: priorityColor),
                      const SizedBox(width: 4),
                      Text(
                        widget.notification.priority.toUpperCase(),
                        style: TextStyle(
                          color: priorityColor,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF334155),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    _formatCategory(widget.notification.type),
                    style: const TextStyle(
                      color: Colors.grey,
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Notification Title
            Text(
              widget.notification.title,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: Colors.white,
                height: 1.3,
              ),
            ),
            const SizedBox(height: 8),

            // Timestamp & Read indicator
            Row(
              children: [
                const Icon(Icons.schedule, size: 14, color: Colors.grey),
                const SizedBox(width: 6),
                Text(
                  DateFormat('EEEE, MMMM d, y • h:mm a').format(widget.notification.createdAt),
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
                const Spacer(),
                const Icon(Icons.done_all, size: 16, color: Color(0xFF22C55E)),
                const SizedBox(width: 4),
                const Text('Read', style: TextStyle(fontSize: 12, color: Color(0xFF22C55E))),
              ],
            ),
            const Divider(color: Color(0xFF334155), height: 32),

            // Message Body Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF334155)),
              ),
              child: Text(
                widget.notification.message,
                style: const TextStyle(
                  fontSize: 15,
                  color: Color(0xFFE2E8F0),
                  height: 1.6,
                ),
              ),
            ),
            const SizedBox(height: 32),

            // Return Button
            OutlinedButton.icon(
              onPressed: () => Navigator.pop(context),
              icon: const Icon(Icons.arrow_back, size: 18),
              label: const Text('Back to Notifications'),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.white,
                side: const BorderSide(color: Color(0xFF334155)),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
