import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:student_mobile/core/services/notification_service.dart';
import 'package:student_mobile/screens/notifications_screen.dart';
import 'package:student_mobile/screens/notification_detail_screen.dart';

void main() {
  group('Notification Model & Service Logic Tests', () {
    test('NotificationItem parsing and relative timestamp calculation', () {
      final json = {
        'id': 'notif-101',
        'title': 'Emergency Campus Drill',
        'message': 'Mandatory evacuation drill at 2 PM sharp.',
        'priority': 'URGENT',
        'type': 'CAMPUS_BROADCAST',
        'isRead': false,
        'createdAt': DateTime.now().subtract(const Duration(minutes: 5)).toIso8601String(),
        'readAt': null,
      };

      final item = NotificationItem.fromJson(json);

      expect(item.id, 'notif-101');
      expect(item.title, 'Emergency Campus Drill');
      expect(item.priority, 'URGENT');
      expect(item.isUrgent, true);
      expect(item.isRead, false);
      expect(item.timeAgo, '5m ago');
    });

    test('NotificationService markAsRead and markAllAsRead updates state correctly', () async {
      final service = NotificationService();

      final item1 = NotificationItem(
        id: 'n1',
        title: 'Quiz Alert',
        message: 'Quiz tomorrow at 9 AM',
        priority: 'NORMAL',
        type: 'CLASS_ANNOUNCEMENT',
        isRead: false,
        createdAt: DateTime.now(),
      );

      final item2 = NotificationItem(
        id: 'n2',
        title: 'Drill Warning',
        message: 'Immediate evacuation',
        priority: 'URGENT',
        type: 'CAMPUS_BROADCAST',
        isRead: false,
        createdAt: DateTime.now(),
      );

      service.notificationsNotifier.value = [item1, item2];
      service.unreadCountNotifier.value = 2;

      expect(service.unreadCountNotifier.value, 2);

      // Mark single item read
      await service.markAsRead('n1');
      expect(service.unreadCountNotifier.value, 1);
      expect(service.notificationsNotifier.value.first.isRead, true);

      // Mark all read
      await service.markAllAsRead();
      expect(service.unreadCountNotifier.value, 0);
      expect(service.notificationsNotifier.value.every((n) => n.isRead), true);
    });
  });

  group('Notification Widgets Tests', () {
    testWidgets('NotificationsScreen renders filter chips, list items, and unread badges', (WidgetTester tester) async {
      final service = NotificationService();
      service.notificationsNotifier.value = [
        NotificationItem(
          id: 'test-1',
          title: 'Class Postponed',
          message: 'Distributed Systems is postponed by 30 minutes.',
          priority: 'URGENT',
          type: 'CLASS_ANNOUNCEMENT',
          isRead: false,
          createdAt: DateTime.now().subtract(const Duration(minutes: 10)),
        ),
        NotificationItem(
          id: 'test-2',
          title: 'Guest Lecture',
          message: 'Cloud Architecture keynote in Auditorium B.',
          priority: 'INFORMATIONAL',
          type: 'CAMPUS_BROADCAST',
          isRead: true,
          createdAt: DateTime.now().subtract(const Duration(hours: 2)),
        ),
      ];
      service.unreadCountNotifier.value = 1;

      await tester.pumpWidget(
        const MaterialApp(
          home: NotificationsScreen(),
        ),
      );

      await tester.pumpAndSettle();

      // Verify Header and Filters
      expect(find.text('Notifications'), findsOneWidget);
      expect(find.text('All'), findsOneWidget);
      expect(find.text('Urgent Only'), findsOneWidget);
      expect(find.text('Attendance Alerts'), findsOneWidget);
      expect(find.text('Announcements'), findsOneWidget);

      // Verify Notifications Rendered from fetch
      expect(find.text('Campus Emergency Evacuation Drill'), findsOneWidget);
      expect(find.text('CS601 Lab Submission Due'), findsOneWidget);
      expect(find.text('URGENT'), findsWidgets);
      expect(find.text('INFORMATIONAL'), findsOneWidget);

      // Verify Mark all read button presence when unread > 0
      expect(find.text('Mark all read'), findsOneWidget);
    });

    testWidgets('NotificationDetailScreen renders detailed body, priority alert, and timestamp', (WidgetTester tester) async {
      final item = NotificationItem(
        id: 'detail-test',
        title: 'Emergency Severe Weather Warning',
        message: 'Campus classes suspended due to cyclone advisory. Stay indoors safely.',
        priority: 'URGENT',
        type: 'CAMPUS_BROADCAST',
        isRead: false,
        createdAt: DateTime(2026, 11, 2, 14, 30),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: NotificationDetailScreen(notification: item),
        ),
      );

      await tester.pumpAndSettle();

      // Check urgent banner and title
      expect(find.text('Notification Details'), findsOneWidget);
      expect(find.text('Urgent Notification: Requires immediate attention and action.'), findsOneWidget);
      expect(find.text('Emergency Severe Weather Warning'), findsOneWidget);
      expect(find.text('Campus classes suspended due to cyclone advisory. Stay indoors safely.'), findsOneWidget);
      expect(find.text('Back to Notifications'), findsOneWidget);
    });
  });
}
