import { checkRoles } from './roles.decorator';

describe('role expressions', () => {
  it('allows either named role and requires every AND role', () => {
    expect(checkRoles({ OR: ['ADMIN', 'SUPER ADMIN'] }, ['EDITOR'])).toBe(
      false,
    );
    expect(checkRoles({ OR: ['ADMIN', 'SUPER ADMIN'] }, ['ADMIN'])).toBe(true);
    expect(checkRoles({ AND: ['ADMIN', 'SUPER ADMIN'] }, ['ADMIN'])).toBe(
      false,
    );
    expect(
      checkRoles({ AND: ['ADMIN', 'SUPER ADMIN'] }, ['ADMIN', 'SUPER ADMIN']),
    ).toBe(true);
  });

  it('treats an empty group as allowed and evaluates a nested group', () => {
    expect(checkRoles({ AND: [], OR: [] }, [])).toBe(true);
    expect(checkRoles({ AND: [{ OR: ['ADMIN', 'EDITOR'] }] }, ['EDITOR'])).toBe(
      true,
    );
    expect(checkRoles({ OR: ['ADMIN'] }, [])).toBe(false);
  });
});
