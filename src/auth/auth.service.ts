import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private databaseService: DatabaseService,
    private jwtService: JwtService,
  ) {
    console.log('[AuthService] Service initialized');
  }

  async login(loginDto: LoginDto) {
    console.log('[AuthService] Login attempt for email:', loginDto.email);

    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.databaseService.query(query, [loginDto.email]);

    if (result.rows.length === 0) {
      console.log('[AuthService] User not found:', loginDto.email);
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = result.rows[0];
    console.log('[AuthService] User found:', { id: user.id, email: user.email, role: user.role });

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password_hash);

    if (!isPasswordValid) {
      console.log('[AuthService] Invalid password for user:', loginDto.email);
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    console.log('[AuthService] Login successful, token generated for user:', user.id);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    console.log('[AuthService] Registration attempt for email:', registerDto.email);

    // Check if user already exists
    const checkQuery = 'SELECT id FROM users WHERE email = $1';
    const checkResult = await this.databaseService.query(checkQuery, [registerDto.email]);

    if (checkResult.rows.length > 0) {
      console.log('[AuthService] User already exists:', registerDto.email);
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(registerDto.password, saltRounds);
    console.log('[AuthService] Password hashed for new user');

    // Insert new user
    const insertQuery = `
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, first_name, last_name, role, created_at
    `;
    const insertResult = await this.databaseService.query(insertQuery, [
      registerDto.email,
      passwordHash,
      registerDto.firstName,
      registerDto.lastName,
      registerDto.role,
    ]);

    const newUser = insertResult.rows[0];
    console.log('[AuthService] User registered successfully:', { id: newUser.id, email: newUser.email });

    return {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.first_name,
      lastName: newUser.last_name,
      role: newUser.role,
      createdAt: newUser.created_at,
    };
  }

  async getProfile(userId: number) {
    console.log('[AuthService] Fetching profile for user ID:', userId);

    const query = 'SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = $1';
    const result = await this.databaseService.query(query, [userId]);

    if (result.rows.length === 0) {
      console.log('[AuthService] User not found for ID:', userId);
      throw new UnauthorizedException('User not found');
    }

    const user = result.rows[0];
    console.log('[AuthService] Profile fetched:', { id: user.id, email: user.email });

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
