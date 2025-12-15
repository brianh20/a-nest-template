import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AnalyticsService {
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

  async getDashboard() {
    await this.ensurePool();

    const totalCallsResult = await this.databaseService.getPool().query(
      "SELECT COUNT(*) as count FROM calls WHERE DATE(started_at) = CURRENT_DATE"
    );

    const completedCallsResult = await this.databaseService.getPool().query(
      "SELECT COUNT(*) as count FROM calls WHERE status = 'completed' AND DATE(started_at) = CURRENT_DATE"
    );

    const avgDurationResult = await this.databaseService.getPool().query(
      "SELECT AVG(duration_seconds) as avg FROM calls WHERE status = 'completed' AND DATE(started_at) = CURRENT_DATE"
    );

    const topAgentsResult = await this.databaseService.getPool().query(
      `SELECT u.id, u.first_name, u.last_name, COUNT(c.id) as call_count,
              AVG(c.duration_seconds) as avg_duration,
              AVG(ci.performance_score) as avg_performance
       FROM users u
       LEFT JOIN calls c ON u.id = c.agent_id AND DATE(c.started_at) = CURRENT_DATE
       LEFT JOIN call_insights ci ON c.id = ci.call_id
       WHERE u.role = 'agent'
       GROUP BY u.id, u.first_name, u.last_name
       ORDER BY call_count DESC
       LIMIT 10`
    );

    const recentCallsResult = await this.databaseService.getPool().query(
      `SELECT c.*,
              co.first_name as contact_first_name, co.last_name as contact_last_name,
              u.first_name as agent_first_name, u.last_name as agent_last_name
       FROM calls c
       LEFT JOIN contacts co ON c.contact_id = co.id
       LEFT JOIN users u ON c.agent_id = u.id
       ORDER BY c.started_at DESC
       LIMIT 10`
    );

    return {
      callsToday: parseInt(totalCallsResult.rows[0].count),
      completedToday: parseInt(completedCallsResult.rows[0].count),
      avgDuration: Math.round(parseFloat(avgDurationResult.rows[0].avg) || 0),
      topAgents: topAgentsResult.rows.map(row => ({
        id: row.id,
        name: `${row.first_name} ${row.last_name}`,
        callCount: parseInt(row.call_count),
        avgDuration: Math.round(parseFloat(row.avg_duration) || 0),
        avgPerformance: parseFloat(row.avg_performance) || 0,
      })),
      recentCalls: recentCallsResult.rows.map(row => ({
        id: row.id,
        contactName: `${row.contact_first_name} ${row.contact_last_name}`,
        agentName: `${row.agent_first_name} ${row.agent_last_name}`,
        status: row.status,
        outcome: row.outcome,
        duration: row.duration_seconds,
        startedAt: row.started_at,
      })),
    };
  }
}
