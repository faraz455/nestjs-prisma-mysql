import { MYSQL_STRING_MAX } from 'src/common/common.types';
import {
  TestApp,
  closeTestApp,
  createTestApp,
} from '../support/create-test-app';
import { call, errorText, HttpMethod, loginAs } from '../support/http';
import { articleBody, ids, seedTenant, usernames } from '../support/seed';

const routes: Array<[HttpMethod, string]> = [
  ['get', '/articles'],
  ['post', '/articles'],
  ['get', '/articles/missing'],
  ['patch', '/articles/missing'],
  ['delete', '/articles/missing'],
];

describe('Articles HTTP', () => {
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

  it.each(routes)('%s %s rejects a missing token', async (method, url) => {
    await call(ctx.app, method, url).expect(401);
  });

  it('rejects a user with no role and a non-admin role that has every article flag', async () => {
    const plain = await loginAs(ctx.app, usernames.plain);
    const editor = await loginAs(ctx.app, usernames.editor);
    await call(ctx.app, 'get', '/articles', plain.authToken).expect(403);
    await call(ctx.app, 'post', '/articles', editor.authToken)
      .send(articleBody('Editor'))
      .expect(403);
    await call(ctx.app, 'get', '/articles', editor.authToken).expect(403);
  });

  it('lets a view-only admin read and refuses writes', async () => {
    const admin = await loginAs(ctx.app, usernames.admin);
    const created = await call(
      ctx.app,
      'post',
      '/articles',
      (await loginAs(ctx.app, usernames.super)).authToken,
    )
      .send(articleBody('Readable'))
      .expect(201);

    const list = await call(
      ctx.app,
      'get',
      '/articles',
      admin.authToken,
    ).expect(200);
    expect(list.body.count).toBe(1);
    await call(
      ctx.app,
      'get',
      `/articles/${created.body.id}`,
      admin.authToken,
    ).expect(200);
    await call(ctx.app, 'post', '/articles', admin.authToken)
      .send(articleBody('Nope'))
      .expect(403);
    await call(
      ctx.app,
      'patch',
      `/articles/${created.body.id}`,
      admin.authToken,
    )
      .send({ title: 'Nope' })
      .expect(403);
    await call(
      ctx.app,
      'delete',
      `/articles/${created.body.id}`,
      admin.authToken,
    ).expect(403);
  });

  it('creates, updates, and deletes an article for a super admin', async () => {
    const superUser = await loginAs(ctx.app, usernames.super);
    const created = await call(
      ctx.app,
      'post',
      '/articles',
      superUser.authToken,
    )
      .send({ ...articleBody('Hello'), published: false, description: '' })
      .expect(201);
    expect(created.body.id).toEqual(expect.any(String));

    const one = await call(
      ctx.app,
      'get',
      `/articles/${created.body.id}`,
      superUser.authToken,
    ).expect(200);
    expect(one.body).toMatchObject({
      articleId: created.body.id,
      title: 'Hello',
      body: 'Hello body',
      published: false,
      description: null,
    });
    expect(one.body).not.toHaveProperty('password');

    await call(
      ctx.app,
      'patch',
      `/articles/${created.body.id}`,
      superUser.authToken,
    )
      .send({})
      .expect(200);
    const unchanged = await call(
      ctx.app,
      'get',
      `/articles/${created.body.id}`,
      superUser.authToken,
    );
    expect(unchanged.body.title).toBe('Hello');

    await call(
      ctx.app,
      'patch',
      `/articles/${created.body.id}`,
      superUser.authToken,
    )
      .send({ published: true })
      .expect(200);
    const updated = await call(
      ctx.app,
      'get',
      `/articles/${created.body.id}`,
      superUser.authToken,
    );
    expect(updated.body.published).toBe(true);

    await call(
      ctx.app,
      'delete',
      `/articles/${created.body.id}`,
      superUser.authToken,
    )
      .expect(200)
      .expect({ id: created.body.id });
    await call(
      ctx.app,
      'get',
      `/articles/${created.body.id}`,
      superUser.authToken,
    ).expect(404);
  });

  it('rejects invalid article bodies and an unknown query', async () => {
    const superUser = await loginAs(ctx.app, usernames.super);
    const missing = await call(
      ctx.app,
      'post',
      '/articles',
      superUser.authToken,
    )
      .send({ body: 'Body', published: true })
      .expect(400);
    expect(errorText(missing.body)).toContain('title');

    await call(ctx.app, 'post', '/articles', superUser.authToken)
      .send({ ...articleBody('Extra'), extra: true })
      .expect(400);
    await call(ctx.app, 'post', '/articles', superUser.authToken)
      .send({
        ...articleBody('Long'),
        title: 'x'.repeat(MYSQL_STRING_MAX + 1),
      })
      .expect(400);
    await call(ctx.app, 'get', '/articles?page=0', superUser.authToken).expect(
      400,
    );
    await call(ctx.app, 'get', '/articles?extra=1', superUser.authToken).expect(
      400,
    );
    expect(ctx.prisma.articles).toHaveLength(0);
  });

  it('pages and searches without treating a dot as a regular expression', async () => {
    const superUser = await loginAs(ctx.app, usernames.super);
    await call(ctx.app, 'post', '/articles', superUser.authToken)
      .send(articleBody('Alpha'))
      .expect(201);
    await call(ctx.app, 'post', '/articles', superUser.authToken)
      .send(articleBody('a.b'))
      .expect(201);
    await call(ctx.app, 'post', '/articles', superUser.authToken)
      .send(articleBody('Gamma'))
      .expect(201);

    const page = await call(
      ctx.app,
      'get',
      '/articles?page=2&perPage=2',
      superUser.authToken,
    ).expect(200);
    expect(page.body).toMatchObject({ pages: 2, count: 3 });
    expect(page.body.records).toHaveLength(1);
    expect(page.body.records[0].title).toBe('Gamma');

    const found = await call(
      ctx.app,
      'get',
      '/articles?search=.',
      superUser.authToken,
    ).expect(200);
    expect(
      found.body.records.map((row: { title: string }) => row.title),
    ).toEqual(['a.b']);

    const empty = await call(
      ctx.app,
      'get',
      '/articles?search=',
      superUser.authToken,
    ).expect(200);
    expect(empty.body.count).toBe(3);

    const none = await call(
      ctx.app,
      'get',
      '/articles?search=zzz',
      superUser.authToken,
    ).expect(200);
    expect(none.body).toMatchObject({ count: 0, pages: 0, records: [] });
  });

  it('maps a duplicate title and a missing article through the Prisma filter', async () => {
    const superUser = await loginAs(ctx.app, usernames.super);
    await call(ctx.app, 'post', '/articles', superUser.authToken)
      .send(articleBody('Same'))
      .expect(201);
    const conflict = await call(
      ctx.app,
      'post',
      '/articles',
      superUser.authToken,
    )
      .send(articleBody('Same'))
      .expect(409);
    expect(conflict.body).toEqual({
      statusCode: 409,
      message: 'title is already used',
    });
    const missing = await call(
      ctx.app,
      'get',
      '/articles/missing',
      superUser.authToken,
    ).expect(404);
    expect(missing.body.statusCode).toBe(404);
  });

  it('reads permission flags and role names from the database on the next request', async () => {
    const superUser = await loginAs(ctx.app, usernames.super);
    const admin = await loginAs(ctx.app, usernames.admin);
    const perm = ctx.prisma.permissions.find(
      (row) => row.resourcePermissionId === ids.superPerm,
    );
    expect(perm).toBeDefined();
    perm.create = false;
    await call(ctx.app, 'post', '/articles', superUser.authToken)
      .send(articleBody('Blocked'))
      .expect(403);
    perm.create = true;
    await call(ctx.app, 'post', '/articles', superUser.authToken)
      .send(articleBody('Allowed'))
      .expect(201);

    const link = ctx.prisma.userRoles.find(
      (row) => row.userId === ids.adminUser,
    );
    expect(link).toBeDefined();
    link.roleId = ids.editorRole;
    await call(ctx.app, 'get', '/articles', admin.authToken).expect(403);
    link.roleId = ids.adminRole;
    await call(ctx.app, 'get', '/articles', admin.authToken).expect(200);
  });
});
