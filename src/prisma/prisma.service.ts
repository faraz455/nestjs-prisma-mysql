import { PrismaClient } from '@prisma/client';

export type PrismaServiceOptions = {
  url: string;
  logQueries: boolean;
};

export class PrismaService extends PrismaClient {
  constructor(private options: PrismaServiceOptions) {
    super({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
      ],
      datasources: {
        db: {
          url: options.url,
        },
      },
    });
  }

  async initService(): Promise<void> {
    await this.$connect();
    if (this.options.logQueries) {
      this.registerQueryLogger();
    }
  }

  registerQueryLogger() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.$on('query', async (e) => {
      console.log(
        '************************************************************',
      );
      console.log(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        `Query string: ${e.query}\nQuery parameters: ${e.params}\nQuery duration: ${e.duration}ms`,
      );
      console.log(
        '************************************************************\n',
      );
    });
  }

  // async enableShutdownHooks(app: INestApplication) {
  //   this.$on('beforeExit', async () => {
  //     await app.close();
  //   });
  // }
}
