import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getDashboard() {
    console.log('AnalyticsService: Getting dashboard analytics');

    // Get calls today count
    const callsTodayResult = await this.databaseService.query(
      `SELECT COUNT(*) as count
       FROM calls
       WHERE DATE(created_at) = CURRENT_DATE`,
    );
    const callsToday = parseInt(callsTodayResult.rows[0].count);
    console.log(`AnalyticsService: Calls today: ${callsToday}`);

    // Get completed calls today count
    const completedTodayResult = await this.databaseService.query(
      `SELECT COUNT(*) as count
       FROM calls
       WHERE DATE(created_at) = CURRENT_DATE
       AND outcome = 'completed'`,
    );
    const completedToday = parseInt(completedTodayResult.rows[0].count);
    console.log(`AnalyticsService: Completed today: ${completedToday}`);

    // Get average duration
    const avgDurationResult = await this.databaseService.query(
      `SELECT AVG(duration) as avg_duration
       FROM calls
       WHERE duration > 0`,
    );
    const avgDuration = Math.round(
      parseFloat(avgDurationResult.rows[0].avg_duration || 0),
    );
    console.log(`AnalyticsService: Average duration: ${avgDuration}s`);

    // Get top agents
    const topAgentsResult = await this.databaseService.query(
      `SELECT
        u.id,
        u.first_name || ' ' || u.last_name AS name,
        COUNT(c.id) as call_count,
        ROUND(AVG(CASE WHEN c.outcome = 'completed' THEN 100 ELSE 0 END)) as avg_performance
       FROM users u
       LEFT JOIN calls c ON u.id = c.agent_id
       WHERE u.role = 'agent'
       GROUP BY u.id, u.first_name, u.last_name
       ORDER BY call_count DESC, avg_performance DESC
       LIMIT 5`,
    );
    const topAgents = topAgentsResult.rows.map((row) => ({
      name: row.name,
      callCount: parseInt(row.call_count),
      avgPerformance: parseInt(row.avg_performance || 0),
    }));
    console.log(`AnalyticsService: Top agents count: ${topAgents.length}`);

    // Get recent calls
    const recentCallsResult = await this.databaseService.query(
      `SELECT
        c.id,
        co.first_name || ' ' || co.last_name as contact_name,
        u.first_name || ' ' || u.last_name as agent_name,
        c.outcome,
        c.duration,
        c.created_at
       FROM calls c
       LEFT JOIN contacts co ON c.contact_id = co.id
       LEFT JOIN users u ON c.agent_id = u.id
       ORDER BY c.created_at DESC
       LIMIT 10`,
    );
    const recentCalls = recentCallsResult.rows.map((row) => ({
      contactName: row.contact_name,
      agentName: row.agent_name,
      outcome: row.outcome,
      duration: row.duration,
    }));
    console.log(`AnalyticsService: Recent calls count: ${recentCalls.length}`);

    const dashboard = {
      callsToday,
      completedToday,
      avgDuration,
      topAgents,
      recentCalls,
    };

    console.log('AnalyticsService: Dashboard data prepared');
    return dashboard;
  }
}
