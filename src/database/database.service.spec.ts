import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from './database.service';
import { Pool } from 'pg';

// Mock the pg module
jest.mock('pg', () => {
  const mockPool = {
    connect: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
  };
  return {
    Pool: jest.fn(() => mockPool),
  };
});

describe('DatabaseService', () => {
  let service: DatabaseService;
  let mockPool: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseService],
    }).compile();

    service = module.get<DatabaseService>(DatabaseService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  describe('initializePool', () => {
    it('should initialize the database pool with connection string', () => {
      const connectionString = 'postgresql://user:pass@localhost:5432/testdb';

      service.initializePool(connectionString);

      expect(Pool).toHaveBeenCalledWith({
        connectionString,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    });

    it('should not reinitialize pool if already initialized', () => {
      const connectionString = 'postgresql://user:pass@localhost:5432/testdb';

      service.initializePool(connectionString);
      service.initializePool(connectionString);

      // Pool constructor should only be called once
      expect(Pool).toHaveBeenCalledTimes(1);
    });
  });

  describe('testConnection', () => {
    it('should throw error if pool not initialized', async () => {
      await expect(service.testConnection()).rejects.toThrow(
        'Database pool not initialized. Call initializePool() first.',
      );
    });

    it('should successfully test connection', async () => {
      const connectionString = 'postgresql://user:pass@localhost:5432/testdb';
      const mockClient = {
        query: jest.fn().mockResolvedValue({
          rows: [{ current_time: new Date() }],
        }),
        release: jest.fn(),
      };

      service.initializePool(connectionString);
      mockPool = service.getPool();
      mockPool.connect.mockResolvedValue(mockClient);

      const result = await service.testConnection();

      expect(result).toBe(true);
      expect(mockClient.query).toHaveBeenCalledWith('SELECT NOW() as current_time');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle connection failure', async () => {
      const connectionString = 'postgresql://user:pass@localhost:5432/testdb';
      const error = new Error('Connection failed');

      service.initializePool(connectionString);
      mockPool = service.getPool();
      mockPool.connect.mockRejectedValue(error);

      await expect(service.testConnection()).rejects.toThrow('Connection failed');
    });

    it('should release client even if query fails', async () => {
      const connectionString = 'postgresql://user:pass@localhost:5432/testdb';
      const mockClient = {
        query: jest.fn().mockRejectedValue(new Error('Query failed')),
        release: jest.fn(),
      };

      service.initializePool(connectionString);
      mockPool = service.getPool();
      mockPool.connect.mockResolvedValue(mockClient);

      await expect(service.testConnection()).rejects.toThrow('Query failed');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('getPool', () => {
    it('should throw error if pool not initialized', () => {
      expect(() => service.getPool()).toThrow(
        'Database pool not initialized. Call initializePool() first.',
      );
    });

    it('should return pool when initialized', () => {
      const connectionString = 'postgresql://user:pass@localhost:5432/testdb';

      service.initializePool(connectionString);
      const pool = service.getPool();

      expect(pool).toBeDefined();
    });
  });

  describe('onModuleDestroy', () => {
    it('should close pool on module destroy', async () => {
      const connectionString = 'postgresql://user:pass@localhost:5432/testdb';

      service.initializePool(connectionString);
      mockPool = service.getPool();

      await service.onModuleDestroy();

      expect(mockPool.end).toHaveBeenCalled();
    });

    it('should handle destroy when pool not initialized', async () => {
      await expect(service.onModuleDestroy()).resolves.not.toThrow();
    });
  });
});
