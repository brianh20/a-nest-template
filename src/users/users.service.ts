import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UsersService {
  constructor(
    private databaseService: DatabaseService,
    private configService: ConfigService,
  ) {}

  async findAll(role?: string) {
    const pool = this.databaseService.getPool();

    if (!pool) {
      const dbUrl = this.configService.get<string>('DATABASE_URL') || '';
      await this.databaseService.initializePool(dbUrl);
    }

    let query = 'SELECT id, email, first_name, last_name, role, is_active, created_at FROM users WHERE is_active = true';
    const params: any[] = [];

    if (role) {
      query += ' AND role = $1';
      params.push(role);
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.databaseService.getPool().query(query, params);

    return result.rows.map(row => ({
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role,
      isActive: row.is_active,
      createdAt: row.created_at,
    }));
  }

  async findOne(id: string) {
    const pool = this.databaseService.getPool();

    if (!pool) {
      const dbUrl = this.configService.get<string>('DATABASE_URL') || '';
      await this.databaseService.initializePool(dbUrl);
    }

    const result = await this.databaseService.getPool().query(
      'SELECT id, email, first_name, last_name, role, is_active, created_at, updated_at FROM users WHERE id = $1',
      [id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('User not found');
    }

    const user = result.rows[0];
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }

  async update(id: string, updateData: { firstName?: string; lastName?: string; isActive?: boolean }) {
    const pool = this.databaseService.getPool();

    if (!pool) {
      const dbUrl = this.configService.get<string>('DATABASE_URL') || '';
      await this.databaseService.initializePool(dbUrl);
    }

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (updateData.firstName !== undefined) {
      updates.push(`first_name = $${paramIndex++}`);
      params.push(updateData.firstName);
    }

    if (updateData.lastName !== undefined) {
      updates.push(`last_name = $${paramIndex++}`);
      params.push(updateData.lastName);
    }

    if (updateData.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      params.push(updateData.isActive);
    }

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, email, first_name, last_name, role, is_active, updated_at`;

    const result = await this.databaseService.getPool().query(query, params);

    if (result.rows.length === 0) {
      throw new NotFoundException('User not found');
    }

    const user = result.rows[0];
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      isActive: user.is_active,
      updatedAt: user.updated_at,
    };
  }
}
