import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';

config();

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Starting seed...');

    // Create manager
    const managerPassword = await bcrypt.hash('password123', 10);
    const managerResult = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      ['manager@example.com', managerPassword, 'John', 'Manager', 'manager']
    );
    console.log('Created manager user');

    // Create agents
    const agentPassword = await bcrypt.hash('password123', 10);
    const agents: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [`agent${i}@example.com`, agentPassword, `Agent`, `${i}`, 'agent']
      );
      agents.push(result.rows[0].id);
    }
    console.log('Created 5 agent users');

    // Create contacts
    const companies = ['Acme Corp', 'TechStart Inc', 'Global Solutions', 'Innovation Labs', 'Future Systems'];
    const statuses = ['new', 'contacted', 'qualified', 'converted', 'lost'];
    const contacts: string[] = [];

    for (let i = 1; i <= 50; i++) {
      const result = await pool.query(
        `INSERT INTO contacts (first_name, last_name, email, phone, company, job_title, city, state, lead_status, assigned_agent_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          `Contact${i}`,
          `Lastname${i}`,
          `contact${i}@example.com`,
          `555-010${i.toString().padStart(4, '0')}`,
          companies[i % companies.length],
          i % 3 === 0 ? 'CEO' : i % 3 === 1 ? 'CTO' : 'Manager',
          'San Francisco',
          'CA',
          statuses[i % statuses.length],
          agents[i % agents.length],
        ]
      );
      contacts.push(result.rows[0].id);
    }
    console.log('Created 50 contacts');

    // Create calls
    const outcomes = ['sale', 'callback_scheduled', 'not_interested', 'no_answer', 'follow_up_needed'];
    const directions = ['outbound', 'inbound'];

    for (let i = 0; i < 100; i++) {
      const startedAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const duration = Math.floor(Math.random() * 1800) + 60;
      const endedAt = new Date(startedAt.getTime() + duration * 1000);

      const result = await pool.query(
        `INSERT INTO calls (contact_id, agent_id, direction, status, outcome, started_at, ended_at, duration_seconds, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          contacts[i % contacts.length],
          agents[i % agents.length],
          directions[i % directions.length],
          'completed',
          outcomes[i % outcomes.length],
          startedAt,
          endedAt,
          duration,
          `Sample call notes for call ${i + 1}`,
        ]
      );

      // Create call insights for some calls
      if (i % 2 === 0) {
        const sentiments = ['positive', 'neutral', 'negative'];
        const sentiment = sentiments[i % sentiments.length];
        const sentimentScore = sentiment === 'positive' ? 0.8 : sentiment === 'neutral' ? 0.5 : 0.2;
        const performanceScore = Math.random() * 0.5 + 0.5;

        await pool.query(
          `INSERT INTO call_insights (call_id, summary, sentiment, sentiment_score, key_topics, coaching_notes, performance_score, processing_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            result.rows[0].id,
            `This was a ${sentiment} call about our product offering. The customer showed interest in features.`,
            sentiment,
            sentimentScore,
            ['product', 'pricing', 'features'],
            'Good rapport building. Could improve on objection handling.',
            performanceScore,
            'completed',
          ]
        );
      }
    }
    console.log('Created 100 calls with 50 call insights');

    console.log('\nSeed completed successfully!');
    console.log('\nDefault credentials:');
    console.log('Manager: manager@example.com / password123');
    console.log('Agent 1: agent1@example.com / password123');
    console.log('Agent 2: agent2@example.com / password123');

  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
