import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuards } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { AdminService } from './admin.service';
import { RoleEntity, UserEntity } from './entities';
import {
  CreateUserDto,
  UpdateUserDto,
  CreateRoleDto,
  UpdateRoleDto,
  CreatePermissionDto,
  UpdatePermissionDto,
} from './dto';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { CustomJwtGuard } from 'src/auth/guards/custom-jwt.guard';
import { AuthService } from 'src/auth/auth.service';
import { RevokedSessionsEntity } from 'src/auth/entities';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(CustomJwtGuard, PermissionsGuard, RolesGuards)
@Roles({ OR: ['SUPER ADMIN', 'ADMIN'] })
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
  ) {}

  // --- USERS ---
  @Get('users')
  async getUsers(): Promise<UserEntity[]> {
    return this.adminService.getUsers();
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string): Promise<UserEntity> {
    return this.adminService.getUser(id);
  }

  @Post('users')
  async createUser(@Body() dto: CreateUserDto): Promise<UserEntity> {
    return this.adminService.createUser(dto);
  }

  @Patch('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserEntity> {
    return this.adminService.updateUser(id, dto);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string): Promise<UserEntity> {
    return this.adminService.deleteUser(id);
  }

  @Post('users/:id/sessions/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: RevokedSessionsEntity })
  async revokeUserSessions(
    @Param('id') id: string,
  ): Promise<RevokedSessionsEntity> {
    return this.authService.revokeUserSessionsByAdmin(id);
  }

  // --- ROLES ---
  @Get('roles')
  async getRoles(): Promise<RoleEntity[]> {
    return this.adminService.getRoles();
  }

  @Get('roles/:id')
  async getRole(@Param('id') id: string): Promise<RoleEntity> {
    return this.adminService.getRole(id);
  }

  @Post('roles')
  async createRole(@Body() dto: CreateRoleDto): Promise<RoleEntity> {
    return this.adminService.createRole(dto);
  }

  @Patch('roles/:id')
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<RoleEntity> {
    return this.adminService.updateRole(id, dto);
  }

  @Delete('roles/:id')
  async deleteRole(@Param('id') id: string): Promise<RoleEntity> {
    return this.adminService.deleteRole(id);
  }

  // --- PERMISSIONS ---
  @Get('permissions')
  async getPermissions() {
    return this.adminService.getPermissions();
  }

  @Get('permissions/:roleId')
  async getPermission(@Param('roleId') roleId: string) {
    return this.adminService.getPermission(roleId);
  }

  @Post('permissions')
  async createPermission(@Body() dto: CreatePermissionDto) {
    return this.adminService.createPermission(dto);
  }

  @Patch('permissions/:id')
  async updatePermission(
    @Param('id') id: string,
    @Body() dto: UpdatePermissionDto,
  ) {
    return this.adminService.updatePermission(id, dto);
  }

  @Delete('permissions/:id')
  async deletePermission(@Param('id') id: string) {
    return this.adminService.deletePermission(id);
  }
}
