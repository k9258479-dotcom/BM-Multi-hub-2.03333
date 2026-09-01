# Security Specification & Threat Model (ABAC & Zero-Trust)

## 1. Data Invariants
1. **User Identity & Credentials**: Every user record must possess an ID (`usr_*`), non-empty username, role (`super_admin`, `media_buyer`, `account_manager`, `client_viewer`), password, and a non-empty array of assigned asset IDs.
2. **Ad Account Association**: Every ad account (`act_*`) must link to a valid client ID and record daily spend, daily budget, spend limit thresholds (80-100%), active ads count, and verified ROAS.
3. **Pixel Connection & Token**: Every pixel configuration (`px_*`) must specify a valid platform (`meta`, `google`, `tiktok`, `snapchat`), pixel ID, API token, status (`healthy`, `warning`, `error`, `syncing`), and 24h event telemetry.
4. **Audit Immutability**: Audit logs are append-only and cannot be altered or deleted by any user.
5. **Budget Alerts**: Alerts are generated upon threshold breaches and must carry valid spend vs budget numbers.

## 2. The Dirty Dozen Attack Payloads (Must be Blocked)
1. **Payload 1 (Ghost Field / Shadow Injection)**: Injected `isRootSuperuser: true` into `/users/usr_123` update.
2. **Payload 2 (Path Poisoning)**: Attempt to write document ID with 2KB junk character string.
3. **Payload 3 (Negative Budget)**: Ad account daily budget specified as `-5000`.
4. **Payload 4 (Unbounded Array Injection)**: Injected array of 10,000 strings into `assignedAssetIds` to cause Denial of Wallet.
5. **Payload 5 (Status Escalation)**: Modifying account status to undefined state `SUPER_BYPASS`.
6. **Payload 6 (Unauthorized Deletion)**: Non-admin trying to delete `/users/usr_admin_kim`.
7. **Payload 7 (Orphaned Account)**: Creating an ad account with an empty string for `clientId`.
8. **Payload 8 (Pixel Token Spoofing)**: Submitting a pixel config with `tokenExpiryDays` set to `-999`.
9. **Payload 9 (Audit Log Mutation)**: Updating an existing audit log entry's timestamp or action.
10. **Payload 10 (Client Budget Overflow)**: Submitting monthly budget cap exceeding numerical bounds.
11. **Payload 11 (Unauthenticated Alert Mutation)**: Modifying alert state without authentication.
12. **Payload 12 (Direct Field Tampering)**: Modifying `createdAt` immortal field on client or user profile.
