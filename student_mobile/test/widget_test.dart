import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:student_mobile/main.dart';
import 'package:student_mobile/screens/onboarding_screen.dart';

void main() {
  setUp(() {
    FlutterSecureStorage.setMockInitialValues({'onboarding_completed': 'true'});
  });

  testWidgets('App renders splash screen branding', (WidgetTester tester) async {
    await tester.pumpWidget(const StudentAttendanceApp());

    // Expect splash screen elements
    expect(find.text('SmartCampus Attendance'), findsOneWidget);
    expect(find.text('Dynamic QR & GPS Verified Security'), findsOneWidget);

    // Pump past the splash delay
    await tester.pumpAndSettle(const Duration(seconds: 3));

    // Expect login screen elements
    expect(find.text('Sign In'), findsOneWidget);
  });

  testWidgets('OnboardingScreen renders slides and navigation controls', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: OnboardingScreen(),
      ),
    );

    // Check first slide content
    expect(find.text('Dynamic Anti-Proxy QR'), findsOneWidget);
    expect(find.text('Next'), findsOneWidget);
    expect(find.text('Skip'), findsOneWidget);

    // Tap next to go to Slide 2
    await tester.tap(find.text('Next'));
    await tester.pumpAndSettle();

    expect(find.text('75m Classroom Geofence'), findsOneWidget);

    // Tap next to go to Slide 3
    await tester.tap(find.text('Next'));
    await tester.pumpAndSettle();

    expect(find.text('Hardware-Bound Key'), findsOneWidget);
    expect(find.text('Get Started'), findsOneWidget);
  });
}
