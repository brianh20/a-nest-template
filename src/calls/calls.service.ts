import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class CallsService {
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

  async create(createData: any, userId: string) {
    await this.ensurePool();

    const result = await this.databaseService.getPool().query(
      `INSERT INTO calls (contact_id, agent_id, direction, status, outcome, started_at, ended_at, duration_seconds, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        createData.contactId,
        userId,
        createData.direction || 'outbound',
        createData.status || 'completed',
        createData.outcome,
        createData.startedAt || new Date(),
        createData.endedAt || new Date(),
        createData.durationSeconds || 0,
        createData.notes,
      ],
    );

    return this.formatCall(result.rows[0]);
  }

  async findAll(filters?: any) {
    await this.ensurePool();

    let query = `SELECT c.*,
                 co.first_name as contact_first_name, co.last_name as contact_last_name,
                 u.first_name as agent_first_name, u.last_name as agent_last_name
                 FROM calls c
                 LEFT JOIN contacts co ON c.contact_id = co.id
                 LEFT JOIN users u ON c.agent_id = u.id
                 WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.agentId) {
      query += ` AND c.agent_id = $${paramIndex}`;
      params.push(filters.agentId);
      paramIndex++;
    }

    if (filters?.contactId) {
      query += ` AND c.contact_id = $${paramIndex}`;
      params.push(filters.contactId);
      paramIndex++;
    }

    query += ' ORDER BY c.started_at DESC LIMIT 100';

    const result = await this.databaseService.getPool().query(query, params);

    return result.rows.map(row => ({
      ...this.formatCall(row),
      contactName: `${row.contact_first_name} ${row.contact_last_name}`,
      agentName: `${row.agent_first_name} ${row.agent_last_name}`,
    }));
  }

  async findOne(id: string) {
    await this.ensurePool();

    const result = await this.databaseService.getPool().query(
      `SELECT c.*, ci.summary, ci.sentiment, ci.key_topics, ci.coaching_notes, ci.performance_score
       FROM calls c
       LEFT JOIN call_insights ci ON c.id = ci.call_id
       WHERE c.id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Call not found');
    }

    const call = result.rows[0];
    return {
      ...this.formatCall(call),
      insights: call.summary ? {
        summary: call.summary,
        sentiment: call.sentiment,
        keyTopics: call.key_topics,
        coachingNotes: call.coaching_notes,
        performanceScore: call.performance_score,
      } : null,
    };
  }

  private formatCall(row: any) {
    return {
      id: row.id,
      contactId: row.contact_id,
      agentId: row.agent_id,
      direction: row.direction,
      status: row.status,
      outcome: row.outcome,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      durationSeconds: row.duration_seconds,
      notes: row.notes,
      recordingUrl: row.recording_url,
      createdAt: row.created_at,
    };
  }
}
