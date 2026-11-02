import 'dart:async';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';
import 'package:intl/intl.dart';
import 'package:socket_io_client/socket_io_client.dart' as socket_io;
import 'api_service.dart';
import '../security/security_utils.dart';

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
    final rawId = json['id']?.toString() ?? '';
    final id = rawId.isNotEmpty
        ? rawId
        : 'ws_${DateTime.now().millisecondsSinceEpoch}_${(json['title'] ?? '').hashCode}';
    return NotificationItem(
      id: id,
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      priority: json['priority'] ?? 'NORMAL',
      type: json['type'] ?? 'SYSTEM',
      isRead: json['isRead'] ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      readAt: json['readAt'] != null
          ? DateTime.tryParse(json['readAt'].toString())
          : null,
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
  final ValueNotifier<bool> isSocketConnectedNotifier = ValueNotifier<bool>(false);

  Timer? _syncTimer;
  socket_io.Socket? _socket;
  bool _isConnecting = false;

  String get wsUrl {
    if (kIsWeb) return 'http://localhost:3000';
    try {
      if (Platform.isAndroid) return 'http://10.0.2.2:3000';
    } catch (_) {}
    return 'http://localhost:3000';
  }

  void startSync() {
    refreshUnreadCount();
    fetchNotifications();
    connectSocket();
    _syncTimer?.cancel();
    // Fallback polling: every 15s to guarantee eventual consistency if socket is offline
    _syncTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      refreshUnreadCount();
      if (_socket == null || !_socket!.connected) {
        connectSocket();
      }
    });
  }

  void stopSync() {
    _syncTimer?.cancel();
    _syncTimer = null;
    disconnectSocket();
  }

  Future<void> connectSocket({String? token}) async {
    if (_socket != null && _socket!.connected) return;
    if (_isConnecting) return;
    _isConnecting = true;

    try {
      final authToken =
          token ?? ApiService().accessToken ?? await TokenManager.getAccessToken();
      if (authToken == null || authToken.isEmpty) {
        _isConnecting = false;
        return;
      }

      try {
        _socket?.disconnect();
        _socket?.dispose();
      } catch (_) {}

      _socket = socket_io.io(
        wsUrl,
        socket_io.OptionBuilder()
            .setTransports(['websocket'])
            .enableAutoConnect()
            .enableReconnection()
            .setReconnectionDelay(2000)
            .setReconnectionAttempts(10)
            .setAuth({'token': authToken})
            .build(),
      );

      _socket!.onConnect((_) {
        isSocketConnectedNotifier.value = true;
      });

      _socket!.onDisconnect((_) {
        isSocketConnectedNotifier.value = false;
      });

      _socket!.onConnectError((_) {
        isSocketConnectedNotifier.value = false;
      });

      _socket!.onError((_) {
        isSocketConnectedNotifier.value = false;
      });

      // Listen for authenticated user-targeted notifications
      _socket!.on('new_notification', (data) => _handleIncomingNotification(data));

      // Listen for role-wide announcements (e.g. STUDENT role)
      _socket!.on('role_announcement', (data) => _handleIncomingNotification(data));

      // Listen for global campus broadcasts
      _socket!.on('global_announcement', (data) => _handleIncomingNotification(data));
    } catch (_) {
      isSocketConnectedNotifier.value = false;
    } finally {
      _isConnecting = false;
    }
  }

  void _handleIncomingNotification(dynamic data) {
    if (data == null) return;
    try {
      final map =
          data is Map ? Map<String, dynamic>.from(data) : <String, dynamic>{};
      if (map.isEmpty) return;

      final item = NotificationItem.fromJson(map);

      // Prevent duplicate notifications
      final currentList =
          List<NotificationItem>.from(notificationsNotifier.value);
      final isDuplicate = currentList.any((n) {
        if (n.id == item.id && item.id.isNotEmpty && !item.id.startsWith('ws_')) {
          return true;
        }
        return n.title == item.title &&
            n.message == item.message &&
            n.createdAt.difference(item.createdAt).inSeconds.abs() < 5;
      });

      if (!isDuplicate) {
        notificationsNotifier.value = [item, ...currentList];
        if (!item.isRead) {
          unreadCountNotifier.value = unreadCountNotifier.value + 1;
        }
      }
    } catch (_) {}
  }

  void disconnectSocket() {
    try {
      _socket?.disconnect();
      _socket?.dispose();
    } catch (_) {}
    _socket = null;
    isSocketConnectedNotifier.value = false;
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
