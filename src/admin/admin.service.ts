import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PRISMA_SERVICE } from '../multi-tenant/multi-tenant.module';

import {
  CreateUserDto,
  UpdateUserDto,
  CreateRoleDto,
  UpdateRoleDto,
  CreatePermissionDto,
  UpdatePermissionDto,
} from './dto';
import { RoleEntity, UserEntity } from './entities';
import { MakeTimedIDUnique } from 'src/common/common.helper';

@Injectable()
export class AdminService {
  constructor(@Inject(PRISMA_SERVICE) private readonly prisma: PrismaService) {}

  // --- USERS ---
  async getUsers(): Promise<UserEntity[]> {
    return await this.prisma.user.findMany();
  }

  async getUser(id: string): Promise<UserEntity> {
    return await this.prisma.user.findUniqueOrThrow({ where: { userId: id } });
  }

  async createUser(dto: CreateUserDto): Promise<UserEntity> {
    return await this.prisma.user.create({
      data: { userId: MakeTimedIDUnique(), ...dto },
    });
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<UserEntity> {
    return await this.prisma.user.update({ where: { userId: id }, data: dto });
  }

  async deleteUser(id: string): Promise<UserEntity> {
    return await this.prisma.user.delete({ where: { userId: id } });
  }

  // --- ROLES ---
  async getRoles(): Promise<RoleEntity[]> {
    return await this.prisma.role.findMany();
  }

  async getRole(id: string): Promise<RoleEntity> {
    return await this.prisma.role.findUniqueOrThrow({ where: { roleId: id } });
  }

  async createRole(dto: CreateRoleDto): Promise<RoleEntity> {
    return await this.prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: { roleName: dto.roleName },
      });
      if (dto.permissions && dto.permissions.length > 0) {
        await tx.resourcePermission.createMany({
          data: dto.permissions.map((perm) => ({
            resourcePermissionId: MakeTimedIDUnique(),
            ...perm,
            roleId: role.roleId,
          })),
        });
      }
      return role;
    });
  }

  async updateRole(id: string, dto: UpdateRoleDto): Promise<RoleEntity> {
    return await this.prisma.$transaction(async (tx) => {
      const role = await tx.role.update({
        where: { roleId: id },
        data: { roleName: dto.roleName },
      });
      if (dto.permissions) {
        // Remove old permissions
        await tx.resourcePermission.deleteMany({ where: { roleId: id } });
        // Add new permissions
        if (dto.permissions.length > 0) {
          await tx.resourcePermission.createMany({
            data: dto.permissions.map((perm) => ({
              resourcePermissionId: MakeTimedIDUnique(),
              ...perm,
              roleId: id,
            })),
          });
        }
      }
      return role;
    });
  }

  async deleteRole(id: string): Promise<RoleEntity> {
    return await this.prisma.role.delete({ where: { roleId: id } });
  }

  // --- PERMISSIONS ---
  async getPermissions() {
    return await this.prisma.resourcePermission.findMany();
  }

  async getPermission(roleId: string) {
    return await this.prisma.resourcePermission.findMany({
      where: { roleId },
    });
  }

  async createPermission(dto: CreatePermissionDto) {
    return this.prisma.resourcePermission.create({
      data: { resourcePermissionId: MakeTimedIDUnique(), ...dto },
    });
  }

  async updatePermission(id: string, dto: UpdatePermissionDto) {
    return await this.prisma.resourcePermission.update({
      where: { resourcePermissionId: id },
      data: dto,
    });
  }

  async deletePermission(id: string) {
    return await this.prisma.resourcePermission.delete({
      where: { resourcePermissionId: id },
    });
  }
}
