# Security Specification - Handover HQ

## Data Invariants
1. Handover records MUST have a `creatorId` matching the authenticated user's UID.
2. Notifications MUST reside in a sub-collection of the user they belong to.
3. User profiles MUST be immutable except for `themePreference`.
4. Handover records MUST NOT be deleted except by admins or the creator (though the UI doesn't show delete yet, we should protect it).

## The Dirty Dozen Payloads
1. **Identity Spoofing**: Attempt to create a handover with `creatorId` set to a victim's UID.
2. **Resource Poisoning**: Create a handover with a 1MB title string.
3. **Privilege Escalation**: Update own user document to set `role: 'admin'`.
4. **State Shortcutting**: Create a handover with an invalid status like `status: 'completed'`.
5. **PII Leak**: Authenticated user attempts to `get` another user's profile document.
6. **Orphaned Write**: Create a notification in another user's path.
7. **Malicious ID**: Attempt to create a document with ID `../../secrets`.
8. **Timestamp Fraud**: Create a handover with a future `createdAt` timestamp.
9. **Field Injection**: Update a handover to add a `hiddenAdmin: true` field.
10. **Immutable Violation**: Update a handover's `createdAt` field.
11. **Guest Hijack**: Anonymous user attempts to update an admin's profile.
12. **Query Scraping**: Authenticated user attempts to `list` all user profiles.

## Test Runner
(Tests will be verified using the rules deployment and internal logic checks)
