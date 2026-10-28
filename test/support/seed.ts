import * as bcrypt from 'bcrypt';
import { MemoryPrisma, PermissionRow, UserRow } from './memory-prisma';

export const PASSWORD = 'password';

export const ids = {
  superUser: 'user-super',
  adminUser: 'user-admin',
  editorUser: 'user-editor',
  plainUser: 'user-plain',
  superRole: 'role-super',
  adminRole: 'role-admin',
  editorRole: 'role-editor',
  superPerm: 'perm-super-article',
  adminPerm: 'perm-admin-article',
  editorPerm: 'perm-editor-article',
};

export const usernames = {
  super: 'super',
  admin: 'admin',
  editor: 'editor',
  plain: 'plain',
};

function user(userId: string, username: string, password: string): UserRow {
  const now = new Date();
  return {
    userId,
    username,
    password,
    firstName: username,
    middleName: null,
    lastName: null,
    fullName: username,
    gender: 'MALE',
    birthDateString: '-',
    email: null,
    mobile: null,
    address: null,
    createdAt: now,
    updatedAt: now,
  };
}

function permission(
  resourcePermissionId: string,
  roleId: string,
  flags: Pick<PermissionRow, 'create' | 'view' | 'update' | 'delete'>,
): PermissionRow {
  return {
    resourcePermissionId,
    roleId,
    resourceName: 'Article',
    ...flags,
  };
}

export function seedTenant(prisma: MemoryPrisma) {
  prisma.reset();
  const password = bcrypt.hashSync(PASSWORD, 4);
  prisma.roles.push(
    { roleId: ids.superRole, roleName: 'SUPER ADMIN' },
    { roleId: ids.adminRole, roleName: 'ADMIN' },
    { roleId: ids.editorRole, roleName: 'EDITOR' },
  );
  prisma.permissions.push(
    permission(ids.superPerm, ids.superRole, {
      create: true,
      view: true,
      update: true,
      delete: true,
    }),
    permission(ids.adminPerm, ids.adminRole, {
      create: false,
      view: true,
      update: false,
      delete: false,
    }),
    permission(ids.editorPerm, ids.editorRole, {
      create: true,
      view: true,
      update: true,
      delete: true,
    }),
  );
  prisma.users.push(
    user(ids.superUser, usernames.super, password),
    user(ids.adminUser, usernames.admin, password),
    user(ids.editorUser, usernames.editor, password),
    user(ids.plainUser, usernames.plain, password),
  );
  prisma.userRoles.push(
    {
      userRoleId: 'ur-super',
      userId: ids.superUser,
      roleId: ids.superRole,
    },
    {
      userRoleId: 'ur-admin',
      userId: ids.adminUser,
      roleId: ids.adminRole,
    },
    {
      userRoleId: 'ur-editor',
      userId: ids.editorUser,
      roleId: ids.editorRole,
    },
  );
}

export function articleBody(
  title: string,
  extra: Record<string, unknown> = {},
) {
  return { title, body: `${title} body`, published: true, ...extra };
}

export function signupBody(username = 'new-user') {
  return {
    username,
    password: PASSWORD,
    firstName: 'Ada',
    gender: 'MALE',
    birthDateString: '1815-12-10',
    email: `${username}@example.com`,
  };
}

export function userBody(username = 'created-user') {
  return {
    username,
    password: PASSWORD,
    firstName: 'Ada',
    fullName: 'Ada Lovelace',
    gender: 'MALE',
    birthDateString: '1815-12-10',
    email: `${username}@example.com`,
  };
}
