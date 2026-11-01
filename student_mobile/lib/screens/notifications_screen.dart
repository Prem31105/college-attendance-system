import 'package:flutter/material.dart';
import '../core/services/notification_service.dart';
import 'notification_detail_screen.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  String _selectedFilter = 'ALL'; // 'ALL', 'URGENT', 'ALERTS', 'ANNOUNCEMENTS'
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      String? priorityFilter;
      String? typeFilter;

      if (_selectedFilter == 'URGENT') {
        priorityFilter = 'URGENT';
      } else if (_selectedFilter == 'ALERTS') {
        typeFilter = 'ATTENDANCE_ALERT';
      } else if (_selectedFilter == 'ANNOUNCEMENTS') {
        typeFilter = 'CLASS_ANNOUNCEMENT';
      }

      await NotificationService().fetchNotifications(
        priority: priorityFilter,
        type: typeFilter,
      );
    } catch (e) {
      _errorMessage = 'Failed to load notifications. Please try again.';
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _onFilterChanged(String filter) {
    setState(() {
      _selectedFilter = filter;
    });
    _loadNotifications();
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

  IconData _getCategoryIcon(String type) {
    switch (type.toUpperCase()) {
      case 'ATTENDANCE_ALERT':
        return Icons.warning_amber_rounded;
      case 'CLASS_ANNOUNCEMENT':
        return Icons.class_outlined;
      case 'CAMPUS_BROADCAST':
        return Icons.campaign_outlined;
      default:
        return Icons.notifications_none;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        title: const Text('Notifications'),
        backgroundColor: const Color(0xFF1E293B),
        actions: [
          ValueListenableBuilder<int>(
            valueListenable: NotificationService().unreadCountNotifier,
            builder: (context, unreadCount, _) {
              if (unreadCount == 0) return const SizedBox.shrink();
              return TextButton.icon(
                onPressed: () async {
                  await NotificationService().markAllAsRead();
                  if (mounted) setState(() {});
                },
                icon: const Icon(Icons.done_all, size: 16, color: Color(0xFF22C55E)),
                label: const Text(
                  'Mark all read',
                  style: TextStyle(color: Color(0xFF22C55E), fontSize: 12, fontWeight: FontWeight.bold),
                ),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Chips Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: const Color(0xFF1E293B).withValues(alpha: 0.5),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildFilterChip('ALL', 'All'),
                  const SizedBox(width: 8),
                  _buildFilterChip('URGENT', 'Urgent Only'),
                  const SizedBox(width: 8),
                  _buildFilterChip('ALERTS', 'Attendance Alerts'),
                  const SizedBox(width: 8),
                  _buildFilterChip('ANNOUNCEMENTS', 'Announcements'),
                ],
              ),
            ),
          ),

          // Main Content List
          Expanded(
            child: RefreshIndicator(
              onRefresh: _loadNotifications,
              color: const Color(0xFF22C55E),
              backgroundColor: const Color(0xFF1E293B),
              child: _buildBody(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String filterKey, String label) {
    final isSelected = _selectedFilter == filterKey;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) => _onFilterChanged(filterKey),
      selectedColor: const Color(0xFF22C55E),
      backgroundColor: const Color(0xFF1E293B),
      labelStyle: TextStyle(
        color: isSelected ? Colors.black : Colors.white70,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        fontSize: 12,
      ),
      side: BorderSide(
        color: isSelected ? const Color(0xFF22C55E) : const Color(0xFF334155),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFF22C55E)),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.redAccent),
              const SizedBox(height: 12),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white70, fontSize: 14),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _loadNotifications,
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF22C55E),
                  foregroundColor: Colors.black,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return ValueListenableBuilder<List<NotificationItem>>(
      valueListenable: NotificationService().notificationsNotifier,
      builder: (context, notifications, _) {
        if (notifications.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.mark_email_read_outlined, size: 64, color: Colors.grey.shade600),
                const SizedBox(height: 16),
                const Text(
                  'No notifications found',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                ),
                const SizedBox(height: 6),
                const Text(
                  'You are completely caught up!',
                  style: TextStyle(fontSize: 13, color: Colors.grey),
                ),
              ],
            ),
          );
        }

        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: notifications.length,
          separatorBuilder: (_, __) => const SizedBox(height: 10),
          itemBuilder: (context, index) {
            final n = notifications[index];
            final priorityColor = _getPriorityColor(n.priority);
            final categoryIcon = _getCategoryIcon(n.type);

            return InkWell(
              onTap: () async {
                await Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => NotificationDetailScreen(notification: n)),
                );
                if (mounted) setState(() {});
              },
              borderRadius: BorderRadius.circular(12),
              child: Container(
                decoration: BoxDecoration(
                  color: n.isRead ? const Color(0xFF1E293B).withValues(alpha: 0.6) : const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: !n.isRead
                        ? (n.isUrgent ? Colors.redAccent.withValues(alpha: 0.6) : const Color(0xFF22C55E).withValues(alpha: 0.5))
                        : const Color(0xFF334155),
                    width: !n.isRead ? 1.5 : 1,
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(14.0),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Icon with priority badge
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: priorityColor.withValues(alpha: 0.15),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(categoryIcon, color: priorityColor, size: 22),
                      ),
                      const SizedBox(width: 14),

                      // Text and metadata
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                // Priority badge
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: priorityColor.withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    n.priority.toUpperCase(),
                                    style: TextStyle(
                                      color: priorityColor,
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                Text(
                                  n.timeAgo,
                                  style: const TextStyle(fontSize: 11, color: Colors.grey),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),

                            // Title
                            Text(
                              n.title,
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: n.isRead ? FontWeight.w600 : FontWeight.bold,
                                color: n.isRead ? Colors.white70 : Colors.white,
                              ),
                            ),
                            const SizedBox(height: 4),

                            // Message snippet
                            Text(
                              n.message,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: 13,
                                color: n.isRead ? Colors.grey : const Color(0xFFCBD5E1),
                                height: 1.3,
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Unread indicator dot
                      if (!n.isRead) ...[
                        const SizedBox(width: 8),
                        Container(
                          margin: const EdgeInsets.only(top: 14),
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: n.isUrgent ? Colors.redAccent : const Color(0xFF22C55E),
                            shape: BoxShape.circle,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }
}
