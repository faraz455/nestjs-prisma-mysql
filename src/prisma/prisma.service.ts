import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

const CONNECTION_LIMIT = 20;

export type PrismaServiceOptions = {
  host: string;
  user: string;
  password: string;
  database: string;
  logQueries: boolean;
};

export class PrismaService extends PrismaClient {
  constructor(private options: PrismaServiceOptions) {
    const { host, port } = splitHost(options.host);

    super({
      adapter: new PrismaMariaDb({
        host,
        port,
        user: options.user,
        password: options.password,
        database: options.database,
        connectionLimit: CONNECTION_LIMIT,
      }),
      log: [
        {
          emit: 'event',
          level: 'query',
        },
      ],
    });
  }

  async initService(): Promise<void> {
    await this.$connect();
    if (this.options.logQueries) {
      this.registerQueryLogger();
    }
  }

  registerQueryLogger() {
    const client = this as unknown as PrismaClient<'query'>;
    client.$on('query', (event) => {
      console.log(
        '************************************************************',
      );
      console.log(
        `Query string: ${event.query}\nQuery parameters: ${event.params}\nQuery duration: ${event.duration}ms`,
      );
      console.log(
        '************************************************************\n',
      );
    });
  }
}

function splitHost(hostAndPort: string): { host: string; port: number } {
  const separator = hostAndPort.lastIndexOf(':');
  if (separator === -1) {
    return { host: hostAndPort, port: 3306 };
  }

  const port = Number(hostAndPort.slice(separator + 1));
  return {
    host: hostAndPort.slice(0, separator),
    port: Number.isFinite(port) ? port : 3306,
  };
}
