import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:intl/intl.dart';
import 'api_service.dart';

class NotificationItem {
  final String id;
  final String title;
  final String message;
  final String priority; // 'URGENT', 'NORMAL', 'INFORMATIONAL'
  final String type; // 'ATTENDANCE_ALERT', 'CLASS_ANNOUNCEMENT', 'CAMPUS_BROADCAST', 'SYSTEM'
  bool isRead;
  final DateTime createdAt;
  final DateTime? readAt;
  final dynamic data;

  NotificationItem({
    required this.id,
    required this.title,
    required this.message,
    required this.priority,
    required this.type,
    required this.isRead,
    required this.createdAt,
    this.readAt,
    this.data,
  });

  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    return NotificationItem(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      priority: json['priority'] ?? 'NORMAL',
      type: json['type'] ?? 'SYSTEM',
      isRead: json['isRead'] ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt']) ?? DateTime.now()
          : DateTime.now(),
      readAt: json['readAt'] != null ? DateTime.tryParse(json['readAt']) : null,
      data: json['data'],
    );
  }

  String get timeAgo {
    final now = DateTime.now();
    final difference = now.difference(createdAt);

    if (difference.inSeconds < 60) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d ago';
    } else {
      return DateFormat('MMM d, y').format(createdAt);
    }
  }

  bool get isUrgent => priority == 'URGENT';
}

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final ValueNotifier<int> unreadCountNotifier = ValueNotifier<int>(0);
  final ValueNotifier<List<NotificationItem>> notificationsNotifier =
      ValueNotifier<List<NotificationItem>>([]);
  final ValueNotifier<bool> isLoadingNotifier = ValueNotifier<bool>(false);

  Timer? _syncTimer;

  void startSync() {
    refreshUnreadCount();
    _syncTimer?.cancel();
    _syncTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      refreshUnreadCount();
    });
  }

  void stopSync() {
    _syncTimer?.cancel();
    _syncTimer = null;
  }

  Future<int> refreshUnreadCount() async {
    try {
      final count = await ApiService().getUnreadNotificationCount();
      unreadCountNotifier.value = count;
      return count;
    } catch (_) {
      return unreadCountNotifier.value;
    }
  }

  Future<List<NotificationItem>> fetchNotifications({
    int page = 1,
    int limit = 20,
    String? priority,
    bool? isRead,
    String? type,
  }) async {
    isLoadingNotifier.value = true;
    try {
      final res = await ApiService().getNotifications(
        page: page,
        limit: limit,
        priority: priority,
        isRead: isRead,
        type: type,
      );

      if (res['success'] == true && res['data']?['notifications'] is List) {
        final rawList = res['data']['notifications'] as List;
        final items = rawList
            .map((item) => NotificationItem.fromJson(item as Map<String, dynamic>))
            .toList();

        notificationsNotifier.value = items;
        final unread = res['data']['unreadCount'] as int? ??
            items.where((i) => !i.isRead).length;
        unreadCountNotifier.value = unread;
        return items;
      }
    } catch (_) {} finally {
      isLoadingNotifier.value = false;
    }
    return notificationsNotifier.value;
  }

  Future<void> markAsRead(String id) async {
    final currentList = List<NotificationItem>.from(notificationsNotifier.value);
    final index = currentList.indexWhere((n) => n.id == id);
    if (index != -1 && !currentList[index].isRead) {
      currentList[index].isRead = true;
      notificationsNotifier.value = currentList;
      if (unreadCountNotifier.value > 0) {
        unreadCountNotifier.value = unreadCountNotifier.value - 1;
      }
      await ApiService().markNotificationAsRead(id);
    }
  }

  Future<void> markAllAsRead() async {
    final currentList = List<NotificationItem>.from(notificationsNotifier.value);
    for (final item in currentList) {
      item.isRead = true;
    }
    notificationsNotifier.value = currentList;
    unreadCountNotifier.value = 0;
    await ApiService().markAllNotificationsAsRead();
  }
}
