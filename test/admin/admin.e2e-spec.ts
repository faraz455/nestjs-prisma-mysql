import {
  TestApp,
  closeTestApp,
  createTestApp,
} from '../support/create-test-app';
import { call, errorText, HttpMethod, http, loginAs } from '../support/http';
import { ids, PASSWORD, seedTenant, userBody, usernames } from '../support/seed';

const routes: Array<[HttpMethod, string]> = [
  ['get', '/admin/users'],
  ['get', '/admin/users/missing'],
  ['post', '/admin/users'],
  ['patch', '/admin/users/missing'],
  ['delete', '/admin/users/missing'],
  ['post', '/admin/users/missing/sessions/revoke'],
  ['get', '/admin/roles'],
  ['get', '/admin/roles/missing'],
  ['post', '/admin/roles'],
  ['patch', '/admin/roles/missing'],
  ['delete', '/admin/roles/missing'],
  ['get', '/admin/permissions'],
  ['get', '/admin/permissions/missing-role'],
  ['post', '/admin/permissions'],
  ['patch', '/admin/permissions/missing'],
  ['delete', '/admin/permissions/missing'],
];

describe('Admin HTTP', () => {
  let ctx: TestApp;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  beforeEach(() => {
    seedTenant(ctx.prisma);
    ctx.otherPrisma.reset();
  });

  async function adminToken() {
    return (await loginAs(ctx.app, usernames.admin)).authToken;
  }

  it.each(routes)('%s %s rejects a missing token', async (method, url) => {
    await call(ctx.app, method, url).expect(401);
  });

  it.each(routes)('%s %s rejects a non-admin role', async (method, url) => {
    const editor = await loginAs(ctx.app, usernames.editor);
    await call(ctx.app, method, url, editor.authToken).expect(403);
  });

  it('returns users and roles without password hashes', async () => {
    const token = await adminToken();
    const users = await call(ctx.app, 'get', '/admin/users', token).expect(200);
    expect(users.body).toHaveLength(4);
    for (const user of users.body) {
      expect(user).not.toHaveProperty('password');
    }
    const one = await call(
      ctx.app,
      'get',
      `/admin/users/${ids.plainUser}`,
      token,
    ).expect(200);
    expect(one.body).toMatchObject({
      userId: ids.plainUser,
      username: usernames.plain,
    });
    expect(one.body).not.toHaveProperty('password');

    await call(ctx.app, 'get', '/admin/users/missing', token).expect(404);
    const roles = await call(ctx.app, 'get', '/admin/roles', token).expect(200);
    expect(
      roles.body.map((role: { roleName: string }) => role.roleName).sort(),
    ).toEqual(['ADMIN', 'EDITOR', 'SUPER ADMIN']);
    await call(ctx.app, 'get', `/admin/roles/${ids.adminRole}`, token).expect(
      200,
    );
    await call(ctx.app, 'get', '/admin/roles/missing', token).expect(404);
  });

  it('creates a user who can log in, rolls back a bad role, and omits the hash', async () => {
    const token = await adminToken();
    const created = await call(ctx.app, 'post', '/admin/users', token)
      .send({ ...userBody('ada'), roleIds: [ids.superRole] })
      .expect(201);
    expect(created.body).not.toHaveProperty('password');
    expect(created.body.username).toBe('ada');

    const ada = await loginAs(ctx.app, 'ada');
    await call(ctx.app, 'post', '/articles', ada.authToken)
      .send({ title: 'From ada', body: 'Body', published: true })
      .expect(201);

    const invalid = await call(ctx.app, 'post', '/admin/users', token)
      .send({ ...userBody('ghost'), roleIds: ['missing-role'] })
      .expect(409);
    expect(invalid.body.message).toBe('roleId cannot be changed!');
    expect(ctx.prisma.users.some((user) => user.username === 'ghost')).toBe(
      false,
    );

    await call(ctx.app, 'post', '/admin/users', token)
      .send({ ...userBody('bad'), roleIds: 'nope' })
      .expect(400);
    await call(ctx.app, 'post', '/admin/users', token)
      .send({ ...userBody('extra'), extra: true })
      .expect(400);
  });

  it('updates a profile, replaces roles, and changes the password', async () => {
    const token = await adminToken();
    await call(ctx.app, 'patch', `/admin/users/${ids.plainUser}`, token)
      .send({ firstName: 'Grace' })
      .expect(200);
    expect(
      ctx.prisma.users.find((user) => user.userId === ids.plainUser).firstName,
    ).toBe('Grace');
    expect(
      ctx.prisma.userRoles.some((link) => link.userId === ids.plainUser),
    ).toBe(false);

    await call(ctx.app, 'patch', `/admin/users/${ids.plainUser}`, token)
      .send({ roleIds: [ids.superRole], password: 'next-password' })
      .expect(200);
    await http(ctx.app)
      .post('/auth/login')
      .send({ username: usernames.plain, password: PASSWORD })
      .expect(401);
    const promoted = await http(ctx.app)
      .post('/auth/login')
      .send({ username: usernames.plain, password: 'next-password' })
      .expect(200);
    expect(promoted.body.profile.roles).toEqual(['SUPER ADMIN']);

    const conflict = await call(
      ctx.app,
      'patch',
      `/admin/users/${ids.editorUser}`,
      token,
    )
      .send({ email: 'shared@example.com' })
      .expect(200);
    expect(conflict.body).not.toHaveProperty('password');
    const duplicate = await call(
      ctx.app,
      'patch',
      `/admin/users/${ids.plainUser}`,
      token,
    )
      .send({ email: 'shared@example.com' })
      .expect(409);
    expect(duplicate.body.message).toBe('email is already used');
  });

  it('refuses to delete a user who still has a role or a session', async () => {
    const token = await adminToken();
    await loginAs(ctx.app, usernames.plain);
    const blocked = await call(
      ctx.app,
      'delete',
      `/admin/users/${ids.plainUser}`,
      token,
    ).expect(409);
    expect(blocked.body.message).toBe('userId cannot be changed!');

    const created = await call(ctx.app, 'post', '/admin/users', token)
      .send(userBody('temporary'))
      .expect(201);
    const removed = await call(
      ctx.app,
      'delete',
      `/admin/users/${created.body.userId}`,
      token,
    ).expect(200);
    expect(removed.body).not.toHaveProperty('password');
    await call(
      ctx.app,
      'get',
      `/admin/users/${created.body.userId}`,
      token,
    ).expect(404);
  });

  it('revokes every active session for a user', async () => {
    const token = await adminToken();
    const first = await loginAs(ctx.app, usernames.super);
    const second = await loginAs(ctx.app, usernames.super);
    const revoked = await call(
      ctx.app,
      'post',
      `/admin/users/${ids.superUser}/sessions/revoke`,
      token,
    ).expect(200);
    expect(revoked.body).toEqual({ userId: ids.superUser, revoked: 2 });
    await call(ctx.app, 'get', '/auth/me', first.authToken).expect(401);
    await call(ctx.app, 'get', '/auth/me', second.authToken).expect(401);
    await call(
      ctx.app,
      'post',
      '/admin/users/missing/sessions/revoke',
      token,
    ).expect(404);
  });

  it('creates, renames, and deletes a role that is not in use', async () => {
    const token = await adminToken();
    const created = await call(ctx.app, 'post', '/admin/roles', token)
      .send({ roleName: 'AUDITOR' })
      .expect(201);
    expect(created.body).toMatchObject({ roleName: 'AUDITOR' });

    const renamed = await call(
      ctx.app,
      'patch',
      `/admin/roles/${created.body.roleId}`,
      token,
    )
      .send({ roleName: 'AUDITORS' })
      .expect(200);
    expect(renamed.body.roleName).toBe('AUDITORS');

    const conflict = await call(ctx.app, 'post', '/admin/roles', token)
      .send({ roleName: 'ADMIN' })
      .expect(409);
    expect(conflict.body.message).toBe('roleName is already used');

    const permission = await call(ctx.app, 'post', '/admin/permissions', token)
      .send({
        resourceName: 'Article',
        roleId: created.body.roleId,
        view: true,
      })
      .expect(201);
    const blocked = await call(
      ctx.app,
      'delete',
      `/admin/roles/${created.body.roleId}`,
      token,
    ).expect(409);
    expect(blocked.body.message).toBe('roleId cannot be changed!');

    await call(
      ctx.app,
      'delete',
      `/admin/permissions/${permission.body.resourcePermissionId}`,
      token,
    ).expect(200);
    await call(
      ctx.app,
      'delete',
      `/admin/roles/${created.body.roleId}`,
      token,
    ).expect(200);
    await call(
      ctx.app,
      'get',
      `/admin/roles/${created.body.roleId}`,
      token,
    ).expect(404);
  });

  it('keeps permission reads for one role separate from the collection', async () => {
    const token = await adminToken();
    const all = await call(ctx.app, 'get', '/admin/permissions', token).expect(
      200,
    );
    expect(all.body.length).toBeGreaterThan(1);

    const onlyAdmin = await call(
      ctx.app,
      'get',
      `/admin/permissions/${ids.adminRole}`,
      token,
    ).expect(200);
    expect(onlyAdmin.body).toHaveLength(1);
    expect(onlyAdmin.body[0].roleId).toBe(ids.adminRole);

    const empty = await call(
      ctx.app,
      'get',
      '/admin/permissions/missing-role',
      token,
    ).expect(200);
    expect(empty.body).toEqual([]);

    const created = await call(ctx.app, 'post', '/admin/permissions', token)
      .send({ resourceName: 'Article', roleId: ids.adminRole, delete: true })
      .expect(201);
    await call(
      ctx.app,
      'patch',
      `/admin/permissions/${created.body.resourcePermissionId}`,
      token,
    )
      .send({ delete: false, update: true })
      .expect(200);
    const row = ctx.prisma.permissions.find(
      (perm) => perm.resourcePermissionId === created.body.resourcePermissionId,
    );
    expect(row).toMatchObject({ delete: false, update: true, view: false });

    await call(ctx.app, 'post', '/admin/permissions', token)
      .send({ resourceName: 'Article', roleId: 'missing-role', view: true })
      .expect(409);
    const invalid = await call(ctx.app, 'post', '/admin/permissions', token)
      .send({ resourceName: 'Article', create: 'yes' })
      .expect(400);
    expect(errorText(invalid.body).length).toBeGreaterThan(0);
  });
});
