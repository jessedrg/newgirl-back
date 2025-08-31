import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    console.log('🔑 JwtStrategy - JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('🔑 JwtStrategy - JWT_SECRET length:', process.env.JWT_SECRET?.length || 0);
    console.log('🔑 JwtStrategy - Using secret for verification');
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    return { 
      userId: payload.userId, 
      email: payload.email
    };
  }
}
