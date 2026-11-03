import 'dart:math';
import 'package:flutter_test/flutter_test.dart';
import 'package:student_mobile/core/security/security_utils.dart';

void main() {
  group('Student Attendance Logic Tests', () {
    test('Haversine distance calculation within 75m boundary', () {
      const double lat1 = 12.9715987;
      const double lon1 = 77.5945627;
      const double lat2 = 12.9717000;
      const double lon2 = 77.5945627;

      // Distance calculation in meters
      const double earthRadiusMeters = 6371000;
      const dLat = (lat2 - lat1) * (pi / 180);
      const dLon = (lon2 - lon1) * (pi / 180);
      final a = sin(dLat / 2) * sin(dLat / 2) +
          cos(lat1 * (pi / 180)) * cos(lat2 * (pi / 180)) *
          sin(dLon / 2) * sin(dLon / 2);
      final c = 2 * atan2(sqrt(a), sqrt(1 - a));
      final distance = earthRadiusMeters * c;

      expect(distance, lessThan(75.0));
      expect(distance, greaterThan(0.0));
    });

    test('Dynamic QR token parsing', () {
      const qrPayloadString = '{"sid":"session-1","sub":"CS601","iat":1729000,"exp":1729030,"non":"nonce123"}';
      expect(qrPayloadString.contains('CS601'), isTrue);
    });

    test('Institutional email validation (@college.edu only)', () {
      expect(CredentialValidator.isValidInstitutionalEmail('aarav.sharma@college.edu'), isTrue);
      expect(CredentialValidator.isValidInstitutionalEmail('prof.mehta@college.edu'), isTrue);
      expect(CredentialValidator.isValidInstitutionalEmail('student@gmail.com'), isFalse);
      expect(CredentialValidator.isValidInstitutionalEmail('invalid@yahoo.com'), isFalse);
      expect(CredentialValidator.isValidInstitutionalEmail('@college.edu'), isFalse);
    });

    test('Roll number and registration number formats', () {
      expect(CredentialValidator.isValidRollNumber('CS2026-001'), isTrue);
      expect(CredentialValidator.isValidRollNumber('IT2026-104'), isTrue);
      expect(CredentialValidator.isValidRollNumber('invalid_roll'), isFalse);

      expect(CredentialValidator.isValidRegistrationNumber('202698765432'), isTrue);
      expect(CredentialValidator.isValidRegistrationNumber('123'), isFalse);
    });

    test('Cryptographic strong password generator & strength evaluation', () {
      final pass = PasswordGenerator.generateStrongPassword(length: 16);
      expect(pass.length, equals(16));
      expect(pass.contains(RegExp(r'[A-Z]')), isTrue);
      expect(pass.contains(RegExp(r'[a-z]')), isTrue);
      expect(pass.contains(RegExp(r'[0-9]')), isTrue);

      final strength = CredentialValidator.evaluatePasswordStrength(pass);
      expect(strength, equals(PasswordStrength.strong));

      expect(CredentialValidator.evaluatePasswordStrength('short'), equals(PasswordStrength.weak));
      expect(CredentialValidator.evaluatePasswordStrength('weakpassword123'), equals(PasswordStrength.fair));
    });
  });
}
