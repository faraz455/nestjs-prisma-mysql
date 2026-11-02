# Authentication

This system is designed to ensure secure access to our application by validating user credentials and managing permissions based on roles.

## User Signup

During the signup process:

- **Mandatory Fields**: Username and password are required.
- **Password Rule**: A new password must be at least 8 characters and at most 72 bytes. The same rule applies when an administrator sets a password. Login still accepts a shorter password that is already stored, and it rejects a password longer than 72 bytes before bcrypt runs.
- **Password Storage**: The password is hashed using bcrypt and stored in the user table. Admin create and update hash the password before the write. User responses omit the hash. A password change revokes every active session for that user in the same transaction, so tokens issued before the change stop working.
- **Attempt Limit**: Login, signup, and token refresh each allow 10 attempts per minute for one connecting address. The next attempt receives `429`.

## User Login

When a user logs in:

- **Credentials**: The user must provide a valid username and password.
- **Validation**: User credentials are validated against the stored username and hashed password.
- **Token Generation**: Upon successful validation, an access token and a refresh token are generated. The JSON body includes the access token and omits the refresh token.
- **Cookie Management**: Both tokens are set as cookies (`AUTH_COOKIE_NAME` and `REFRESH_COOKIE_NAME`). The cookies are signed, `HttpOnly`, `SameSite=Lax`, and `Path=/`. `Max-Age` is 24 hours for the access cookie and 25 hours for the refresh cookie. `Secure` is set when `PRODUCTION` is not `0`.

## Login Guard and Strategy

- **Login Guard**: Validates user credentials and generates access and refresh tokens upon successful authentication.

## Token Management

- **Access Token**: Used for authentication in subsequent requests to protected endpoints.
- **Refresh Token**: `POST /auth/refresh-token` reads the signed refresh cookie and issues a new session. The refresh token is not accepted from the JSON body and is not returned in the JSON body.

## Cookie Management

- Upon successful login, the access token and refresh token are set in `HttpOnly` cookies (`AUTH_COOKIE_NAME` and `REFRESH_COOKIE_NAME`). JavaScript on the page cannot read them. Logout clears both cookies with the same `Path`, `SameSite`, and `Secure` flags.

## Custom JWT Guard

- **Validation**: The custom JWT guard validates the access token for requests to protected endpoints.
- **Tenant**: The token's `tenant` claim must match the request host. A token issued for one tenant is rejected on another.
- **Session**: The token's `sid` must be an active `UserRefreshToken` row in that tenant's database. A missing, revoked, or expired row is unauthorized. `yarn data:reset` deletes those rows in the database named by `DATABASE_URL`, so tokens issued before the reset stop working. Skip that command when the database holds production data.
- **Current roles**: After the session is active, the guard loads the user's current role names from MySQL and puts them on the request profile. A role change applies on the next request.
- **Token Expiry**: Call `POST /auth/refresh-token` with the refresh cookie to issue a new session. The previous session row is revoked.

## Sessions

- **Logout**: `POST /auth/logout` revokes the current session and clears the auth cookies.
- **Logout everywhere**: `POST /auth/logout-all` revokes every active session for the caller. The caller must log in again.
- **Admin revoke**: `POST /admin/users/:id/sessions/revoke` revokes every active session for that user. `ADMIN` and `SUPER ADMIN` can call it.
- **Refresh reuse**: Sending a refresh token that was already revoked revokes every remaining session for that user.

## Token Revocation

- **Management**: Refresh tokens are securely managed in the `UserRefreshToken` table.
- **Revocation**: Refresh tokens are revoked only once to maintain security.

## Endpoints

- **Signup**: Allows users to register for an account.
- **Login**: Authenticates users and generates access and refresh tokens.
- **Refresh Token**: Generates a new access token using a valid refresh token.
- **Logout**: Clears user authentication cookies.
- **Protected Endpoints**: Endpoints requiring authentication, such as article-related endpoints, demonstrate the authentication workflow.

## Usage

By using `@UseGuards(CustomJwtGuard)`:

- **Controller Level**: Apply the guard over an entire controller.
- **Endpoint Level**: Apply the guard to specific endpoints.

```typescript
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CustomJwtGuard } from './guards/custom-jwt.guard';

@Controller('articles')
@UseGuards(CustomJwtGuard) // Guard applied to entire controller
export class ArticlesController {
  @Get()
  findAll() {
    // Code to fetch and return all articles
  }

  @Post()
  @UseGuards(CustomJwtGuard) // Guard applied to specific endpoint
  create() {
    // Code to create a new article
  }
}
```

## Public Access

- Decorator: By using @IsPublic(), you can make specific endpoints accessible without authentication.
- Usage: Apply the @IsPublic() decorator to bypass the authentication check for specific endpoints.

## Summary

This authentication mechanism ensures secure access to protected endpoints while maintaining user tokens and adhering to best practices.
