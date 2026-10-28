# Examples

Service branch:

```typescript
it('searches title and body and pages the result', async () => {
  db.article.count.mockResolvedValue(25);
  db.article.findMany.mockResolvedValue([]);
  const result = await service.findAll({ page: 2, perPage: 10, search: 'Ada' });
  expect(db.article.findMany).toHaveBeenCalledWith(
    expect.objectContaining({ take: 10, skip: 10 }),
  );
  expect(result.pages).toBe(3);
});
```

HTTP case:

```typescript
it('rejects a view-only admin creating an article', async () => {
  const admin = await loginAs(ctx.app, usernames.admin);
  await call(ctx.app, 'post', '/articles', admin.authToken)
    .send(articleBody('Nope'))
    .expect(403);
});
```

A new endpoint is unfinished until both exist: the service spec for the query, and the HTTP spec for status and body.
