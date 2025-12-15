import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CallsService } from './calls.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  IsString,
  IsOptional,
  IsIn,
  IsNumber,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';

class CreateCallDto {
  @IsUUID()
  @IsNotEmpty()
  contact_id: string;

  @IsUUID()
  @IsNotEmpty()
  agent_id: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['completed', 'no_answer', 'busy', 'voicemail', 'callback_requested'])
  outcome: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

class UpdateCallDto {
  @IsOptional()
  @IsString()
  @IsIn(['completed', 'no_answer', 'busy', 'voicemail', 'callback_requested'])
  outcome?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

@Controller('calls')
@UseGuards(JwtAuthGuard)
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Get()
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    console.log(
      `CallsController: GET /calls?page=${pageNum}&limit=${limitNum}`,
    );
    return this.callsService.findAll(pageNum, limitNum);
  }

  @Get('contact/:contactId')
  async findByContact(@Param('contactId') contactId: string) {
    console.log(`CallsController: GET /calls/contact/${contactId}`);
    return this.callsService.findByContact(contactId);
  }

  @Get('agent/:agentId')
  async findByAgent(@Param('agentId') agentId: string) {
    console.log(`CallsController: GET /calls/agent/${agentId}`);
    return this.callsService.findByAgent(agentId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    console.log(`CallsController: GET /calls/${id}`);
    return this.callsService.findOne(id);
  }

  @Post()
  async create(@Body() createCallDto: CreateCallDto) {
    console.log('CallsController: POST /calls', createCallDto);
    return this.callsService.create(createCallDto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateCallDto: UpdateCallDto) {
    console.log(`CallsController: PATCH /calls/${id}`, updateCallDto);
    return this.callsService.update(id, updateCallDto);
  }
}
