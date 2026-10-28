import { Injectable, Inject } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PRISMA_SERVICE } from '../multi-tenant/multi-tenant.module';
import { assertPassword } from 'src/common/password';

import {
  CreateUserDto,
  UpdateUserDto,
  CreateRoleDto,
  UpdateRoleDto,
  CreatePermissionDto,
  UpdatePermissionDto,
} from './dto';
import { RoleEntity, UserEntity } from './entities';

const userPublicSelect = {
  userId: true,
  username: true,
  firstName: true,
  middleName: true,
  lastName: true,
  fullName: true,
  gender: true,
  birthDateString: true,
  email: true,
  mobile: true,
  address: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class AdminService {
  constructor(@Inject(PRISMA_SERVICE) private readonly prisma: PrismaService) {}

  private async hashPassword(password: string): Promise<string> {
    assertPassword(password);
    return bcrypt.hash(password, await bcrypt.genSalt());
  }

  // --- USERS ---
  async getUsers(): Promise<UserEntity[]> {
    return await this.prisma.user.findMany({ select: userPublicSelect });
  }

  async getUser(id: string): Promise<UserEntity> {
    return await this.prisma.user.findUniqueOrThrow({
      where: { userId: id },
      select: userPublicSelect,
    });
  }

  async createUser(dto: CreateUserDto): Promise<UserEntity> {
    const { roleIds, password, ...userData } = dto;
    const passwordHash = await this.hashPassword(password);
    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        select: userPublicSelect,
        data: {
          ...userData,
          password: passwordHash,
        },
      });
      if (roleIds && roleIds.length > 0) {
        await tx.userRole.createMany({
          data: roleIds.map((roleId) => ({
            userId: user.userId,
            roleId,
          })),
        });
      }
      return user;
    });
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<UserEntity> {
    const { roleIds, password, ...userData } = dto;
    const passwordHash = password
      ? await this.hashPassword(password)
      : undefined;
    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { userId: id },
        select: userPublicSelect,
        data: {
          ...userData,
          ...(passwordHash ? { password: passwordHash } : {}),
        },
      });
      if (roleIds) {
        await tx.userRole.deleteMany({ where: { userId: id } });
        if (roleIds.length > 0) {
          await tx.userRole.createMany({
            data: roleIds.map((roleId) => ({
              userId: id,
              roleId,
            })),
          });
        }
      }
      return user;
    });
  }

  async deleteUser(id: string): Promise<UserEntity> {
    return await this.prisma.user.delete({
      where: { userId: id },
      select: userPublicSelect,
    });
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
        data: {
          ...(dto.roleName !== undefined ? { roleName: dto.roleName } : {}),
        },
      });
      if (dto.permissions) {
        await tx.resourcePermission.deleteMany({ where: { roleId: id } });
        if (dto.permissions.length > 0) {
          await tx.resourcePermission.createMany({
            data: dto.permissions.map((perm) => ({
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
      data: { ...dto },
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
