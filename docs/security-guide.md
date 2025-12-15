# AMS Trading Journal Web - Security Guide

## Security Architecture Overview

### Defense in Depth Strategy
```
┌─────────────────────────────────────────────────────────────┐
│                     Load Balancer                           │
│                    (SSL Termination)                       │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Web Application                           │
│  (Rate Limiting, Input Validation, Authentication)          │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                            │
│           (Authentication, Authorization)                   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      Database                              │
│           (Row Level Security, Encryption)                  │
└─────────────────────────────────────────────────────────────┘
```

## Authentication & Authorization

### JWT Implementation
```typescript
// src/auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        subscriptionPlan: {
          select: {
            id: true,
            name: true,
            features: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }
}
```

### Role-Based Access Control
```typescript
// src/auth/roles.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}
```

### Multi-Factor Authentication
```typescript
// src/auth/mfa.service.ts
import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MfaService {
  constructor(private prisma: PrismaService) {}

  async generateSecret(userId: string) {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(
      userId,
      'AMS Trading Journal',
      secret,
    );

    const qrCode = await toDataURL(otpauthUrl);

    // Store secret temporarily (in production, encrypt this)
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret },
    });

    return { secret, qrCode };
  }

  async verifyToken(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mfaSecret: true },
    });

    if (!user?.mfaSecret) {
      throw new Error('MFA not enabled');
    }

    return authenticator.verify({
      token,
      secret: user.mfaSecret,
    });
  }
}
```

## Data Protection

### Encryption at Rest
```typescript
// src/utils/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);

export class EncryptionService {
  static encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    };
  }

  static decrypt(encrypted: string, iv: string, tag: string): string {
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### Data Masking
```typescript
// src/utils/data-masking.ts
export class DataMaskingService {
  static maskEmail(email: string): string {
    const [username, domain] = email.split('@');
    const maskedUsername = username.substring(0, 2) + '*'.repeat(username.length - 2);
    return `${maskedUsername}@${domain}`;
  }

  static maskPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `***-***-${cleaned.slice(-4)}`;
    }
    return phone;
  }

  static maskCreditCard(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\D/g, '');
    if (cleaned.length >= 13 && cleaned.length <= 19) {
      return `****-****-****-${cleaned.slice(-4)}`;
    }
    return cardNumber;
  }
}
```

## Input Validation & Sanitization

### Request Validation
```typescript
// src/validations/trade.validation.ts
import { IsEnum, IsNumber, IsString, IsOptional, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTradeDto {
  @ApiProperty({ description: 'Trading asset symbol', example: 'EURUSD' })
  @IsString()
  @MaxLength(10)
  asset: string;

  @ApiProperty({ description: 'Trade type', enum: ['long', 'short'] })
  @IsEnum(['long', 'short'])
  tradeType: string;

  @ApiProperty({ description: 'Entry price', example: 1.1000 })
  @IsNumber()
  @Min(0)
  entryPrice: number;

  @ApiProperty({ description: 'Exit price', example: 1.1050 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  exitPrice?: number;

  @ApiProperty({ description: 'Position size', example: 1000 })
  @IsNumber()
  @Min(0)
  positionSize: number;

  @ApiProperty({ description: 'Trade date', example: '2024-01-15T10:30:00Z' })
  @IsDateString()
  tradeDate: string;

  @ApiProperty({ description: 'Result type', enum: ['win', 'loss', 'breakeven'] })
  @IsEnum(['win', 'loss', 'breakeven'])
  resultType: string;

  @ApiProperty({ description: 'Result value', example: 50 })
  @IsNumber()
  resultValue: number;
}
```

### XSS Protection
```typescript
// src/utils/sanitizer.ts
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Configure DOMPurify for server-side use
const window = new JSDOM('').window;
DOMPurify.setWindow(window);

export class SanitizerService {
  static sanitizeHTML(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
      ALLOWED_ATTR: [],
    });
  }

  static sanitizeInput(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });
  }
}
```

## Security Headers

### Helmet Configuration
```typescript
// src/config/security.ts
import helmet from 'helmet';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.ams-trading.com"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: 'deny',
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});
```

## Rate Limiting & DDoS Protection

### Rate Limiting Implementation
```typescript
// src/middleware/rate-limiter.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  private rateLimiter = new RateLimiterMemory({
    keyPrefix: 'middleware',
    points: 100, // Number of requests
    duration: 60, // Per 60 seconds
  });

  use(req: Request, res: Response, next: NextFunction) {
    const key = req.ip || req.connection.remoteAddress || 'unknown';

    this.rateLimiter
      .consume(key)
      .then(() => {
        next();
      })
      .catch((rejRes) => {
        res.status(429).json({
          error: 'Too Many Requests',
          retryAfter: Math.round(rejRes.msBeforeNext / 1000),
        });
      });
  }
}
```

### IP Whitelisting
```typescript
// src/middleware/ip-whitelist.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class IpWhitelistMiddleware implements NestMiddleware {
  private allowedIPs = process.env.ALLOWED_IPS?.split(',') || [];

  use(req: Request, res: Response, next: NextFunction) {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!this.allowedIPs.includes(clientIP)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Your IP is not allowed to access this resource',
      });
    }

    next();
  }
}
```

## Database Security

### Row Level Security
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE consistency_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_summaries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Traders can view their own trades" ON trades
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Traders can insert their own trades" ON trades
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Mentors can view their students' data" ON trades
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM mentor_relationships mr
            WHERE mr.mentor_id = auth.uid()::text
            AND mr.trader_id = trades.user_id
            AND mr.status = 'approved'
        )
    );
```

### Connection Security
```sql
-- Create encrypted connection
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = 'server.crt';
ALTER SYSTEM SET ssl_key_file = 'server.key';
ALTER SYSTEM SET ssl_ca_file = 'root.crt';

-- Create restricted database user
CREATE ROLE app_user WITH LOGIN PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE ams_trading TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
```

## Audit Logging

### Security Event Logging
```typescript
// src/utils/audit-logger.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLoggerService {
  constructor(private prisma: PrismaService) {}

  async logSecurityEvent(event: {
    userId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    details: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    await this.prisma.auditLog.create({
      data: {
        userId: event.userId,
        action: event.action,
        resourceType: event.resource,
        resourceId: event.resourceId,
        oldValues: event.details.oldValues || null,
        newValues: event.details.newValues || null,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        timestamp: new Date(),
      },
    });
  }

  async logAuthenticationAttempt(email: string, success: boolean, ipAddress: string) {
    await this.logSecurityEvent({
      action: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILURE',
      resource: 'authentication',
      details: { email, success },
      ipAddress,
    });
  }

  async logDataAccess(userId: string, resource: string, resourceId: string, action: string) {
    await this.logSecurityEvent({
      userId,
      action,
      resource,
      resourceId,
      details: {},
    });
  }
}
```

## Security Testing

### Penetration Testing Checklist
```typescript
// tests/security/security.test.ts
import { request } from 'supertest';
import { app } from '../app';

describe('Security Tests', () => {
  describe('Authentication', () => {
    it('should prevent SQL injection', async () => {
      const maliciousInput = "admin'--";
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: maliciousInput, password: 'password' })
        .expect(400);

      expect(response.body.error.message).toContain('Invalid email');
    });

    it('should prevent XSS attacks', async () => {
      const xssPayload = '<script>alert("xss")</script>';
      
      const response = await request(app)
        .post('/api/trades')
        .set('Authorization', 'Bearer valid-token')
        .send({
          asset: xssPayload,
          tradeType: 'long',
          entryPrice: 1.1000,
        })
        .expect(201);

      expect(response.body.data.asset).not.toContain('<script>');
    });
  });

  describe('Authorization', () => {
    it('should prevent access to other users data', async () => {
      const response = await request(app)
        .get('/api/trades')
        .set('Authorization', 'Bearer user-b-token')
        .expect(403);

      expect(response.body.error.message).toContain('Access denied');
    });
  });
});
```

This security guide provides comprehensive security measures for your AMS Trading Journal Web platform, covering authentication, authorization, data protection, and security testing.