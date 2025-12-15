import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

async function seedUsers() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Starting user seed...');

    // Create 1 manager and 5 agents
    const managerPassword = await bcrypt.hash('manager123', 10);
    const agentPassword = await bcrypt.hash('agent123', 10);

    console.log('Creating users...');

    // Check if manager already exists
    const existingManager = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      ['manager@callcenter.com']
    );

    if (existingManager.rows.length > 0) {
      console.log('⚠ Manager already exists, skipping...');
    } else {
      await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role)
         VALUES ($1, $2, $3, $4, $5)`,
        ['manager@callcenter.com', managerPassword, 'Sarah', 'Johnson', 'manager']
      );
      console.log(`✓ Created manager: manager@callcenter.com / manager123`);
    }

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

      // Check if agent already exists
      const existingAgent = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingAgent.rows.length > 0) {
        console.log(`⚠ Agent ${email} already exists, skipping...`);
      } else {
        await pool.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, role)
           VALUES ($1, $2, $3, $4, $5)`,
          [email, agentPassword, firstName, lastName, 'agent']
        );
        console.log(`✓ Created agent: ${email} / agent123`);
      }
    }

    console.log('\n✅ User seed completed successfully!');
    console.log('\nDemo Credentials:');
    console.log('Manager: manager@callcenter.com / manager123');
    console.log('Agent: john.smith@callcenter.com / agent123');

  } catch (error) {
    console.error('User seed error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedUsers();
