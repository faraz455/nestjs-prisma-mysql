# Authorization

This section covers the permission-based and role-based authorization mechanisms used in the application to ensure secure and controlled access to resources.

## Permission-Based Authorization

- **Resource Permissions**: Resource permissions dictate the actions a role can perform on specific resources.
- **Permission Granularity**: Permissions can be highly granular, allowing for precise control over user access to resources and actions such as `create`, `view`, `update`, `delete`.

## Role Guard

The Role Guard (`RolesGuard`) ensures role-based authorization by verifying if the user possesses the required role(s) to access a particular endpoint. If the user's role matches the required role(s) specified in the endpoint's metadata, access is granted; otherwise, the request is denied.

### Usage Example:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

// Define the required roles
const rolesRequired: RolesObject = {
  AND: ['ADMIN'],
};

@Controller('admin')
@UseGuards(RolesGuard)
export class AdminController {
  @Get()
  @Roles(rolesRequired) // Apply the @Roles decorator with the required roles
  findAll() {
    // Code to fetch and return all admin-related data
  }
}
```

## Permission Guard

The Permission Guard (`PermissionsGuard`) offers more intricate authorization capabilities by evaluating complex permission structures. It enables the specification of intricate permission requirements using a recursive structure. For example, a permission might demand that a user has permission to create a resource and either view or edit it. The Permission Guard evaluates these conditions and grants access if the user meets the specified permission criteria.

### Usage Example:

```typescript
import { Controller, Post, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from './guards/permissions.guard';
import { Permissions } from './decorators/permissions.decorator';

// Define the required permissions using a structured object
const permissionRequired: PermsObject = {
  AND: [
    'ResourceName.create',
    { OR: ['ResourceName.create', 'ResourceName.view'] },
  ],
};

@Controller('resources')
@UseGuards(PermissionsGuard)
export class ResourcesController {
  @Post()
  @Permissions(permissionRequired) // Apply the @Permissions decorator with the required permissions
  create() {
    // Code to create a new resource
  }
}
```

## Combined Authorization

By leveraging both role-based and permission-based authorization mechanisms, the application ensures robust access control, granting users the appropriate privileges based on their roles and permissions.

### Summary

- **Role Guard**: Ensures users have the necessary roles to access specific endpoints.
- **Permission Guard**: Evaluates complex permission structures to grant or deny access based on specific criteria.
