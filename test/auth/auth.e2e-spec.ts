import {
  TestApp,
  closeTestApp,
  createTestApp,
} from '../support/create-test-app';
import {
  call,
  cookieHeader,
  errorText,
  http,
  loginAs,
  tokenPayload,
} from '../support/http';
import { AUTH_ATTEMPT_LIMIT } from 'src/auth/auth-rate-limit';
import {
  ids,
  PASSWORD,
  seedTenant,
  signupBody,
  usernames,
} from '../support/seed';
import request from 'supertest';

describe('Auth HTTP', () => {
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

  it('issues a tenant access token and a hashed refresh session', async () => {
    const response = await http(ctx.app)
      .post('/auth/login')
      .send({ username: usernames.super, password: PASSWORD })
      .expect(200);
    const body = response.body;

    expect(body.user).not.toHaveProperty('password');
    expect(body.user.username).toBe(usernames.super);
    expect(body.profile.roles).toEqual(['SUPER ADMIN']);
    expect(body.permissions.Article).toEqual({
      create: true,
      view: true,
      update: true,
      delete: true,
    });
    expect(cookieHeader(response)).toContain('Authentication=');
    expect(cookieHeader(response)).toContain('Refresh=');

    const access = tokenPayload(body.authToken);
    const refresh = tokenPayload(body.refreshToken);
    expect(access).toMatchObject({
      tenant: 'localhost:3000',
      tokenUse: 'access',
      sub: ids.superUser,
    });
    expect(access.user).toBeUndefined();
    expect(refresh).toMatchObject({
      tenant: 'localhost:3000',
      tokenUse: 'refresh',
      sid: access.sid,
    });
    expect(ctx.prisma.sessions).toHaveLength(1);
    expect(ctx.prisma.sessions[0].refreshToken).not.toBe(body.refreshToken);
  });

  it('returns view-only flags for the admin role', async () => {
    const admin = await loginAs(ctx.app, usernames.admin);
    expect(admin.permissions.Article).toEqual({
      create: false,
      view: true,
      update: false,
      delete: false,
    });
  });

  it('rejects a bad password, a malformed body, and an extra field after a valid password', async () => {
    const mismatch = await http(ctx.app)
      .post('/auth/login')
      .send({ username: usernames.super, password: 'nope' })
      .expect(401);
    expect(errorText(mismatch.body)).toMatch(/mismatch/);
    expect(ctx.prisma.sessions).toHaveLength(0);

    const malformed = await http(ctx.app)
      .post('/auth/login')
      .send({})
      .expect(400);
    expect(errorText(malformed.body)).toMatch(/malformed/);

    const extra = await http(ctx.app)
      .post('/auth/login')
      .send({ username: usernames.super, password: PASSWORD, extra: true })
      .expect(400);
    expect(errorText(extra.body)).toMatch(/should not exist/);
    expect(cookieHeader(extra)).not.toContain('Authentication=');
    expect(ctx.prisma.sessions).toHaveLength(0);

    await http(ctx.app)
      .post('/auth/login')
      .send({ username: usernames.super, password: 'nope', extra: true })
      .expect(401);
  });

  it('rotates a refresh token and revokes every session when the old token is presented again', async () => {
    const first = await loginAs(ctx.app, usernames.super);
    const second = await http(ctx.app)
      .post('/auth/refresh-token')
      .send({ refreshToken: first.refreshToken })
      .expect(200);
    expect(second.body.refreshToken).not.toBe(first.refreshToken);
    expect(second.body.user).not.toHaveProperty('password');

    await call(ctx.app, 'get', '/auth/me', first.authToken).expect(401);
    await call(ctx.app, 'get', '/auth/me', second.body.authToken).expect(200);

    await http(ctx.app)
      .post('/auth/refresh-token')
      .send({ refreshToken: first.refreshToken })
      .expect(401);
    await call(ctx.app, 'get', '/auth/me', second.body.authToken).expect(401);
  });

  it('rejects a missing, forged, expired, or access token used to refresh', async () => {
    await http(ctx.app).post('/auth/refresh-token').send({}).expect(400);
    const issued = await loginAs(ctx.app, usernames.plain);
    await http(ctx.app)
      .post('/auth/refresh-token')
      .send({ refreshToken: 'not-a-token' })
      .expect(401);
    await http(ctx.app)
      .post('/auth/refresh-token')
      .send({ refreshToken: issued.authToken })
      .expect(401);

    ctx.prisma.sessions.forEach((session) => {
      session.expiresAt = new Date(Date.now() - 1000);
    });
    await http(ctx.app)
      .post('/auth/refresh-token')
      .send({ refreshToken: issued.refreshToken })
      .expect(401);
    await call(ctx.app, 'get', '/auth/me', issued.authToken).expect(401);
  });

  it('rejects a signup password that is too short or too large for bcrypt', async () => {
    const short = await http(ctx.app)
      .post('/auth/signup')
      .send({ ...signupBody('ada'), password: 'short' })
      .expect(400);
    expect(errorText(short.body)).toMatch(/at least 8/);
    const wide = await http(ctx.app)
      .post('/auth/signup')
      .send({ ...signupBody('ada'), password: '😀'.repeat(20) })
      .expect(400);
    expect(errorText(wide.body)).toMatch(/72 bytes/);
    expect(ctx.prisma.users.some((user) => user.username === 'ada')).toBe(
      false,
    );

    const oversized = await http(ctx.app)
      .post('/auth/login')
      .send({ username: usernames.super, password: 'a'.repeat(73) })
      .expect(400);
    expect(errorText(oversized.body)).toMatch(/72 bytes/);
    expect(ctx.prisma.sessions).toHaveLength(0);
  });

  it('returns 429 after ten attempts to login, signup, or refresh', async () => {
    for (const path of ['/auth/login', '/auth/signup', '/auth/refresh-token']) {
      for (let attempt = 0; attempt < AUTH_ATTEMPT_LIMIT; attempt += 1) {
        await http(ctx.app).post(path).send({}).expect(400);
      }
      const limited = await http(ctx.app).post(path).send({}).expect(429);
      expect(errorText(limited.body)).toMatch(/Too many attempts/);
    }
  });

  it('signs a visitor up without a role and rejects a duplicate username', async () => {
    const created = await http(ctx.app)
      .post('/auth/signup')
      .send(signupBody('ada'))
      .expect(201);
    expect(created.body.id).toEqual(expect.any(String));
    const stored = ctx.prisma.users.find((user) => user.username === 'ada');
    expect(stored.fullName).toBe('Ada');
    expect(stored.password).not.toBe(PASSWORD);

    const session = await loginAs(ctx.app, 'ada');
    expect(session.profile.roles).toEqual([]);
    await call(ctx.app, 'get', '/articles', session.authToken).expect(403);

    const conflict = await http(ctx.app)
      .post('/auth/signup')
      .send(signupBody('ada'))
      .expect(409);
    expect(conflict.body.message).toBe('username is already used');

    await http(ctx.app)
      .post('/auth/signup')
      .send({ ...signupBody('other'), extra: true })
      .expect(400);
    expect(ctx.prisma.users.some((user) => user.username === 'other')).toBe(
      false,
    );
  });

  it('returns the caller from a bearer token or the signed cookie', async () => {
    const issued = await loginAs(ctx.app, usernames.admin);
    const bearer = await call(
      ctx.app,
      'get',
      '/auth/me',
      issued.authToken,
    ).expect(200);
    expect(bearer.body).toMatchObject({
      userId: ids.adminUser,
      userName: usernames.admin,
      profile: { roles: ['ADMIN'] },
    });

    await call(ctx.app, 'get', '/auth/me', issued.refreshToken).expect(401);
    await call(ctx.app, 'get', '/auth/me').expect(401);

    const agent = request.agent(ctx.app.getHttpServer());
    await agent
      .post('/auth/login')
      .send({ username: usernames.admin, password: PASSWORD })
      .expect(200);
    const cookieUser = await agent.get('/auth/me').expect(200);
    expect(cookieUser.body.userId).toBe(ids.adminUser);
  });

  it('loads the role stored on the session, not the copy from login', async () => {
    const issued = await loginAs(ctx.app, usernames.admin);
    const link = ctx.prisma.userRoles.find(
      (row) => row.userId === ids.adminUser,
    );
    link.roleId = ids.editorRole;
    const me = await call(ctx.app, 'get', '/auth/me', issued.authToken).expect(
      200,
    );
    expect(me.body.profile.roles).toEqual(['EDITOR']);
  });

  it('revokes the presented session on logout and every session on logout-all', async () => {
    const agent = request.agent(ctx.app.getHttpServer());
    const loggedIn = await agent
      .post('/auth/login')
      .send({ username: usernames.super, password: PASSWORD })
      .expect(200);
    await agent.post('/auth/logout').expect(200);
    await agent.get('/auth/me').expect(401);
    await call(ctx.app, 'get', '/auth/me', loggedIn.body.authToken).expect(401);

    await http(ctx.app).post('/auth/logout').expect(200);

    const first = await loginAs(ctx.app, usernames.plain);
    const second = await loginAs(ctx.app, usernames.plain);
    const revoked = await call(
      ctx.app,
      'post',
      '/auth/logout-all',
      second.authToken,
    ).expect(200);
    expect(revoked.body).toEqual({ userId: ids.plainUser, revoked: 2 });
    await call(ctx.app, 'get', '/auth/me', first.authToken).expect(401);
    await call(ctx.app, 'get', '/auth/me', second.authToken).expect(401);
    await call(ctx.app, 'post', '/auth/logout-all').expect(401);
  });
});
