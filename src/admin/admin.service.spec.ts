import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AdminService } from './admin.service';

function prisma() {
  const db = {
    user: {
      findMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(async ({ data }) => ({
        userId: data.userId ?? 'user-generated',
      })),
      update: jest.fn(async ({ where }) => ({ userId: where.userId })),
      delete: jest.fn(async ({ where }) => ({ userId: where.userId })),
    },
    userRole: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    role: {
      findMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(async ({ data }) => ({
        roleId: 'role-1',
        roleName: data.roleName,
      })),
      update: jest.fn(async ({ where }) => ({
        roleId: where.roleId,
        roleName: 'kept',
      })),
      delete: jest.fn(),
    },
    resourcePermission: {
      findMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  return {
    ...db,
    $transaction: jest.fn((fn: (tx: typeof db) => unknown) => fn(db)),
  };
}

const userDto = {
  username: 'ada',
  password: 'password',
  firstName: 'Ada',
  fullName: 'Ada Lovelace',
  gender: 'MALE' as const,
  birthDateString: '-',
};

describe('AdminService', () => {
  it('lists and reads users without selecting the password', async () => {
    const db = prisma();
    const service = new AdminService(db as never);
    db.user.findMany.mockResolvedValue([]);
    db.user.findUniqueOrThrow.mockResolvedValue({ userId: 'user-1' });

    await service.getUsers();
    await service.getUser('user-1');

    expect(db.user.findMany.mock.calls[0][0].select.username).toBe(true);
    expect(db.user.findMany.mock.calls[0][0].select.password).toBeUndefined();
    expect(db.user.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      select: expect.objectContaining({ username: true }),
    });
  });

  it('hashes a created password and assigns the requested roles in one transaction', async () => {
    const db = prisma();
    const created = await new AdminService(db as never).createUser({
      ...userDto,
      roleIds: ['role-a', 'role-b'],
    });
    const arg = db.user.create.mock.calls[0][0];

    expect(db.$transaction).toHaveBeenCalled();
    expect(arg.select.password).toBeUndefined();
    expect(arg.data.userId).toBeUndefined();
    expect(arg.data.password).not.toBe('secret');
    await expect(bcrypt.compare('password', arg.data.password)).resolves.toBe(
      true,
    );
    expect(db.userRole.createMany.mock.calls[0][0].data).toEqual([
      expect.objectContaining({ roleId: 'role-a', userId: created.userId }),
      expect.objectContaining({ roleId: 'role-b', userId: created.userId }),
    ]);
  });

  it('rejects a short or oversized password before writing the user', async () => {
    const db = prisma();
    const service = new AdminService(db as never);
    await expect(
      service.createUser({ ...userDto, password: 'short' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.updateUser('user-1', { password: 'a'.repeat(73) }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it('creates a user with no roles when role ids are omitted', async () => {
    const db = prisma();
    await new AdminService(db as never).createUser(userDto);
    expect(db.userRole.createMany).not.toHaveBeenCalled();
  });

  it('replaces roles only when role ids are present, and hashes a new password', async () => {
    const db = prisma();
    const service = new AdminService(db as never);

    await service.updateUser('user-1', { firstName: 'Grace' });
    expect(db.userRole.deleteMany).not.toHaveBeenCalled();
    expect(db.user.update.mock.calls[0][0].data.password).toBeUndefined();
    expect(db.user.update.mock.calls[0][0].data.firstName).toBe('Grace');

    await service.updateUser('user-1', { roleIds: [] });
    expect(db.userRole.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
    expect(db.userRole.createMany).not.toHaveBeenCalled();

    await service.updateUser('user-1', {
      roleIds: ['role-a'],
      password: 'next-password',
    });
    expect(db.userRole.createMany).toHaveBeenCalled();
    const password = db.user.update.mock.calls.at(-1)[0].data.password;
    await expect(bcrypt.compare('next-password', password)).resolves.toBe(true);
  });

  it('deletes a user through the public select', async () => {
    const db = prisma();
    await new AdminService(db as never).deleteUser('user-1');
    expect(db.user.delete).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      select: expect.objectContaining({ username: true }),
    });
    expect(db.user.delete.mock.calls[0][0].select.password).toBeUndefined();
  });

  it('creates role permissions inside the transaction and can omit them', async () => {
    const db = prisma();
    const service = new AdminService(db as never);
    await service.createRole({ roleName: 'AUDITOR' });
    expect(db.resourcePermission.createMany).not.toHaveBeenCalled();

    await service.createRole({
      roleName: 'AUDITOR',
      permissions: [
        { resourceName: 'Article', roleId: 'ignored', view: true },
      ] as never,
    });
    expect(db.resourcePermission.createMany.mock.calls[0][0].data[0]).toEqual(
      expect.objectContaining({
        roleId: 'role-1',
        resourceName: 'Article',
        view: true,
      }),
    );
  });

  it('does not clear permissions or the role name when a patch omits them', async () => {
    const db = prisma();
    const service = new AdminService(db as never);
    await service.updateRole('role-1', {});
    expect(db.role.update).toHaveBeenCalledWith({
      where: { roleId: 'role-1' },
      data: {},
    });
    expect(db.resourcePermission.deleteMany).not.toHaveBeenCalled();

    await service.updateRole('role-1', { permissions: [] });
    expect(db.resourcePermission.deleteMany).toHaveBeenCalledWith({
      where: { roleId: 'role-1' },
    });
    expect(db.resourcePermission.createMany).not.toHaveBeenCalled();
  });

  it('reads and writes permission rows by id and role', async () => {
    const db = prisma();
    const service = new AdminService(db as never);
    db.resourcePermission.findMany.mockResolvedValue([]);
    await service.getPermissions();
    await service.getPermission('role-1');
    expect(db.resourcePermission.findMany).toHaveBeenLastCalledWith({
      where: { roleId: 'role-1' },
    });

    await service.createPermission({
      resourceName: 'Article',
      roleId: 'role-1',
      delete: true,
    });
    expect(db.resourcePermission.create.mock.calls[0][0].data).toEqual(
      expect.objectContaining({
        roleId: 'role-1',
        delete: true,
      }),
    );
    expect(
      db.resourcePermission.create.mock.calls[0][0].data.resourcePermissionId,
    ).toBeUndefined();

    await service.updatePermission('perm-1', { view: false });
    expect(db.resourcePermission.update).toHaveBeenCalledWith({
      where: { resourcePermissionId: 'perm-1' },
      data: { view: false },
    });
    await service.deletePermission('perm-1');
    expect(db.resourcePermission.delete).toHaveBeenCalledWith({
      where: { resourcePermissionId: 'perm-1' },
    });
  });
});
