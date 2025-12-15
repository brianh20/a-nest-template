import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function seedData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Starting data seed...');

    // Get all agents for assigning calls
    const agentsResult = await pool.query(
      "SELECT id FROM users WHERE role = 'agent' ORDER BY created_at"
    );
    const agents = agentsResult.rows.map(row => row.id);

    if (agents.length === 0) {
      console.error('❌ No agents found. Please run seed-users first.');
      process.exit(1);
    }

    console.log(`Found ${agents.length} agents`);

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
    const directions = ['inbound', 'outbound'];

    for (let i = 0; i < 100; i++) {
      const contactId = contacts[i % contacts.length];
      const agentId = agents[i % agents.length];
      const direction = directions[i % directions.length];

      await pool.query(
        `INSERT INTO calls (contact_id, agent_id, direction)
         VALUES ($1, $2, $3)`,
        [contactId, agentId, direction]
      );
    }
    console.log('✓ Created 100 calls');

    // Create 50 call insights
    console.log('Creating call insights...');
    const callsResult = await pool.query('SELECT id FROM calls ORDER BY created_at DESC LIMIT 50');
    const callIds = callsResult.rows.map(row => row.id);

    for (let i = 0; i < callIds.length; i++) {
      const callId = callIds[i];

      await pool.query(
        `INSERT INTO call_insights (call_id)
         VALUES ($1)`,
        [callId]
      );
    }
    console.log('✓ Created 50 call insights');

    console.log('\n✅ Data seed completed successfully!');

  } catch (error) {
    console.error('Data seed error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedData();
