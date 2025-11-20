import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthController } from './health.controller';
import { DatabaseService } from '../database/database.service';

describe('HealthController', () => {
  let controller: HealthController;
  let databaseService: DatabaseService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: DatabaseService,
          useValue: {
            initializePool: jest.fn(),
            testConnection: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    databaseService = module.get<DatabaseService>(DatabaseService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHealth', () => {
    it('should return basic health status', () => {
      const result = controller.getHealth();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('service', 'a-nest-template');
    });
  });

  describe('getDatabaseHealth', () => {
    it('should return not_configured when DATABASE_URL is not set', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);

      const result = await controller.getDatabaseHealth();

      expect(result).toEqual({
        status: 'not_configured',
        message: 'DATABASE_URL environment variable is not set',
        timestamp: expect.any(String),
      });
      expect(configService.get).toHaveBeenCalledWith('DATABASE_URL');
      expect(databaseService.initializePool).not.toHaveBeenCalled();
      expect(databaseService.testConnection).not.toHaveBeenCalled();
    });

    it('should return healthy status when database connection succeeds', async () => {
      const databaseUrl = 'postgresql://user:pass@localhost:5432/testdb';
      jest.spyOn(configService, 'get').mockReturnValue(databaseUrl);
      jest.spyOn(databaseService, 'testConnection').mockResolvedValue(true);

      const result = await controller.getDatabaseHealth();

      expect(result).toEqual({
        status: 'healthy',
        message: 'Database connection successful',
        timestamp: expect.any(String),
        database: {
          connected: true,
        },
      });
      expect(configService.get).toHaveBeenCalledWith('DATABASE_URL');
      expect(databaseService.initializePool).toHaveBeenCalledWith(databaseUrl);
      expect(databaseService.testConnection).toHaveBeenCalled();
    });

    it('should throw HttpException when database connection fails', async () => {
      const databaseUrl = 'postgresql://user:pass@localhost:5432/testdb';
      jest.spyOn(configService, 'get').mockReturnValue(databaseUrl);
      const error = new Error('Connection refused');
      jest.spyOn(databaseService, 'testConnection').mockRejectedValue(error);

      try {
        await controller.getDatabaseHealth();
        fail('Should have thrown an exception');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
        const response = e.getResponse() as any;
        expect(response.status).toBe('unhealthy');
        expect(response.message).toBe('Database connection failed');
        expect(response.error).toBe('Connection refused');
      }
    });

    it('should initialize pool before testing connection', async () => {
      const databaseUrl = 'postgresql://user:pass@localhost:5432/testdb';
      jest.spyOn(configService, 'get').mockReturnValue(databaseUrl);
      jest.spyOn(databaseService, 'testConnection').mockResolvedValue(true);

      await controller.getDatabaseHealth();

      expect(configService.get).toHaveBeenCalledWith('DATABASE_URL');
      expect(databaseService.initializePool).toHaveBeenCalledWith(databaseUrl);
      expect(databaseService.testConnection).toHaveBeenCalled();
    });
  });
});
