# Security Architecture & Risk Mitigation

## 1. Threat Model & Mitigations
| Threat Vector | Attack Scenario | Implemented Defense Layer |
|---|---|---|
| **QR Screenshot Sharing** | Student in class screenshots QR and WhatsApps it to an absent peer. | **Short Expiry (15-30s) + GPS Geofencing (75m)**. Absent peer cannot submit without proximate GPS and fresh token. |
| **GPS Spoofing** | Student uses mock location app to simulate classroom coordinates. | **Mock Location Flag Detection + Hardware GPS Accuracy Filter (<20m) + Device Challenge Verification**. |
| **Proxy Device Usage** | One student brings multiple phones to class to scan for friends. | **Registered Primary Hardware Key (Keystore/Keychain) + Optional Local Biometrics + Random Physical Verification**. |
| **Token Replay Attacks** | Attacker replays valid past submission payload. | **Cryptographic Nonce + Challenge-Response Nonce + Atomic Unique Constraints on Session-Student**. |
| **Credential Stuffing** | Brute forcing passwords on student/teacher portals. | **Argon2id Hashing + Rate Limiting (Redis-backed Throttler) + Audit Logs**. |
| **Token Theft / XSS** | Refresh token stolen from client storage. | **HTTP-Only Cookies / Secure Storage + Refresh Token Rotation & Family Revocation**. |

## 2. Cryptographic Specifications
1. **Dynamic QR Payload**:
   ```json
   {
     "sid": "session-uuid",
     "sub": "subject-uuid",
     "iat": 1729000000,
     "exp": 1729000030,
     "non": "cryptographically-secure-random-bytes-hex",
     "sig": "HMAC-SHA256(sid:sub:iat:exp:non, QR_HMAC_SECRET)"
   }
   ```
2. **Device-Bound Authentication**:
   - Asymmetric ECDSA P-256 key pair generated inside Android Keystore or iOS Secure Enclave.
   - Server provides one-time challenge nonce: `sign(challenge + timestamp + student_id)`.
   - Private key never leaves hardware boundary.
3. **Password Security**:
   - Argon2id with memory cost 64MB, iterations 3, parallelism 1.
