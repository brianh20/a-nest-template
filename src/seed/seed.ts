import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Starting seed...');

    // Create 1 manager and 5 agents
    const managerPassword = await bcrypt.hash('manager123', 10);
    const agentPassword = await bcrypt.hash('agent123', 10);

    console.log('Creating users...');
    const managerResult = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      ['manager@callcenter.com', managerPassword, 'Sarah', 'Johnson', 'manager']
    );
    const managerId = managerResult.rows[0].id;
    console.log(`✓ Created manager: manager@callcenter.com / manager123`);

    const agents: string[] = [];
    const agentNames = [
      ['John', 'Smith'],
      ['Emma', 'Davis'],
      ['Michael', 'Brown'],
      ['Lisa', 'Wilson'],
      ['David', 'Martinez']
    ];

    for (let i = 0; i < agentNames.length; i++) {
      const [firstName, lastName] = agentNames[i];
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@callcenter.com`;
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [email, agentPassword, firstName, lastName, 'agent']
      );
      agents.push(result.rows[0].id);
      console.log(`✓ Created agent: ${email} / agent123`);
    }

    // Create 50 contacts
    console.log('Creating contacts...');
    const contacts: string[] = [];
    const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'Michael', 'Jennifer', 'William', 'Linda', 'David', 'Barbara'];
    const lastNames = ['Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'White', 'Harris', 'Clark'];
    const companies = ['Acme Corp', 'TechStart Inc', 'Global Solutions', 'Innovation Labs', 'Digital Ventures'];

    for (let i = 0; i < 50; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
      const phone = `555-${String(1000 + i).padStart(4, '0')}`;
      const company = companies[i % companies.length];

      const result = await pool.query(
        `INSERT INTO contacts (first_name, last_name, email, phone, company)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [firstName, lastName, email, phone, company]
      );
      contacts.push(result.rows[0].id);
    }
    console.log(`✓ Created ${contacts.length} contacts`);

    // Create 100 calls
    console.log('Creating calls...');
    const outcomes = ['completed', 'no_answer', 'voicemail', 'busy', 'failed'];

    for (let i = 0; i < 100; i++) {
      const contactId = contacts[i % contacts.length];
      const agentId = agents[i % agents.length];
      const outcome = outcomes[i % outcomes.length];
      const duration = outcome === 'completed' ? Math.floor(Math.random() * 600) + 60 : Math.floor(Math.random() * 30);

      // Random date within last 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const startTime = new Date();
      startTime.setDate(startTime.getDate() - daysAgo);
      startTime.setHours(Math.floor(Math.random() * 12) + 8); // Between 8am-8pm
      startTime.setMinutes(Math.floor(Math.random() * 60));

      const endTime = new Date(startTime.getTime() + duration * 1000);

      await pool.query(
        `INSERT INTO calls (contact_id, agent_id, start_time, end_time, duration, outcome, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          contactId,
          agentId,
          startTime,
          endTime,
          duration,
          outcome,
          `Call ${i + 1}: ${outcome}`
        ]
      );
    }
    console.log('✓ Created 100 calls');

    // Create 50 call insights
    console.log('Creating call insights...');
    const callsResult = await pool.query('SELECT id FROM calls ORDER BY created_at DESC LIMIT 50');
    const callIds = callsResult.rows.map(row => row.id);

    const sentiments = ['positive', 'neutral', 'negative'];

    for (let i = 0; i < callIds.length; i++) {
      const callId = callIds[i];
      const sentiment = sentiments[i % sentiments.length];
      const performanceScore = (Math.random() * 0.5 + 0.5).toFixed(2); // 0.50 to 1.00

      await pool.query(
        `INSERT INTO call_insights (call_id, sentiment, key_points, action_items, performance_score, transcript)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          callId,
          sentiment,
          ['Discussed product features', 'Customer showed interest', 'Pricing concerns addressed'],
          ['Follow up next week', 'Send product demo'],
          parseFloat(performanceScore),
          'Sample transcript for call analysis...'
        ]
      );
    }
    console.log('✓ Created 50 call insights');

    console.log('\n✅ Seed completed successfully!');
    console.log('\nDemo Credentials:');
    console.log('Manager: manager@callcenter.com / manager123');
    console.log('Agent: john.smith@callcenter.com / agent123');

  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
