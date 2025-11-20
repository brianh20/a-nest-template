import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'a-nest-template',
    };
  }

  @Get('db')
  async getDatabaseHealth() {
    try {
      // Check if DATABASE_URL is configured using ConfigService
      const databaseUrl = this.configService.get<string>('DATABASE_URL');
      if (!databaseUrl) {
        return {
          status: 'not_configured',
          message: 'DATABASE_URL environment variable is not set',
          timestamp: new Date().toISOString(),
        };
      }

      // Initialize pool if not already done
      this.databaseService.initializePool(databaseUrl);

      // Test the connection
      const isConnected = await this.databaseService.testConnection();

      return {
        status: isConnected ? 'healthy' : 'unhealthy',
        message: 'Database connection successful',
        timestamp: new Date().toISOString(),
        database: {
          connected: isConnected,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'unhealthy',
          message: 'Database connection failed',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
