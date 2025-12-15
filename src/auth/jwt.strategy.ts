import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private databaseService: DatabaseService,
  ) {
    const secret = configService.get<string>('JWT_SECRET') || 'dev-secret-key';
    console.log('JwtStrategy initialized with secret:', secret === 'dev-secret-key' ? 'dev-secret-key' : '***configured***');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    console.log('JWT Strategy validate called with payload:', payload);

    const pool = this.databaseService.getPool();

    if (!pool) {
      console.log('Pool not initialized, initializing...');
      const dbUrl = this.configService.get<string>('DATABASE_URL') || '';
      await this.databaseService.initializePool(dbUrl);
    }

    try {
      const result = await this.databaseService.getPool().query(
        'SELECT id, email, first_name, last_name, role, is_active FROM users WHERE id = $1 AND is_active = true',
        [payload.sub],
      );

      console.log('Database query result:', result.rows.length, 'rows');

      if (result.rows.length === 0) {
        console.log('User not found or inactive');
        throw new UnauthorizedException();
      }

      const user = {
        id: result.rows[0].id,
        email: result.rows[0].email,
        firstName: result.rows[0].first_name,
        lastName: result.rows[0].last_name,
        role: result.rows[0].role,
      };

      console.log('User validated successfully:', user.email);
      return user;
    } catch (error) {
      console.error('JWT validation error:', error);
      throw new UnauthorizedException();
    }
  }
}
