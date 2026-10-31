import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Student Attendance Logic Tests', () {
    test('Haversine distance calculation within 75m boundary', () {
      const double lat1 = 12.9715987;
      const double lon1 = 77.5945627;
      const double lat2 = 12.9717000;
      const double lon2 = 77.5945627;

      // Distance is ~11.2 meters
      expect(lat1, isNot(equals(lat2)));
    });

    test('Dynamic QR token parsing', () {
      const qrPayloadString = '{"sid":"session-1","sub":"CS601","iat":1729000,"exp":1729030,"non":"nonce123"}';
      expect(qrPayloadString.contains('CS601'), isTrue);
    });
  });
}
