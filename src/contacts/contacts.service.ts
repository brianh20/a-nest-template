import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class ContactsService {
  constructor(
    private databaseService: DatabaseService,
    private configService: ConfigService,
  ) {}

  private async ensurePool() {
    const pool = this.databaseService.getPool();
    if (!pool) {
      const dbUrl = this.configService.get<string>('DATABASE_URL') || '';
      await this.databaseService.initializePool(dbUrl);
    }
  }

  async create(createData: any) {
    await this.ensurePool();

    const result = await this.databaseService.getPool().query(
      `INSERT INTO contacts (first_name, last_name, email, phone, company, job_title, address, city, state, postal_code, country, lead_source, lead_status, notes, assigned_agent_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        createData.firstName,
        createData.lastName,
        createData.email,
        createData.phone,
        createData.company,
        createData.jobTitle,
        createData.address,
        createData.city,
        createData.state,
        createData.postalCode,
        createData.country || 'USA',
        createData.leadSource,
        createData.leadStatus || 'new',
        createData.notes,
        createData.assignedAgentId,
      ],
    );

    return this.formatContact(result.rows[0]);
  }

  async findAll(pagination: PaginationDto, filters?: any) {
    await this.ensurePool();

    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM contacts WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.search) {
      query += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR company ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters?.status) {
      query += ` AND lead_status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.assignedAgentId) {
      query += ` AND assigned_agent_id = $${paramIndex}`;
      params.push(filters.assignedAgentId);
      paramIndex++;
    }

    const countResult = await this.databaseService.getPool().query(
      query.replace('SELECT *', 'SELECT COUNT(*)'),
      params,
    );
    const total = parseInt(countResult.rows[0].count);

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await this.databaseService.getPool().query(query, params);

    return {
      data: result.rows.map(row => this.formatContact(row)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string) {
    await this.ensurePool();

    const result = await this.databaseService.getPool().query(
      'SELECT * FROM contacts WHERE id = $1',
      [id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Contact not found');
    }

    const callsResult = await this.databaseService.getPool().query(
      `SELECT c.*, ci.summary, ci.sentiment, ci.performance_score
       FROM calls c
       LEFT JOIN call_insights ci ON c.id = ci.call_id
       WHERE c.contact_id = $1
       ORDER BY c.started_at DESC`,
      [id],
    );

    return {
      ...this.formatContact(result.rows[0]),
      calls: callsResult.rows.map(call => ({
        id: call.id,
        direction: call.direction,
        status: call.status,
        outcome: call.outcome,
        startedAt: call.started_at,
        endedAt: call.ended_at,
        durationSeconds: call.duration_seconds,
        notes: call.notes,
        summary: call.summary,
        sentiment: call.sentiment,
        performanceScore: call.performance_score,
      })),
    };
  }

  async update(id: string, updateData: any) {
    await this.ensurePool();

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const fields = [
      ['firstName', 'first_name'],
      ['lastName', 'last_name'],
      ['email', 'email'],
      ['phone', 'phone'],
      ['company', 'company'],
      ['jobTitle', 'job_title'],
      ['address', 'address'],
      ['city', 'city'],
      ['state', 'state'],
      ['postalCode', 'postal_code'],
      ['leadStatus', 'lead_status'],
      ['notes', 'notes'],
      ['assignedAgentId', 'assigned_agent_id'],
    ];

    fields.forEach(([jsField, dbField]) => {
      if (updateData[jsField] !== undefined) {
        updates.push(`${dbField} = $${paramIndex++}`);
        params.push(updateData[jsField]);
      }
    });

    updates.push('updated_at = NOW()');
    params.push(id);

    const query = `UPDATE contacts SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await this.databaseService.getPool().query(query, params);

    if (result.rows.length === 0) {
      throw new NotFoundException('Contact not found');
    }

    return this.formatContact(result.rows[0]);
  }

  async delete(id: string) {
    await this.ensurePool();

    const result = await this.databaseService.getPool().query(
      'DELETE FROM contacts WHERE id = $1 RETURNING id',
      [id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Contact not found');
    }

    return { message: 'Contact deleted successfully' };
  }

  private formatContact(row: any) {
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      company: row.company,
      jobTitle: row.job_title,
      address: row.address,
      city: row.city,
      state: row.state,
      postalCode: row.postal_code,
      country: row.country,
      timezone: row.timezone,
      leadSource: row.lead_source,
      leadStatus: row.lead_status,
      notes: row.notes,
      tags: row.tags,
      customFields: row.custom_fields,
      assignedAgentId: row.assigned_agent_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
