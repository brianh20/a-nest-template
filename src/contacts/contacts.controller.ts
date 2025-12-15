import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  IsString,
  IsOptional,
  IsIn,
  IsEmail,
  IsNotEmpty,
} from 'class-validator';

class CreateContactDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

class UpdateContactDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  @IsIn(['new', 'contacted', 'qualified', 'converted', 'closed'])
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    console.log(
      `ContactsController: GET /contacts?page=${pageNum}&limit=${limitNum}&search=${search}&status=${status}`,
    );
    return this.contactsService.findAll(pageNum, limitNum, search, status);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    console.log(`ContactsController: GET /contacts/${id}`);
    return this.contactsService.findOne(id);
  }

  @Post()
  async create(@Body() createContactDto: CreateContactDto) {
    console.log('ContactsController: POST /contacts', createContactDto);
    return this.contactsService.create(createContactDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateContactDto: UpdateContactDto,
  ) {
    console.log(`ContactsController: PATCH /contacts/${id}`, updateContactDto);
    return this.contactsService.update(id, updateContactDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    console.log(`ContactsController: DELETE /contacts/${id}`);
    return this.contactsService.delete(id);
  }
}
