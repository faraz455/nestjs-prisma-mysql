import { BaseExceptionFilter } from '@nestjs/core';
import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

export type PrismaToHttpCodeMapping = {
  [key: string]: number;
};

export type ExceptionResponseData = {
  statusCode: number;
  message: string;
};

function getLines(errorMessage: string): string[] {
  return errorMessage.split(/\r?\n/);
}

function getModel(errorMessage: string): string {
  const lines = getLines(errorMessage);
  for (const idx in lines) {
    if (lines[idx].includes('→')) {
      return lines[idx].split('this.prisma.')[1].split('.')[0];
    }
  }
  throw 'Model not found';
}

@Catch(
  Prisma.PrismaClientKnownRequestError,
  Prisma.NotFoundError,
  Prisma.PrismaClientValidationError,
)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  prismaToHttp: PrismaToHttpCodeMapping = {
    P2000: HttpStatus.BAD_REQUEST,
    P2002: HttpStatus.CONFLICT,
    P2003: HttpStatus.CONFLICT,
    P2022: HttpStatus.INTERNAL_SERVER_ERROR,
    P2025: HttpStatus.NOT_FOUND,
    P2014: HttpStatus.BAD_REQUEST,
  };

  catch(
    exception:
      | Prisma.PrismaClientKnownRequestError
      | Prisma.NotFoundError
      | Prisma.PrismaClientValidationError,
    host: ArgumentsHost,
  ): any {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    let exceptionResponseData: ExceptionResponseData;

    console.error(exception);

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      exceptionResponseData = this.catchClientKnownRequestError(exception);
    } else if (exception instanceof Prisma.NotFoundError) {
      exceptionResponseData = this.catchNotFoundError(exception);
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      exceptionResponseData = this.catchValidationError(exception);
    }

    response
      .status(exceptionResponseData.statusCode)
      .json(exceptionResponseData);
  }

  catchClientKnownRequestError(
    exception: Prisma.PrismaClientKnownRequestError,
  ): ExceptionResponseData {
    let statusCode: number = this.prismaToHttp[exception.code];
    let message: string;
    let colName: string;

    switch (exception.code) {
      case 'P2000':
        colName = exception.meta.column_name as string;
        message = `update: ${colName} is too long!`;
        break;

      case 'P2002':
        const col = exception.meta.column_name as string;
        colName = col;
        message = `${colName} is already used`;
        break;

      case 'P2003':
        colName = exception.meta.field_name as string;
        console.log(`${colName} foreign key constraint failed`);
        message = `${colName} cannot be changed!`;
        break;

      case 'P2025':
        message = exception.message;
        break;

      case 'P2022':
        colName = exception.meta.column as string;
        message = `Column '${colName}' does not exist in database`;
        break;

      case 'P2014':
        type Prisma2014Meta = {
          relation_name: string;
          model_a_name: string;
          model_b_name: string;
        };
        const meta: Prisma2014Meta = exception.meta as Prisma2014Meta;

        message = `The relation '${meta.relation_name}' is not satisfied. Perhaps a unique constraint violation?`;
        break;

      default:
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Undocumented error with database';
        console.log(exception.code);
        break;
    }

    return { statusCode, message };
  }

  catchNotFoundError(exception: Prisma.NotFoundError): ExceptionResponseData {
    const statusCode = HttpStatus.NOT_FOUND;
    const message = exception.message;

    return { statusCode, message };
  }

  catchValidationError(
    exception: Prisma.PrismaClientValidationError,
  ): ExceptionResponseData {
    const statusCode = HttpStatus.CONFLICT;
    const message =
      'Data validation failed: database was not expecting data of this form';
    return { statusCode, message };
  }
}
