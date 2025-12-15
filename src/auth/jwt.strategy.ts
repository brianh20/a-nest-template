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
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'dev-secret-key',
    });
    console.log('[JwtStrategy] Initialized with secret from config');
  }

  async validate(payload: any) {
    console.log('[JwtStrategy] Validating JWT payload:', payload);

    const query = 'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1';
    const result = await this.databaseService.query(query, [payload.sub]);

    if (result.rows.length === 0) {
      console.log('[JwtStrategy] User not found for ID:', payload.sub);
      throw new UnauthorizedException('User not found');
    }

    const user = result.rows[0];
    console.log('[JwtStrategy] User validated:', { id: user.id, email: user.email, role: user.role });

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
    };
  }
}
