---
name: authz-wiring
description: Wires JWT guards, role checks, and resource permissions for Nest routes. Use when editing src/auth, src/admin, login cookies, Roles, Permissions, or ResourceName.
---

# Authorization wiring

Authentication answers who the caller is. Authorization answers what they may do. Authorization runs only after `CustomJwtGuard` has set `request.user.profile`.

## Protected controller

```typescript
@UseGuards(CustomJwtGuard, PermissionsGuard, RolesGuards)
@Roles({ OR: ['ADMIN', 'SUPER ADMIN'] })
```

Per route:

```typescript
@Permissions({ AND: ['Article.view'] })
```

`AND` and `OR` may be nested. Admin routes that omit `@Permissions` pass the permission guard and rely on `@Roles`.

## New resource

1. Add the name to `ResourceName` in `src/auth/dto/permissions.ts`.
2. Decorate routes with `` `${ResourceName}.${create|view|update|delete}` ``.
3. Seed `ResourcePermission` rows. `SUPER ADMIN` gets every flag. Grant `ADMIN` only the flags the product allows.
4. Role names in decorators and `roleName` are `ADMIN` and `SUPER ADMIN`. Seeded role ids are `ADMIN` and `SUPERADMIN`.

`CustomJwtGuard` verifies the access token, then rejects it unless `tokenUse` is `access`, `tenant` equals the request host, and `sid` is an unrevoked, unexpired `UserRefreshToken` for `sub` in that tenant's database. It replaces `profile.roles` with that user's current `UserRole` names. `PermissionsGuard` loads permission flags for those names. A role or permission change applies on the next request. Ending a session is separate: `POST /auth/logout` revokes the current row, and `POST /auth/logout-all` or `POST /admin/users/:id/sessions/revoke` revokes every active row for the user. A refresh token whose row is already revoked revokes every active session for that user. Refresh tokens are stored as SHA-256 hashes.

## Cookies and passwords

`LoginGuard` is for `POST /auth/login`. Passwords are bcrypt hashes. Access and refresh tokens are signed, returned in the body, and stored as signed cookies whose names come from the tenant's `env.conf` section. Each login inserts one `UserRefreshToken` row for that host. The raw refresh token is not stored.

Do not log passwords, refresh tokens, or `Authorization` headers in new code.
