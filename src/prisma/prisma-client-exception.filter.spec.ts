import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaClientExceptionFilter } from './prisma-client-exception.filter';

function hostFor(response: { status: jest.Mock }) {
  return {
    switchToHttp: () => ({ getResponse: () => response }),
  } as unknown as ArgumentsHost;
}

function known(code: string, message: string, meta?: Record<string, unknown>) {
  return new Prisma.PrismaClientKnownRequestError(message, {
    code,
    clientVersion: 'test',
    meta,
  });
}

describe('PrismaClientExceptionFilter', () => {
  const filter = new PrismaClientExceptionFilter();
  let status: jest.Mock;
  let json: jest.Mock;

  beforeEach(() => {
    json = jest.fn();
    status = jest.fn(() => ({ json }));
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function catchError(error: unknown) {
    status.mockClear();
    json.mockClear();
    filter.catch(error as never, hostFor({ status }));
    return { status: status.mock.calls[0][0], body: json.mock.calls[0][0] };
  }

  it('maps known Prisma codes onto the HTTP contract', () => {
    expect(
      catchError(known('P2000', 'too long', { column_name: 'title' })),
    ).toEqual({
      status: HttpStatus.BAD_REQUEST,
      body: { statusCode: 400, message: 'update: title is too long!' },
    });
    expect(
      catchError(known('P2002', 'unique', { target: 'Article_title_key' })),
    ).toEqual({
      status: HttpStatus.CONFLICT,
      body: { statusCode: 409, message: 'title is already used' },
    });
    expect(
      catchError(known('P2002', 'unique', { target: ['username'] })),
    ).toEqual({
      status: HttpStatus.CONFLICT,
      body: { statusCode: 409, message: 'username is already used' },
    });
    expect(catchError(known('P2002', 'unique', {}))).toEqual({
      status: HttpStatus.CONFLICT,
      body: { statusCode: 409, message: 'value is already used' },
    });
    expect(catchError(known('P2003', 'fk', { field_name: 'userId' }))).toEqual({
      status: HttpStatus.CONFLICT,
      body: { statusCode: 409, message: 'userId cannot be changed!' },
    });
    expect(catchError(known('P2025', 'No Article found'))).toEqual({
      status: HttpStatus.NOT_FOUND,
      body: { statusCode: 404, message: 'No Article found' },
    });
    expect(catchError(known('P2022', 'missing', { column: 'title' }))).toEqual({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        statusCode: 500,
        message: "Column 'title' does not exist in database",
      },
    });
    expect(
      catchError(
        known('P2014', 'relation', {
          relation_name: 'UserRole',
          model_a_name: 'User',
          model_b_name: 'Role',
        }),
      ).body.message,
    ).toContain('UserRole');
    expect(catchError(known('P9999', 'mystery')).body).toEqual({
      statusCode: 500,
      message: 'Undocumented error with database',
    });
  });

  it('hides the raw Prisma validation text', () => {
    const error = new Prisma.PrismaClientValidationError(
      'secret_column was not expected',
      { clientVersion: 'test' },
    );
    const result = catchError(error);
    expect(result.status).toBe(HttpStatus.CONFLICT);
    expect(result.body.message).toBe(
      'Data validation failed: database was not expecting data of this form',
    );
    expect(JSON.stringify(result.body)).not.toContain('secret_column');
  });
});
