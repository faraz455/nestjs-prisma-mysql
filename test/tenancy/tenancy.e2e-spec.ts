import {
  TestApp,
  closeTestApp,
  createTestApp,
} from '../support/create-test-app';
import { http, loginAs } from '../support/http';
import { seedTenant, usernames } from '../support/seed';
import { OTHER_HOST, UNKNOWN_HOST } from '../support/tenants';

describe('tenancy and process edges', () => {
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

  it('answers health without a tenant and leaves swagger unmounted', async () => {
    const health = await http(ctx.app).get('/health').expect(200);
    expect(health.text).toBe('Ok');
    const otherHealth = await http(ctx.app)
      .get('/health')
      .set('Host', UNKNOWN_HOST)
      .expect(200);
    expect(otherHealth.text).toBe('Ok');
    await http(ctx.app).get('/swagger').expect(404);
  });

  it('rejects an unknown host before a controller runs', async () => {
    const before = ctx.prisma.sessions.length;
    const missing = await http(ctx.app)
      .get('/articles')
      .set('Host', UNKNOWN_HOST)
      .expect(404);
    expect(missing.body.message).toBe('Tenant not found');
    await http(ctx.app)
      .post('/auth/login')
      .set('Host', UNKNOWN_HOST)
      .send({ username: usernames.super, password: 'password' })
      .expect(404);
    expect(ctx.prisma.sessions).toHaveLength(before);
  });

  it('rejects a token on a different configured host', async () => {
    const issued = await loginAs(ctx.app, usernames.super);
    await http(ctx.app)
      .get('/articles')
      .set('Host', OTHER_HOST)
      .set('Authorization', `Bearer ${issued.authToken}`)
      .expect(401);
    await http(ctx.app)
      .post('/auth/refresh-token')
      .set('Host', OTHER_HOST)
      .send({ refreshToken: issued.refreshToken })
      .expect(401);
    expect(ctx.otherPrisma.sessions).toHaveLength(0);
    await http(ctx.app)
      .get('/articles')
      .set('Host', 'localhost:3000')
      .set('Authorization', `Bearer ${issued.authToken}`)
      .expect(200);
  });
});
