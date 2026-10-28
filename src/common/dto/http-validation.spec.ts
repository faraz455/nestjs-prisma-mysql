import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { httpValidationOptions } from 'src/bootstrap/apply-http-defaults';
import { PaginationQueryDto } from './pagination-query.dto';
import { CreateArticleDto, UpdateArticleDto } from 'src/articles/dto';
import { LoginDto, SignupDto } from 'src/auth/dto';
import { UpdateUserDto } from 'src/admin/dto';
import {
  CreatePermissionDto,
  CreateRoleDto,
  CreateUserDto,
} from 'src/admin/dto';
import { MYSQL_STRING_MAX } from '../common.types';

const pipe = new ValidationPipe(httpValidationOptions);

function meta(
  metatype: new (...args: unknown[]) => object,
  type: 'body' | 'query',
) {
  return { type, metatype };
}

async function accept<T>(
  value: object,
  metatype: new (...args: unknown[]) => T,
  type: 'body' | 'query' = 'body',
) {
  return pipe.transform(value, meta(metatype as never, type)) as Promise<T>;
}

async function reject(
  value: object,
  metatype: new (...args: unknown[]) => object,
  type: 'body' | 'query' = 'body',
) {
  await expect(
    pipe.transform(value, meta(metatype, type)),
  ).rejects.toBeInstanceOf(BadRequestException);
}

describe('HTTP validation pipe', () => {
  it('applies pagination defaults and coerces query numbers', async () => {
    const query = await accept({}, PaginationQueryDto, 'query');
    expect(query.page).toBe(1);
    expect(query.perPage).toBe(30);

    const paged = await accept(
      { page: '2', perPage: '10' },
      PaginationQueryDto,
      'query',
    );
    expect(paged).toMatchObject({ page: 2, perPage: 10 });
  });

  it('rejects a page below 1, a fractional page, and an unknown query', async () => {
    await reject({ page: 0 }, PaginationQueryDto, 'query');
    await reject({ page: '1.5' }, PaginationQueryDto, 'query');
    await reject({ extra: '1' }, PaginationQueryDto, 'query');
  });

  it('turns an empty optional article description into null', async () => {
    const dto = await accept(
      { title: 'Hello', body: 'Body', published: true, description: '' },
      CreateArticleDto,
    );
    expect(dto.description).toBeNull();
  });

  it('rejects an article body that is not the documented shape', async () => {
    await reject({ body: 'Body', published: true }, CreateArticleDto);
    await reject(
      { title: 'Hello', body: 'Body', published: true, extra: true },
      CreateArticleDto,
    );
    await reject(
      { title: 'Hello', body: 'Body', published: 'true' },
      CreateArticleDto,
    );
    await reject(
      {
        title: 'x'.repeat(MYSQL_STRING_MAX + 1),
        body: 'Body',
        published: true,
      },
      CreateArticleDto,
    );
  });

  it('accepts an empty article patch and still rejects an unknown key', async () => {
    await expect(accept({}, UpdateArticleDto)).resolves.toBeDefined();
    await reject({ unknown: true }, UpdateArticleDto);
  });

  it('rejects a login body without a username or with a password bcrypt would truncate', async () => {
    await reject({ password: 'secret' }, LoginDto);
    await reject({ username: 'ada', password: 'a'.repeat(73) }, LoginDto);
    await expect(
      accept({ username: 'ada', password: 'nope' }, LoginDto),
    ).resolves.toMatchObject({ password: 'nope' });
  });

  it('rejects a signup gender outside the enum and accepts a minimal signup', async () => {
    await reject(
      {
        username: 'ada',
        password: 'password',
        firstName: 'Ada',
        gender: 'UNKNOWN',
        birthDateString: '1815-12-10',
        email: 'ada@example.com',
      },
      SignupDto,
    );
    const dto = await accept(
      {
        username: 'ada',
        password: 'password',
        firstName: 'Ada',
        gender: 'MALE',
        birthDateString: '1815-12-10',
        email: 'ada@example.com',
      },
      SignupDto,
    );
    expect(dto.username).toBe('ada');
    expect(dto.middleName).toBeUndefined();
    await reject(
      {
        username: 'ada',
        password: 'short',
        firstName: 'Ada',
        gender: 'MALE',
        birthDateString: '1815-12-10',
        email: 'ada@example.com',
      },
      SignupDto,
    );
    await reject(
      {
        username: 'ada',
        password: '😀'.repeat(20),
        firstName: 'Ada',
        gender: 'MALE',
        birthDateString: '1815-12-10',
        email: 'ada@example.com',
      },
      SignupDto,
    );
  });

  it('allows a role without permissions and rejects a bad nested permission', async () => {
    await expect(
      accept({ roleName: 'AUDITOR' }, CreateRoleDto),
    ).resolves.toMatchObject({ roleName: 'AUDITOR' });
    await reject(
      {
        roleName: 'AUDITOR',
        permissions: [{ resourceName: 'Nope', roleId: 'r1' }],
      },
      CreateRoleDto,
    );
  });

  it('requires a permission role id and boolean flags', async () => {
    await reject({ resourceName: 'Article' }, CreatePermissionDto);
    await reject(
      { resourceName: 'Article', roleId: 'role-1', create: 'yes' },
      CreatePermissionDto,
    );
    await expect(
      accept(
        { resourceName: 'Article', roleId: 'role-1', view: true },
        CreatePermissionDto,
      ),
    ).resolves.toMatchObject({ roleId: 'role-1', view: true });
  });

  it('rejects role ids that are not an array of strings', async () => {
    const user = {
      username: 'ada',
      password: 'password',
      firstName: 'Ada',
      fullName: 'Ada',
      gender: 'MALE',
      birthDateString: '-',
    };
    await reject({ ...user, roleIds: 'role-1' }, CreateUserDto);
    await reject({ ...user, password: 'short' }, CreateUserDto);
    await expect(accept(user, CreateUserDto)).resolves.toMatchObject({
      username: 'ada',
    });
    await expect(accept({}, UpdateUserDto)).resolves.toBeDefined();
    await reject({ password: 'short' }, UpdateUserDto);
    await expect(
      accept({ password: 'next-password' }, UpdateUserDto),
    ).resolves.toMatchObject({ password: 'next-password' });
  });
});
