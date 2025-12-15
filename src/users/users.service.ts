import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll() {
    console.log('UsersService: Finding all users');
    const result = await this.databaseService.query(
      'SELECT id, email, first_name, last_name, role, created_at FROM users ORDER BY created_at DESC',
    );
    console.log(`UsersService: Found ${result.rows.length} users`);
    return result.rows;
  }

  async findOne(id: string) {
    console.log(`UsersService: Finding user with id ${id}`);
    const result = await this.databaseService.query(
      'SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = $1',
      [id],
    );

    if (result.rows.length === 0) {
      console.log(`UsersService: User with id ${id} not found`);
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    console.log(`UsersService: Found user ${result.rows[0].email}`);
    return result.rows[0];
  }

  async update(id: string, updateData: { firstName?: string; lastName?: string; role?: string }) {
    console.log(`UsersService: Updating user ${id}`, updateData);

    // Check if user exists
    await this.findOne(id);

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updateData.firstName !== undefined) {
      updates.push(`first_name = $${paramCount}`);
      values.push(updateData.firstName);
      paramCount++;
    }

    if (updateData.lastName !== undefined) {
      updates.push(`last_name = $${paramCount}`);
      values.push(updateData.lastName);
      paramCount++;
    }

    if (updateData.role !== undefined) {
      updates.push(`role = $${paramCount}`);
      values.push(updateData.role);
      paramCount++;
    }

    if (updates.length === 0) {
      console.log('UsersService: No fields to update');
      return this.findOne(id);
    }

    values.push(id);
    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, first_name, last_name, role, created_at
    `;

    const result = await this.databaseService.query(query, values);
    console.log(`UsersService: Updated user ${id}`);
    return result.rows[0];
  }

  async delete(id: string) {
    console.log(`UsersService: Deleting user ${id}`);

    // Check if user exists
    await this.findOne(id);

    await this.databaseService.query('DELETE FROM users WHERE id = $1', [id]);
    console.log(`UsersService: Deleted user ${id}`);
    return { message: 'User deleted successfully' };
  }
}
