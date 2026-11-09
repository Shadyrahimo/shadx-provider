# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Default-Deny Catch-All**: Every path not explicitly matched is denied (`allow read, write: if false;`).
2. **Verified Authentication**: Every write and read requires an authenticated user with `request.auth.token.email_verified == true`.
3. **Path Variable Hardening**: Document IDs (`{userId}`, `{adminId}`) must match `^[a-zA-Z0-9_\-]+$` and have length `1..128`.
4. **Strict Key & Schema Validation (`isValidUserAccount` / `isValidAdminRecord`)**:
   - All required keys must be present (`hasAll`) and no extra/shadow keys are permitted (`hasOnly`).
   - All string fields have explicit minimum and maximum `.size()` bounds.
   - Enumerated fields (`role`, `accountStatus`, `planTier`) are strictly restricted to allowed values.
5. **Anti-Privilege Escalation on Registration**:
   - Non-owner users registering their own `/users/{userId}` document MUST set `userId == request.auth.uid`, `uid == request.auth.uid`, `email == request.auth.token.email`, `role == 'merchant'`, and `accountStatus == 'pending'`. They cannot self-assign `owner`, `admin`, or `active`.
6. **Tiered Action-Based Updates & Terminal State Locking**:
   - Only `isAdmin()` (the bootstrapped owner `shadyrahimo@gmail.com` with `email_verified == true`, or a UID in `/admins/{uid}`) can modify `role`, `accountStatus`, `planTier`, `subscriptionEndsAt`, or `notes`.
   - Regular users can only update `displayName`, `storeName`, `contactInfo`, and `updatedAt` on their own document, and ONLY when `existing().accountStatus != 'suspended'`.
7. **Temporal & Immortal Field Integrity**:
   - `createdAt` and `uid` are immutable on update.
   - `createdAt` must equal `request.time` on create; `updatedAt` must equal `request.time` on create and update.
8. **PII Isolation & Query Enforcer**:
   - Reading or listing `/users/{userId}` is restricted strictly to the document owner (`resource.data.uid == request.auth.uid`) or `isBootstrappedOwner()`, with zero `get()`/`exists()` calls inside `allow list`.

---

## 2. The "Dirty Dozen" Payloads

1. **Payload 1 (Self-Assigned Admin Role on Create)**:
   `{ "uid": "user_1", "email": "user1@example.com", "displayName": "Test", "storeName": "Store", "contactInfo": "", "role": "owner", "accountStatus": "pending", "planTier": "pro", "subscriptionEndsAt": "2027-01-01", "notes": "", "createdAt": "SERVER_TIMESTAMP", "updatedAt": "SERVER_TIMESTAMP" }` -> `PERMISSION_DENIED`
2. **Payload 2 (Self-Activated Account on Create)**:
   `{ "uid": "user_1", "email": "user1@example.com", "displayName": "Test", "storeName": "Store", "contactInfo": "", "role": "merchant", "accountStatus": "active", "planTier": "pro", "subscriptionEndsAt": "2027-01-01", "notes": "", "createdAt": "SERVER_TIMESTAMP", "updatedAt": "SERVER_TIMESTAMP" }` -> `PERMISSION_DENIED`
3. **Payload 3 (Shadow/Ghost Field Injection)**:
   `{ ..., "isSuperAdmin": true }` -> `PERMISSION_DENIED`
4. **Payload 4 (Identity Spoofing - Creating Profile for Another UID)**:
   User `user_1` writes to `/users/user_2` with `uid: "user_2"` -> `PERMISSION_DENIED`
5. **Payload 5 (Email Spoofing - Unverified Owner Email)**:
   Token has `email: "shadyrahimo@gmail.com"` but `email_verified: false` -> `PERMISSION_DENIED`
6. **Payload 6 (PII Blanket Read - Reading Another Merchant's Profile)**:
   User `user_1` attempts `get(/users/user_2)` -> `PERMISSION_DENIED`
7. **Payload 7 (Unauthorized List Scraping by Non-Owner)**:
   User `user_1` attempts `list(/users)` without `where('uid', '==', 'user_1')` -> `PERMISSION_DENIED`
8. **Payload 8 (Merchant Privilege Escalation on Update)**:
   User `user_1` updates `accountStatus` to `"active"` or `role` to `"admin"` on `/users/user_1` -> `PERMISSION_DENIED`
9. **Payload 9 (Update While in Locked/Suspended Terminal State)**:
   Suspended user `user_1` (`accountStatus == "suspended"`) attempts to update `storeName` -> `PERMISSION_DENIED`
10. **Payload 10 (Immortal Field Mutation - Changing `createdAt` or `uid`)**:
    User `user_1` updates `createdAt` to `request.time` during profile update -> `PERMISSION_DENIED`
11. **Payload 11 (Forged Client Timestamp)**:
    User `user_1` sends a past/future timestamp instead of `request.time` for `updatedAt` -> `PERMISSION_DENIED`
12. **Payload 12 (Value/Size Poisoning - 5KB String in `storeName`)**:
    User `user_1` updates `storeName` with a 5,000-character string (exceeding `maxLength: 120`) -> `PERMISSION_DENIED`
