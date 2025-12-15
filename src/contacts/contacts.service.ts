import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ContactsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string,
  ) {
    console.log(
      `ContactsService: Finding contacts - page: ${page}, limit: ${limit}, search: ${search}, status: ${status}`,
    );

    const offset = (page - 1) * limit;
    const queryParams: any[] = [];
    let whereConditions: string[] = [];
    let paramCount = 1;

    if (search) {
      whereConditions.push(
        `(first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR phone ILIKE $${paramCount} OR email ILIKE $${paramCount})`,
      );
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    if (status) {
      whereConditions.push(`status = $${paramCount}`);
      queryParams.push(status);
      paramCount++;
    }

    const whereClause =
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM contacts ${whereClause}`;
    const countResult = await this.databaseService.query(
      countQuery,
      queryParams,
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    queryParams.push(limit, offset);
    const dataQuery = `
      SELECT id, first_name, last_name, phone, email, company, status, notes, created_at, updated_at
      FROM contacts
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    const dataResult = await this.databaseService.query(dataQuery, queryParams);

    console.log(
      `ContactsService: Found ${dataResult.rows.length} contacts (total: ${total})`,
    );

    return {
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    console.log(`ContactsService: Finding contact with id ${id}`);
    const result = await this.databaseService.query(
      'SELECT id, first_name, last_name, phone, email, company, status, notes, created_at, updated_at FROM contacts WHERE id = $1',
      [id],
    );

    if (result.rows.length === 0) {
      console.log(`ContactsService: Contact with id ${id} not found`);
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }

    console.log(`ContactsService: Found contact ${result.rows[0].first_name} ${result.rows[0].last_name}`);
    return result.rows[0];
  }

  async create(contactData: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    company?: string;
    notes?: string;
  }) {
    console.log('ContactsService: Creating contact', contactData);

    const result = await this.databaseService.query(
      `INSERT INTO contacts (first_name, last_name, phone, email, company, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'new')
       RETURNING id, first_name, last_name, phone, email, company, status, notes, created_at, updated_at`,
      [
        contactData.firstName,
        contactData.lastName,
        contactData.phone,
        contactData.email || null,
        contactData.company || null,
        contactData.notes || null,
      ],
    );

    console.log(`ContactsService: Created contact ${result.rows[0].id}`);
    return result.rows[0];
  }

  async update(
    id: string,
    updateData: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      email?: string;
      company?: string;
      status?: string;
      notes?: string;
    },
  ) {
    console.log(`ContactsService: Updating contact ${id}`, updateData);

    // Check if contact exists
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

    if (updateData.phone !== undefined) {
      updates.push(`phone = $${paramCount}`);
      values.push(updateData.phone);
      paramCount++;
    }

    if (updateData.email !== undefined) {
      updates.push(`email = $${paramCount}`);
      values.push(updateData.email);
      paramCount++;
    }

    if (updateData.company !== undefined) {
      updates.push(`company = $${paramCount}`);
      values.push(updateData.company);
      paramCount++;
    }

    if (updateData.status !== undefined) {
      updates.push(`status = $${paramCount}`);
      values.push(updateData.status);
      paramCount++;
    }

    if (updateData.notes !== undefined) {
      updates.push(`notes = $${paramCount}`);
      values.push(updateData.notes);
      paramCount++;
    }

    if (updates.length === 0) {
      console.log('ContactsService: No fields to update');
      return this.findOne(id);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE contacts
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, first_name, last_name, phone, email, company, status, notes, created_at, updated_at
    `;

    const result = await this.databaseService.query(query, values);
    console.log(`ContactsService: Updated contact ${id}`);
    return result.rows[0];
  }

  async delete(id: string) {
    console.log(`ContactsService: Deleting contact ${id}`);

    // Check if contact exists
    await this.findOne(id);

    await this.databaseService.query('DELETE FROM contacts WHERE id = $1', [
      id,
    ]);
    console.log(`ContactsService: Deleted contact ${id}`);
    return { message: 'Contact deleted successfully' };
  }
}
