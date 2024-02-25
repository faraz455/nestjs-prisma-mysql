import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { PRISMA_SERVICE } from '../../multi-tenant/multi-tenant.module';
import { PrismaService } from '../../prisma/prisma.service';
import {
  modelPrimaryKeys,
  snakeCaseToCamelCase,
  unix_timestamp,
} from '../common.helper';

@Injectable()
export class CrudService {
  constructor(@Inject(PRISMA_SERVICE) private prisma: PrismaService) {}

  async update(model: string, select: any, where: any, data: any) {
    try {
      // @ts-ignore
      const rec = await this.prisma[model].update({
        select,
        where,
        data: {
          ...data,
          date_updated: unix_timestamp(),
        },
      });
      return rec;
    } catch (exception) {
      if (exception.code == 'P2002') {
        if (exception.meta.target == 'PRIMARY') {
          throw new ConflictException(
            `${snakeCaseToCamelCase(modelPrimaryKeys[model])} is already used`,
          );
        }
      }
      throw exception;
    }
  }

  async upsert(
    model: string,
    select: any,
    where: any,
    updateData: any,
    createData: any,
  ) {
    try {
      // @ts-ignore
      const rec = await this.prisma[model].upsert({
        select,
        where,
        update: {
          ...updateData,
          date_updated: unix_timestamp(),
        },
        create: createData,
      });
      return rec;
    } catch (exception) {
      if (exception.code == 'P2002') {
        if (exception.meta.target == 'PRIMARY') {
          throw new ConflictException(
            `${modelPrimaryKeys[model]} is already used`,
          );
        }
      }
      throw exception;
    }
  }

  /**
   * Set the relevant row's in_active column to 'false' by checking id against
   * the primary key column.
   *
   * @param model - the model/table in which the interesting row lies
   * @param id - the value of the primary key of the row
   * @param primaryColumn - the relevant primary key column
   * @returns
   */
  async inActive(model: string, id: string) {
    let select: any = {},
      where: any = {},
      data: any = { is_active: false };

    select[modelPrimaryKeys[model]] = true;
    where[modelPrimaryKeys[model]] = id;

    return await this.update(model, select, where, data);
  }
}
