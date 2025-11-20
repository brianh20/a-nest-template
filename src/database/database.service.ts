import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private pool: Pool | null = null;

  /**
   * Initialize the database connection pool
   * @param connectionString PostgreSQL connection string (e.g., postgresql://user:pass@host:port/db)
   */
  initializePool(connectionString: string): void {
    if (this.pool) {
      return; // Pool already initialized
    }

    this.pool = new Pool({
      connectionString,
      // Connection pool settings
      max: 10, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Fail fast for connection attempts
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  /**
   * Test the database connection
   * @returns Promise that resolves if connection is successful, rejects otherwise
   */
  async testConnection(): Promise<boolean> {
    if (!this.pool) {
      throw new Error('Database pool not initialized. Call initializePool() first.');
    }

    let client: PoolClient | null = null;
    try {
      // Get a client from the pool
      client = await this.pool.connect();

      // Run a simple query to verify connection
      const result = await client.query('SELECT NOW() as current_time');

      console.log('Database connection successful. Server time:', result.rows[0].current_time);
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    } finally {
      // Release the client back to the pool
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Get the connection pool
   * @returns The PostgreSQL pool instance
   */
  getPool(): Pool {
    if (!this.pool) {
      throw new Error('Database pool not initialized. Call initializePool() first.');
    }
    return this.pool;
  }

  /**
   * Clean up database connections when module is destroyed
   */
  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}
