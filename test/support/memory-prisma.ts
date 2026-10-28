import { Prisma } from 'src/generated/prisma/client';

/**
 * In-memory stand-in for the tenant Prisma client.
 * It implements the calls the services make, rolls back a failed
 * `$transaction`, and throws Prisma errors the HTTP filter already maps.
 * It is not MySQL: no collation, no CHAR padding, no VARCHAR limits.
 */

export type UserRow = {
  userId: string;
  username: string;
  password: string;
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  fullName: string;
  gender: string;
  birthDateString: string;
  email: string | null;
  mobile: string | null;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RoleRow = { roleId: string; roleName: string };
export type UserRoleRow = {
  userRoleId: string;
  userId: string;
  roleId: string;
};
export type PermissionRow = {
  resourcePermissionId: string;
  roleId: string;
  resourceName: string;
  create: boolean;
  view: boolean;
  update: boolean;
  delete: boolean;
};
export type SessionRow = {
  userRefreshTokenId: string;
  userId: string;
  refreshToken: string;
  expiresAt: Date;
  revoked: boolean;
  createdAt: Date;
  updatedAt: Date;
};
export type ArticleRow = {
  articleId: string;
  title: string;
  description: string | null;
  body: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type Row = Record<string, unknown>;

function notFound(model: string): never {
  throw new Prisma.PrismaClientKnownRequestError(`No ${model} found`, {
    code: 'P2025',
    clientVersion: 'test',
    meta: { modelName: model },
  });
}

function conflict(fields: string[]): never {
  throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
    meta: { target: fields },
  });
}

function foreignKey(field: string): never {
  throw new Prisma.PrismaClientKnownRequestError(
    'Foreign key constraint failed',
    {
      code: 'P2003',
      clientVersion: 'test',
      meta: { field_name: field },
    },
  );
}

function project(row: object, select?: Row): Row {
  const source = row as Row;
  if (!select) {
    return { ...source };
  }
  const out: Row = {};
  for (const key of Object.keys(select)) {
    if (select[key] === true) {
      out[key] = source[key];
    }
  }
  return out;
}

function assignDefined(row: Row, data: Row) {
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      row[key] = value;
    }
  }
}

export type MemoryPrisma = {
  reset: () => void;
  users: UserRow[];
  roles: RoleRow[];
  userRoles: UserRoleRow[];
  permissions: PermissionRow[];
  sessions: SessionRow[];
  articles: ArticleRow[];
  $transaction: <T>(fn: (tx: MemoryPrisma) => Promise<T>) => Promise<T>;
  user: any;
  userRole: any;
  userRefreshToken: any;
  role: any;
  resourcePermission: any;
  article: any;
};

export function createMemoryPrisma(): MemoryPrisma {
  const state = {
    seq: 0,
    users: [] as UserRow[],
    roles: [] as RoleRow[],
    userRoles: [] as UserRoleRow[],
    permissions: [] as PermissionRow[],
    sessions: [] as SessionRow[],
    articles: [] as ArticleRow[],
  };

  function nextId(prefix: string) {
    state.seq += 1;
    return `${prefix}-${state.seq}`;
  }

  function clone() {
    return {
      users: state.users.map((row) => ({ ...row })),
      roles: state.roles.map((row) => ({ ...row })),
      userRoles: state.userRoles.map((row) => ({ ...row })),
      permissions: state.permissions.map((row) => ({ ...row })),
      sessions: state.sessions.map((row) => ({ ...row })),
      articles: state.articles.map((row) => ({ ...row })),
    };
  }

  function permissionsForRole(roleId: string) {
    return state.permissions
      .filter((perm) => perm.roleId === roleId)
      .map((perm) => ({
        resourceName: perm.resourceName,
        create: perm.create,
        view: perm.view,
        update: perm.update,
        delete: perm.delete,
      }));
  }

  function assertUserUnique(data: Row, ignoreId?: string) {
    const others = state.users.filter((user) => user.userId !== ignoreId);
    if (
      data.username &&
      others.some((user) => user.username === data.username)
    ) {
      conflict(['username']);
    }
    if (data.email && others.some((user) => user.email === data.email)) {
      conflict(['email']);
    }
    if (data.mobile && others.some((user) => user.mobile === data.mobile)) {
      conflict(['mobile']);
    }
  }

  function articleMatches(row: ArticleRow, where?: { OR?: Row[] }) {
    if (!where?.OR) {
      return true;
    }
    return where.OR.some((clause) => {
      const body = clause.body as { contains?: string } | undefined;
      const title = clause.title as { contains?: string } | undefined;
      if (body?.contains != null) {
        return row.body.includes(body.contains);
      }
      if (title?.contains != null) {
        return row.title.includes(title.contains);
      }
      return false;
    });
  }

  const api: MemoryPrisma = {
    reset() {
      state.users = [];
      state.roles = [];
      state.userRoles = [];
      state.permissions = [];
      state.sessions = [];
      state.articles = [];
    },
    get users() {
      return state.users;
    },
    get roles() {
      return state.roles;
    },
    get userRoles() {
      return state.userRoles;
    },
    get permissions() {
      return state.permissions;
    },
    get sessions() {
      return state.sessions;
    },
    get articles() {
      return state.articles;
    },
    user: {
      async findFirst(args: { where: { username: string }; select?: Row }) {
        const user = state.users.find(
          (row) => row.username === args.where.username,
        );
        return user ? project(user, args.select) : null;
      },
      async findUniqueOrThrow(args: {
        where: { userId: string };
        select?: Row;
      }) {
        const user = state.users.find(
          (row) => row.userId === args.where.userId,
        );
        if (!user) {
          notFound('User');
        }
        if (args.select?.userRoles) {
          return {
            userRoles: state.userRoles
              .filter((link) => link.userId === user.userId)
              .map((link) => ({
                role: { resourcePermissions: permissionsForRole(link.roleId) },
              })),
          };
        }
        return project(user, args.select);
      },
      async findMany(args?: { select?: Row }) {
        return state.users.map((row) => project(row, args?.select));
      },
      async create(args: { data: Row; select?: Row }) {
        assertUserUnique(args.data);
        const now = new Date();
        const row = {
          middleName: null,
          lastName: null,
          email: null,
          mobile: null,
          address: null,
          birthDateString: '-',
          createdAt: now,
          updatedAt: now,
        } as UserRow;
        assignDefined(row as unknown as Row, args.data);
        state.users.push(row);
        return project(row, args.select);
      },
      async update(args: {
        where: { userId: string };
        data: Row;
        select?: Row;
      }) {
        const row = state.users.find(
          (user) => user.userId === args.where.userId,
        );
        if (!row) {
          notFound('User');
        }
        assertUserUnique(args.data, row.userId);
        assignDefined(row as unknown as Row, args.data);
        row.updatedAt = new Date();
        return project(row, args.select);
      },
      async delete(args: { where: { userId: string }; select?: Row }) {
        const index = state.users.findIndex(
          (user) => user.userId === args.where.userId,
        );
        if (index < 0) {
          notFound('User');
        }
        if (
          state.userRoles.some((link) => link.userId === args.where.userId) ||
          state.sessions.some((session) => session.userId === args.where.userId)
        ) {
          foreignKey('userId');
        }
        const [row] = state.users.splice(index, 1);
        return project(row, args.select);
      },
    },
    userRole: {
      async findMany(args?: { where?: { userId?: string } }) {
        return state.userRoles
          .filter(
            (link) => !args?.where?.userId || link.userId === args.where.userId,
          )
          .map((link) => ({
            role: {
              roleName: state.roles.find((role) => role.roleId === link.roleId)
                ?.roleName,
            },
          }));
      },
      async createMany(args: { data: UserRoleRow[] }) {
        for (const link of args.data) {
          if (!state.users.some((user) => user.userId === link.userId)) {
            foreignKey('userId');
          }
          if (!state.roles.some((role) => role.roleId === link.roleId)) {
            foreignKey('roleId');
          }
          state.userRoles.push({ ...link });
        }
        return { count: args.data.length };
      },
      async deleteMany(args: { where: { userId: string } }) {
        const before = state.userRoles.length;
        state.userRoles = state.userRoles.filter(
          (link) => link.userId !== args.where.userId,
        );
        return { count: before - state.userRoles.length };
      },
    },
    userRefreshToken: {
      async create(args: {
        data: {
          userRefreshTokenId: string;
          refreshToken: string;
          expiresAt: Date;
          user: { connect: { userId: string } };
        };
      }) {
        const userId = args.data.user.connect.userId;
        if (!state.users.some((user) => user.userId === userId)) {
          foreignKey('userId');
        }
        if (
          state.sessions.some(
            (session) => session.refreshToken === args.data.refreshToken,
          )
        ) {
          conflict(['refreshToken']);
        }
        const now = new Date();
        state.sessions.push({
          userRefreshTokenId: args.data.userRefreshTokenId,
          userId,
          refreshToken: args.data.refreshToken,
          expiresAt: args.data.expiresAt,
          revoked: false,
          createdAt: now,
          updatedAt: now,
        });
        return { userRefreshTokenId: args.data.userRefreshTokenId };
      },
      async findUnique(args: {
        where: { userRefreshTokenId: string };
        include?: { user?: boolean };
        select?: Row;
      }) {
        const session = state.sessions.find(
          (row) => row.userRefreshTokenId === args.where.userRefreshTokenId,
        );
        if (!session) {
          return null;
        }
        if (args.include?.user) {
          const user = state.users.find((row) => row.userId === session.userId);
          return { ...session, user };
        }
        const selected = project(session, args.select);
        if (args.select?.user) {
          selected.user = {
            userRoles: state.userRoles
              .filter((link) => link.userId === session.userId)
              .map((link) => ({
                role: {
                  roleName: state.roles.find(
                    (role) => role.roleId === link.roleId,
                  )?.roleName,
                },
              })),
          };
        }
        return selected;
      },
      async updateMany(args: { where: Row; data: { revoked?: boolean } }) {
        let count = 0;
        for (const session of state.sessions) {
          if (
            args.where.userRefreshTokenId !== undefined &&
            session.userRefreshTokenId !== args.where.userRefreshTokenId
          ) {
            continue;
          }
          if (
            args.where.userId !== undefined &&
            session.userId !== args.where.userId
          ) {
            continue;
          }
          if (
            args.where.revoked !== undefined &&
            session.revoked !== args.where.revoked
          ) {
            continue;
          }
          if (args.data.revoked !== undefined) {
            session.revoked = args.data.revoked;
            session.updatedAt = new Date();
          }
          count += 1;
        }
        return { count };
      },
    },
    role: {
      async findMany() {
        return state.roles.map((row) => ({ ...row }));
      },
      async findUniqueOrThrow(args: { where: { roleId: string } }) {
        const role = state.roles.find(
          (row) => row.roleId === args.where.roleId,
        );
        if (!role) {
          notFound('Role');
        }
        return { ...role };
      },
      async create(args: { data: { roleName: string; roleId?: string } }) {
        if (state.roles.some((role) => role.roleName === args.data.roleName)) {
          conflict(['roleName']);
        }
        const row = {
          roleId: args.data.roleId ?? nextId('role'),
          roleName: args.data.roleName,
        };
        state.roles.push(row);
        return { ...row };
      },
      async update(args: {
        where: { roleId: string };
        data: { roleName?: string };
      }) {
        const role = state.roles.find(
          (row) => row.roleId === args.where.roleId,
        );
        if (!role) {
          notFound('Role');
        }
        if (
          args.data.roleName &&
          args.data.roleName !== role.roleName &&
          state.roles.some((row) => row.roleName === args.data.roleName)
        ) {
          conflict(['roleName']);
        }
        if (args.data.roleName !== undefined) {
          role.roleName = args.data.roleName;
        }
        return { ...role };
      },
      async delete(args: { where: { roleId: string } }) {
        if (
          state.userRoles.some((link) => link.roleId === args.where.roleId) ||
          state.permissions.some((perm) => perm.roleId === args.where.roleId)
        ) {
          foreignKey('roleId');
        }
        const index = state.roles.findIndex(
          (role) => role.roleId === args.where.roleId,
        );
        if (index < 0) {
          notFound('Role');
        }
        const [row] = state.roles.splice(index, 1);
        return { ...row };
      },
    },
    resourcePermission: {
      async findMany(args?: { where?: Row; select?: Row }) {
        let rows = state.permissions.slice();
        const where = args?.where;
        if (where?.roleId) {
          rows = rows.filter((row) => row.roleId === where.roleId);
        }
        const roleFilter = where?.role as
          | { roleName?: { in?: string[] } }
          | undefined;
        if (roleFilter?.roleName?.in) {
          const names = roleFilter.roleName.in;
          const roleIds = new Set(
            state.roles
              .filter((role) => names.includes(role.roleName))
              .map((role) => role.roleId),
          );
          rows = rows.filter((row) => roleIds.has(row.roleId));
        }
        if (Array.isArray(where?.OR)) {
          const clauses = where.OR as Row[];
          rows = rows.filter((row) =>
            clauses.some((clause) =>
              Object.entries(clause).every(
                ([key, value]) => (row as unknown as Row)[key] === value,
              ),
            ),
          );
        }
        return rows.map((row) => project(row, args?.select));
      },
      async create(args: { data: Row }) {
        const roleId = args.data.roleId as string;
        if (!state.roles.some((role) => role.roleId === roleId)) {
          foreignKey('roleId');
        }
        const row: PermissionRow = {
          resourcePermissionId: args.data.resourcePermissionId as string,
          roleId,
          resourceName: args.data.resourceName as string,
          create: (args.data.create as boolean) ?? false,
          view: (args.data.view as boolean) ?? false,
          update: (args.data.update as boolean) ?? false,
          delete: (args.data.delete as boolean) ?? false,
        };
        state.permissions.push(row);
        return { ...row };
      },
      async createMany(args: { data: Row[] }) {
        for (const data of args.data) {
          await api.resourcePermission.create({ data });
        }
        return { count: args.data.length };
      },
      async update(args: {
        where: { resourcePermissionId: string };
        data: Row;
      }) {
        const row = state.permissions.find(
          (perm) =>
            perm.resourcePermissionId === args.where.resourcePermissionId,
        );
        if (!row) {
          notFound('ResourcePermission');
        }
        if (
          args.data.roleId &&
          !state.roles.some((role) => role.roleId === args.data.roleId)
        ) {
          foreignKey('roleId');
        }
        assignDefined(row as unknown as Row, args.data);
        return { ...row };
      },
      async delete(args: { where: { resourcePermissionId: string } }) {
        const index = state.permissions.findIndex(
          (perm) =>
            perm.resourcePermissionId === args.where.resourcePermissionId,
        );
        if (index < 0) {
          notFound('ResourcePermission');
        }
        const [row] = state.permissions.splice(index, 1);
        return { ...row };
      },
      async deleteMany(args: { where: { roleId: string } }) {
        const before = state.permissions.length;
        state.permissions = state.permissions.filter(
          (perm) => perm.roleId !== args.where.roleId,
        );
        return { count: before - state.permissions.length };
      },
    },
    article: {
      async count(args?: { where?: { OR?: Row[] } }) {
        return state.articles.filter((row) => articleMatches(row, args?.where))
          .length;
      },
      async findMany(args: {
        select?: Row;
        where?: { OR?: Row[] };
        take?: number;
        skip?: number;
      }) {
        const matched = state.articles.filter((row) =>
          articleMatches(row, args.where),
        );
        const skip = args.skip ?? 0;
        const take = args.take ?? matched.length;
        return matched
          .slice(skip, skip + take)
          .map((row) => project(row, args.select));
      },
      async findUniqueOrThrow(args: {
        where: { articleId: string };
        select?: Row;
      }) {
        const row = state.articles.find(
          (article) => article.articleId === args.where.articleId,
        );
        if (!row) {
          notFound('Article');
        }
        return project(row, args.select);
      },
      async create(args: { data: Row; select?: Row }) {
        if (
          state.articles.some((article) => article.title === args.data.title)
        ) {
          conflict(['title']);
        }
        const now = new Date();
        const row = {
          description: null,
          createdAt: now,
          updatedAt: now,
        } as ArticleRow;
        assignDefined(row as unknown as Row, args.data);
        state.articles.push(row);
        return project(row, args.select);
      },
      async update(args: { where: { articleId: string }; data: Row }) {
        const row = state.articles.find(
          (article) => article.articleId === args.where.articleId,
        );
        if (!row) {
          notFound('Article');
        }
        if (
          args.data.title &&
          args.data.title !== row.title &&
          state.articles.some((article) => article.title === args.data.title)
        ) {
          conflict(['title']);
        }
        assignDefined(row as unknown as Row, args.data);
        row.updatedAt = new Date();
        return project(row);
      },
      async delete(args: { where: { articleId: string } }) {
        const index = state.articles.findIndex(
          (article) => article.articleId === args.where.articleId,
        );
        if (index < 0) {
          notFound('Article');
        }
        const [row] = state.articles.splice(index, 1);
        return { ...row };
      },
    },
    async $transaction<T>(fn: (tx: typeof api) => Promise<T>): Promise<T> {
      const snapshot = clone();
      try {
        return await fn(api);
      } catch (error) {
        state.users = snapshot.users;
        state.roles = snapshot.roles;
        state.userRoles = snapshot.userRoles;
        state.permissions = snapshot.permissions;
        state.sessions = snapshot.sessions;
        state.articles = snapshot.articles;
        throw error;
      }
    },
  };

  return api;
}
