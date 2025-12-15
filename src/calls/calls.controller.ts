import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { CallsService } from './calls.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('calls')
@UseGuards(JwtAuthGuard)
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Post()
  create(@Body() createData: any, @CurrentUser() user: any) {
    return this.callsService.create(createData, user.id);
  }

  @Get()
  findAll(@Query() filters: any) {
    return this.callsService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.callsService.findOne(id);
  }
}
