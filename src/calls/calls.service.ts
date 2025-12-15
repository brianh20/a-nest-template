import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class CallsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(page: number = 1, limit: number = 10) {
    console.log(`CallsService: Finding calls - page: ${page}, limit: ${limit}`);

    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await this.databaseService.query(
      'SELECT COUNT(*) FROM calls',
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results with joined data
    const dataResult = await this.databaseService.query(
      `SELECT
        c.id,
        c.contact_id,
        c.agent_id,
        c.outcome,
        c.duration,
        c.notes,
        c.created_at,
        co.first_name || ' ' || co.last_name as contact_name,
        u.first_name || ' ' || u.last_name as agent_name
       FROM calls c
       LEFT JOIN contacts co ON c.contact_id = co.id
       LEFT JOIN users u ON c.agent_id = u.id
       ORDER BY c.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    console.log(
      `CallsService: Found ${dataResult.rows.length} calls (total: ${total})`,
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
    console.log(`CallsService: Finding call with id ${id}`);
    const result = await this.databaseService.query(
      `SELECT
        c.id,
        c.contact_id,
        c.agent_id,
        c.outcome,
        c.duration,
        c.notes,
        c.created_at,
        co.first_name || ' ' || co.last_name as contact_name,
        co.phone as contact_phone,
        u.first_name || ' ' || u.last_name as agent_name
       FROM calls c
       LEFT JOIN contacts co ON c.contact_id = co.id
       LEFT JOIN users u ON c.agent_id = u.id
       WHERE c.id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      console.log(`CallsService: Call with id ${id} not found`);
      throw new NotFoundException(`Call with ID ${id} not found`);
    }

    console.log(`CallsService: Found call ${result.rows[0].id}`);
    return result.rows[0];
  }

  async create(callData: {
    contact_id: string;
    agent_id: string;
    outcome: string;
    duration?: number;
    notes?: string;
  }) {
    console.log('CallsService: Creating call', callData);

    const result = await this.databaseService.query(
      `INSERT INTO calls (contact_id, agent_id, outcome, duration, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, contact_id, agent_id, outcome, duration, notes, created_at`,
      [
        callData.contact_id,
        callData.agent_id,
        callData.outcome,
        callData.duration || 0,
        callData.notes || null,
      ],
    );

    console.log(`CallsService: Created call ${result.rows[0].id}`);
    return result.rows[0];
  }

  async update(
    id: string,
    updateData: {
      outcome?: string;
      duration?: number;
      notes?: string;
    },
  ) {
    console.log(`CallsService: Updating call ${id}`, updateData);

    // Check if call exists
    await this.findOne(id);

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updateData.outcome !== undefined) {
      updates.push(`outcome = $${paramCount}`);
      values.push(updateData.outcome);
      paramCount++;
    }

    if (updateData.duration !== undefined) {
      updates.push(`duration = $${paramCount}`);
      values.push(updateData.duration);
      paramCount++;
    }

    if (updateData.notes !== undefined) {
      updates.push(`notes = $${paramCount}`);
      values.push(updateData.notes);
      paramCount++;
    }

    if (updates.length === 0) {
      console.log('CallsService: No fields to update');
      return this.findOne(id);
    }

    values.push(id);

    const query = `
      UPDATE calls
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, contact_id, agent_id, outcome, duration, notes, created_at
    `;

    const result = await this.databaseService.query(query, values);
    console.log(`CallsService: Updated call ${id}`);
    return result.rows[0];
  }

  async findByContact(contactId: string) {
    console.log(`CallsService: Finding calls for contact ${contactId}`);
    const result = await this.databaseService.query(
      `SELECT
        c.id,
        c.contact_id,
        c.agent_id,
        c.outcome,
        c.duration,
        c.notes,
        c.created_at,
        u.first_name || ' ' || u.last_name as agent_name
       FROM calls c
       LEFT JOIN users u ON c.agent_id = u.id
       WHERE c.contact_id = $1
       ORDER BY c.created_at DESC`,
      [contactId],
    );

    console.log(
      `CallsService: Found ${result.rows.length} calls for contact ${contactId}`,
    );
    return result.rows;
  }

  async findByAgent(agentId: string) {
    console.log(`CallsService: Finding calls for agent ${agentId}`);
    const result = await this.databaseService.query(
      `SELECT
        c.id,
        c.contact_id,
        c.agent_id,
        c.outcome,
        c.duration,
        c.notes,
        c.created_at,
        co.first_name || ' ' || co.last_name as contact_name,
        co.phone as contact_phone
       FROM calls c
       LEFT JOIN contacts co ON c.contact_id = co.id
       WHERE c.agent_id = $1
       ORDER BY c.created_at DESC`,
      [agentId],
    );

    console.log(
      `CallsService: Found ${result.rows.length} calls for agent ${agentId}`,
    );
    return result.rows;
  }
}
