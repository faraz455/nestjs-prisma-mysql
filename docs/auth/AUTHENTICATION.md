# Authentication

This system is designed to ensure secure access to our application by validating user credentials and managing permissions based on roles.

## User Signup

During the signup process:

- **Mandatory Fields**: Username and password are required.
- **Password Storage**: The password is hashed using bcrypt and stored in the user table database.

## User Login

When a user logs in:

- **Credentials**: The user must provide a valid username and password.
- **Validation**: User credentials are validated against the stored username and hashed password.
- **Token Generation**: Upon successful validation, an access token and a refresh token are generated.
- **Cookie Management**: The generated tokens are set in cookies (`AUTH_COOKIE_NAME` and `REFRESH_COOKIE_NAME`) to validate the user where JWT guard is applied.

## Login Guard and Strategy

- **Login Guard**: Validates user credentials and generates access and refresh tokens upon successful authentication.

## Token Management

- **Access Token**: Used for authentication in subsequent requests to protected endpoints.
- **Refresh Token**: Allows users to obtain a new access token without re-entering credentials if the access token expires.

## Cookie Management

- Upon successful login, the access token and refresh token are set in cookies with specific names (`AUTH_COOKIE_NAME` and `REFRESH_COOKIE_NAME`).

## Custom JWT Guard

- **Validation**: The custom JWT guard validates the access token for requests to protected endpoints.
- **Token Expiry**: If the access token is expired, it checks the refresh token. If the refresh token is still valid, a new access token is generated using the `refresh-token` endpoint.

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
