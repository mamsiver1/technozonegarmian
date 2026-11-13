# Security Specification — Garmian Technology Zone (زۆنی تەکنەلۆژیای گەرمیان)

## 1. Data Invariants
1. **Single-Owner Write Authority**: Only the verified site owner (`request.auth.token.email == 'chataisiver12@gmail.com' && request.auth.token.email_verified == true`) or a pre-registered admin UID in `/admins/{uid}` may create, update, or delete `/posts/{postId}` and `/posts/{postId}/gallery/{mediaId}` documents.
2. **Public Read / Draft Isolation**: Unauthenticated visitors and non-admin users may read/list ONLY documents where `status == 'published'`. Draft documents (`status == 'draft'`) are strictly invisible to non-admins.
3. **Immutable Ownership & Temporal Integrity**: `authorUid`, `id`, and `createdAt` are immutable after creation; `createdAt == request.time` on create and `updatedAt == request.time` on update.
4. **Strict Field Allowlisting & Volumetric Bounds**: Shadow fields are rejected via `keys().hasAll(...)` + `keys().hasOnly(...)` on create and `affectedKeys().hasOnly(...)` on update; all strings and arrays enforce strict `.size()` upper bounds to prevent Denial-of-Wallet attacks.
5. **Relational Master Gate on Gallery Subcollection**: Every write to `/posts/{postId}/gallery/{mediaId}` verifies parent post existence (`exists(...)` / `get(...)`) and matching `postId` & `authorUid`.

## 2. Dirty Dozen Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated Post Create**: Anonymous client attempts `create /posts/p1` -> Denied (`!isAdmin()`).
2. **Non-Owner Authenticated Post Create**: Verified user `other@gmail.com` attempts `create /posts/p2` -> Denied (`!isAdmin()`).
3. **Unverified Admin Email Spoof**: User with `email == 'chataisiver12@gmail.com'` and `email_verified == false` attempts `create /posts/p3` -> Denied.
4. **Self-Privilege Escalation**: Non-admin user attempts `create /admins/{uid}` -> Denied (`allow write: if false`).
5. **Draft Scraping via List Query**: Public visitor queries `/posts` without `where('status', '==', 'published')` or requests a draft document -> Denied (`resource.data.status == 'published'`).
6. **Shadow Field Injection on Create**: Admin sends extra ghost field `isVerified: true` on `/posts/p4` -> Denied (`keys().hasOnly(...)`).
7. **Shadow Field Injection on Update**: Admin attempts `update /posts/p4` adding `viewsCount: 9999` -> Denied (`affectedKeys().hasOnly(...)`).
8. **Author UID Spoofing**: Admin attempts `create /posts/p5` with `authorUid: 'someone_else'` -> Denied (`authorUid == request.auth.uid`).
9. **Immutable Field Mutation**: Admin attempts `update /posts/p5` changing `createdAt` or `authorUid` -> Denied.
10. **Client-Forged Timestamp**: Admin sends backdated `createdAt` != `request.time` -> Denied.
11. **Oversized ID / Resource Poisoning**: Admin attempts `create /posts/bad$id` or 200-char ID or 2MB `content` -> Denied (`isValidId` and `.size()` limits).
12. **Orphaned Gallery Write**: Admin attempts `create /posts/nonexistent_post/gallery/g1` -> Denied (`exists(/databases/$(database)/documents/posts/$(postId))`).
