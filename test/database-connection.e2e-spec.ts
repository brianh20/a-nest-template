import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../src/database/database.service';
import { DatabaseModule } from '../src/database/database.module';

describe('Database Connection (e2e)', () => {
  let databaseService: DatabaseService;
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [DatabaseModule],
    }).compile();

    databaseService = moduleFixture.get<DatabaseService>(DatabaseService);
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  describe('PostgreSQL Connection Test', () => {
    it('should connect to database using DATABASE_URL environment variable', async () => {
      // Check if DATABASE_URL is set
      const databaseUrl = process.env.DATABASE_URL;

      if (!databaseUrl) {
        console.warn(
          'Skipping database connection test: DATABASE_URL environment variable not set.',
        );
        console.warn('Example: DATABASE_URL=postgresql://aguanteRiver:aguanteRiver@localhost:5401/aguanteRiver');
        return; // Skip test if DATABASE_URL is not set
      }

      // Initialize the connection pool
      databaseService.initializePool(databaseUrl);

      // Test the connection
      const isConnected = await databaseService.testConnection();

      expect(isConnected).toBe(true);
    });

    it('should fail gracefully with invalid connection string', async () => {
      const invalidUrl = 'postgresql://invalid:invalid@nonexistent:9999/invalid';

      // Create a separate instance for this test
      const testModule = await Test.createTestingModule({
        imports: [DatabaseModule],
      }).compile();

      const testService = testModule.get<DatabaseService>(DatabaseService);

      testService.initializePool(invalidUrl);

      // Expect connection to fail
      await expect(testService.testConnection()).rejects.toThrow();

      // Clean up
      await testModule.close();
    });

    it('should handle connection string in expected format', () => {
      const expectedFormat = 'postgresql://aguanteRiver:aguanteRiver@localhost:5401/aguanteRiver';

      // Parse the connection string to verify format
      const url = new URL(expectedFormat);

      expect(url.protocol).toBe('postgresql:');
      expect(url.username).toBe('aguanteRiver');
      expect(url.password).toBe('aguanteRiver');
      expect(url.hostname).toBe('localhost');
      expect(url.port).toBe('5401');
      expect(url.pathname).toBe('/aguanteRiver');
    });
  });
});
