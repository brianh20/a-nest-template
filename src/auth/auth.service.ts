import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private databaseService: DatabaseService,
  ) {}

  async register(registerDto: RegisterDto) {
    const pool = this.databaseService.getPool();

    if (!pool) {
      const dbUrl = this.configService.get<string>('DATABASE_URL') || '';
      await this.databaseService.initializePool(dbUrl);
    }

    const existingUser = await this.databaseService.getPool().query(
      'SELECT id FROM users WHERE email = $1',
      [registerDto.email],
    );

    if (existingUser.rows.length > 0) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const result = await this.databaseService.getPool().query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, first_name, last_name, role, created_at`,
      [
        registerDto.email,
        hashedPassword,
        registerDto.firstName,
        registerDto.lastName,
        registerDto.role,
      ],
    );

    const user = result.rows[0];

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      createdAt: user.created_at,
    };
  }

  async login(loginDto: LoginDto) {
    const pool = this.databaseService.getPool();

    if (!pool) {
      const dbUrl = this.configService.get<string>('DATABASE_URL') || '';
      await this.databaseService.initializePool(dbUrl);
    }

    const result = await this.databaseService.getPool().query(
      'SELECT id, email, password_hash, first_name, last_name, role FROM users WHERE email = $1 AND is_active = true',
      [loginDto.email],
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    console.log('Generated JWT token for user:', user.email, 'with payload:', payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
    };
  }

  async getProfile(userId: string) {
    const pool = this.databaseService.getPool();

    if (!pool) {
      const dbUrl = this.configService.get<string>('DATABASE_URL') || '';
      await this.databaseService.initializePool(dbUrl);
    }

    const result = await this.databaseService.getPool().query(
      'SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = $1 AND is_active = true',
      [userId],
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedException('User not found');
    }

    const user = result.rows[0];
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      createdAt: user.created_at,
    };
  }
}
