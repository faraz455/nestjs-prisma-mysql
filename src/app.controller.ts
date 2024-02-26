import { Body, Controller, Get, Render, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Get('health')
  healthCheck() {
    return 'Ok';
  }

  // @Get('test')
  // callReturnEpxiredItems() {
  //   return this.appService.expiredProductsReturnService();
  // }
}
