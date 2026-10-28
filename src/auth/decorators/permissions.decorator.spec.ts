import {
  checkPermission,
  splitPermissionNeeded,
} from './permissions.decorator';

const article = {
  Article: { create: true, view: true, update: false, delete: true },
};

describe('permission expressions', () => {
  it('splits a resource flag', () => {
    expect(splitPermissionNeeded('Article.view')).toEqual(['Article', 'view']);
  });

  it('requires every AND term and any OR term', () => {
    expect(
      checkPermission({ AND: ['Article.view', 'Article.create'] }, article),
    ).toBe(true);
    expect(
      checkPermission({ AND: ['Article.view', 'Article.update'] }, article),
    ).toBe(false);
    expect(
      checkPermission({ OR: ['Article.update', 'Article.delete'] }, article),
    ).toBe(true);
    expect(checkPermission({ OR: ['Article.update'] }, article)).toBe(false);
  });

  it('treats an empty group as allowed and a missing resource as denied', () => {
    expect(checkPermission({ AND: [], OR: [] }, article)).toBe(true);
    expect(checkPermission({ AND: ['Article.view'] }, {})).toBe(false);
    expect(checkPermission({}, article)).toBe(true);
  });

  it('combines a nested OR inside AND, and requires both top-level groups', () => {
    expect(
      checkPermission(
        { AND: ['Article.view', { OR: ['Article.update', 'Article.delete'] }] },
        article,
      ),
    ).toBe(true);
    expect(
      checkPermission(
        { AND: ['Article.view'], OR: ['Article.update'] },
        article,
      ),
    ).toBe(false);
  });
});
