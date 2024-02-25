import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CommonService } from './common/common.service';

@Injectable()
export class AppService {
  constructor() {}

  getViewName(): string {
    return 'index';
  }
}
