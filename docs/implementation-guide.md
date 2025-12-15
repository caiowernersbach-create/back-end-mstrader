# AMS Trading Journal Web - Implementation Guide

## Technology Stack Recommendations

### Backend
```typescript
// Core Technologies
- Node.js / TypeScript
- Express.js / NestJS
- PostgreSQL (primary database)
- Redis (caching & session management)
- BullMQ (background job processing)
- Prisma / TypeORM (ORM)

// Authentication & Security
- JWT tokens
- bcrypt (password hashing)
- helmet (security headers)
- rate-limiter-flexible

// API Documentation
- Swagger / OpenAPI
- apicurio (for API governance)

// Testing
- Jest
- Supertest
- @testing-library/react
```

### Frontend
```typescript
// Core Technologies
- React 18
- TypeScript
- React Router v6
- Tailwind CSS
- shadcn/ui components

// State Management
- Zustand / Redux Toolkit
- React Query (data fetching)

// Charts & Analytics
- Recharts
- Chart.js

// Forms
- React Hook Form
- Zod (validation)

// Testing
- Vitest
- React Testing Library
```

### DevOps & Infrastructure
```yaml
# Containerization
- Docker
- Docker Compose

# CI/CD
- GitHub Actions
- Vercel / AWS

# Monitoring
- Prometheus
- Grafana
- Sentry (error tracking)

# Database
- PostgreSQL with read replicas
- Redis cluster
- Automated backups
```

## Database Implementation Details

### Connection Pooling Configuration
```sql
-- PostgreSQL pg_hba.conf configuration
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# Allow local connections
local   all             all                                     trust
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256

# Allow application server connections
host    ams_trading     app_user        10.0.0.0/24             scram-sha-256
host    ams_trading     app_user        172.17.0.0/16           scram-sha-256
```

### Index Optimization Strategy
```sql
-- Composite indexes for common query patterns
CREATE INDEX idx_trades_user_date_result ON trades(user_id, trade_date, result_type);
CREATE INDEX idx_trades_asset_date ON trades(asset, trade_date);
CREATE INDEX idx_monthly_summaries_user_year ON monthly_summaries(user_id, year);

-- Partial indexes for filtered queries
CREATE INDEX idx_trades_wins ON trades(user_id, result_type) WHERE result_type = 'win';
CREATE INDEX idx_trades_losses ON trades(user_id, result_type) WHERE result_type = 'loss';

-- Expression indexes for computed values
CREATE INDEX idx_trades_rr_ratio ON trades(risk_reward_ratio) WHERE risk_reward_ratio IS NOT NULL;
```

### Partitioning Strategy for Large Tables
```sql
-- Create partition function for trades table
CREATE OR REPLACE FUNCTION get_trades_partition_name(p_trade_date date)
RETURNS TEXT AS $$
BEGIN
    RETURN 'trades_' || to_char(p_trade_date, 'YYYY_MM');
END;
$$ LANGUAGE plpgsql;

-- Create partitioned trades table
CREATE TABLE trades (
    -- Same columns as before
) PARTITION BY RANGE (trade_date);

-- Create monthly partitions
CREATE TABLE trades_2024_01 PARTITION OF trades
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE trades_2024_02 PARTITION OF trades
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
```

## Backend Implementation Patterns

### Repository Pattern
```typescript
// src/repositories/trade.repository.ts
import { PrismaClient } from '@prisma/client';

export class TradeRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findByUserId(userId: string, pagination: PaginationOptions) {
    return this.prisma.trade.findMany({
      where: { userId },
      include: {
        strategy: true,
        details: true,
      },
      orderBy: { tradeDate: 'desc' },
      skip: pagination.offset,
      take: pagination.limit,
    });
  }

  async createTrade(data: CreateTradeDto) {
    return this.prisma.trade.create({
      data,
      include: {
        strategy: true,
        details: true,
      },
    });
  }

  async getMonthlySummary(userId: string, year: number, month: number) {
    return this.prisma.monthlySummary.findUnique({
      where: {
        userId_year_month: {
          userId,
          year,
          month,
        },
      },
    });
  }
}
```

### Service Layer
```typescript
// src/services/trade.service.ts
import { TradeRepository } from '../repositories/trade.repository';
import { PerformanceCalculator } from '../utils/performance-calculator';

export class TradeService {
  constructor(
    private tradeRepository: TradeRepository,
    private performanceCalculator: PerformanceCalculator,
  ) {}

  async createTrade(userId: string, tradeData: CreateTradeDto) {
    // Validate trade data
    this.validateTradeData(tradeData);

    // Create trade
    const trade = await this.tradeRepository.createTrade({
      ...tradeData,
      userId,
    });

    // Trigger background job for analytics
    this.queueAnalyticsUpdate(userId);

    return trade;
  }

  async getTrades(userId: string, filters: TradeFilters) {
    const pagination = this.buildPagination(filters);
    return this.tradeRepository.findByUserId(userId, pagination);
  }

  private async queueAnalyticsUpdate(userId: string) {
    // Add to background job queue
    await this.jobQueue.add('update-analytics', { userId });
  }
}
```

### Background Job Processing
```typescript
// src/jobs/analytics.job.ts
import { Job } from 'bullmq';
import { TradeRepository } from '../repositories/trade.repository';

export class AnalyticsJob {
  constructor(private tradeRepository: TradeRepository) {}

  async updateMonthlySummary(job: Job) {
    const { userId } = job.data;

    // Calculate monthly summary
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const trades = await this.tradeRepository.getTradesForMonth(
      userId,
      currentYear,
      currentMonth,
    );

    const summary = this.calculateSummary(trades);

    // Update or create monthly summary
    await this.tradeRepository.upsertMonthlySummary({
      userId,
      year: currentYear,
      month: currentMonth,
      ...summary,
    });

    // Update calendar stats
    await this.updateCalendarStats(userId, trades);
  }

  private calculateSummary(trades: Trade[]) {
    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => t.resultType === 'win').length;
    const losingTrades = trades.filter(t => t.resultType === 'loss').length;
    
    const totalProfit = trades
      .filter(t => t.resultType === 'win')
      .reduce((sum, t) => sum + t.resultValue, 0);
    
    const totalLoss = trades
      .filter(t => t.resultType === 'loss')
      .reduce((sum, t) => sum + Math.abs(t.resultValue), 0);

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      breakevenTrades: totalTrades - winningTrades - losingTrades,
      totalProfit,
      totalLoss,
      netResult: totalProfit - totalLoss,
      winRate: totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0,
      profitFactor: totalLoss > 0 ? totalProfit / totalLoss : null,
    };
  }
}
```

## Frontend Implementation Patterns

### Custom Hooks
```typescript
// src/hooks/useTrades.ts
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tradeService } from '../services/trade.service';

export function useTrades(userId: string, filters?: TradeFilters) {
  const queryClient = useQueryClient();

  const { data: trades, isLoading, error } = useQuery({
    queryKey: ['trades', userId, filters],
    queryFn: () => tradeService.getTrades(userId, filters),
    enabled: !!userId,
  });

  const createTradeMutation = useMutation({
    mutationFn: (tradeData: CreateTradeDto) => 
      tradeService.createTrade(userId, tradeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades', userId] });
    },
  });

  const deleteTradeMutation = useMutation({
    mutationFn: (tradeId: string) => 
      tradeService.deleteTrade(userId, tradeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades', userId] });
    },
  });

  return {
    trades,
    isLoading,
    error,
    createTrade: createTradeMutation.mutate,
    deleteTrade: deleteTradeMutation.mutate,
    isCreating: createTradeMutation.isPending,
    isDeleting: deleteTradeMutation.isPending,
  };
}
```

### Component Patterns
```typescript
// src/components/trades/TradeTable.tsx
import { useTrades } from '../../hooks/useTrades';
import { TradeRow } from './TradeRow';
import { TradeFilters } from '../../types/trade';

interface TradeTableProps {
  userId: string;
  filters?: TradeFilters;
}

export function TradeTable({ userId, filters }: TradeTableProps) {
  const { trades, isLoading, error, deleteTrade } = useTrades(userId, filters);

  if (isLoading) return <div>Loading trades...</div>;
  if (error) return <div>Error loading trades: {error.message}</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th>Date</th>
            <th>Asset</th>
            <th>Type</th>
            <th>Entry Price</th>
            <th>Exit Price</th>
            <th>Result</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {trades?.map(trade => (
            <TradeRow 
              key={trade.id} 
              trade={trade} 
              onDelete={deleteTrade} 
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### State Management
```typescript
// src/store/tradeStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface TradeState {
  trades: Trade[];
  filters: TradeFilters;
  isLoading: boolean;
  error: string | null;
  
  setTrades: (trades: Trade[]) => void;
  setFilters: (filters: Partial<TradeFilters>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTradeStore = create<TradeState>()(
  devtools(
    (set, get) => ({
      trades: [],
      filters: {},
      isLoading: false,
      error: null,

      setTrades: (trades) => set({ trades }),
      setFilters: (newFilters) => 
        set({ filters: { ...get().filters, ...newFilters } }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    { name: 'trade-store' }
  )
);
```

## Security Implementation

### Authentication Middleware
```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../database/prisma';

export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}
```

### Rate Limiting
```typescript
// src/middleware/rateLimiter.ts
import { rateLimiter } from 'rate-limiter-flexible';

const authRateLimiter = new rateLimiter.RateLimiterMemory({
  keyPrefix: 'auth',
  points: 5, // Number of requests
  duration: 60, // Per 60 seconds
});

const apiRateLimiter = new rateLimiter.RateLimiterMemory({
  keyPrefix: 'api',
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
});

export async function authRateLimit(req: Request, res: Response, next: NextFunction) {
  try {
    await authRateLimiter.consume(req.ip);
    next();
  } catch (rejRes: any) {
    res.status(429).json({
      error: 'Too many authentication attempts',
      retryAfter: Math.round(rejRes.msBeforeNext / 1000),
    });
  }
}

export async function apiRateLimit(req: Request, res: Response, next: NextFunction) {
  try {
    await apiRateLimiter.consume(req.ip);
    next();
  } catch (rejRes: any) {
    res.status(429).json({
      error: 'Too many API requests',
      retryAfter: Math.round(rejRes.msBeforeNext / 1000),
    });
  }
}
```

## Testing Strategy

### Unit Tests
```typescript
// src/services/trade.service.test.ts
import { TradeService } from './trade.service';
import { mockTradeRepository } from '../../__mocks__/repositories/trade.repository.mock';

describe('TradeService', () => {
  let tradeService: TradeService;

  beforeEach(() => {
    tradeService = new TradeService(mockTradeRepository);
  });

  describe('createTrade', () => {
    it('should create a trade successfully', async () => {
      const tradeData = {
        asset: 'EURUSD',
        tradeType: 'long' as const,
        entryPrice: 1.1000,
        exitPrice: 1.1050,
        resultValue: 50,
        resultType: 'win' as const,
        tradeDate: new Date(),
      };

      const result = await tradeService.createTrade('user-123', tradeData);

      expect(result).toMatchObject({
        userId: 'user-123',
        asset: 'EURUSD',
        tradeType: 'long',
      });
    });

    it('should validate trade data', async () => {
      const invalidTradeData = {
        asset: '',
        tradeType: 'invalid' as any,
      };

      await expect(
        tradeService.createTrade('user-123', invalidTradeData)
      ).rejects.toThrow('Invalid trade data');
    });
  });
});
```

### Integration Tests
```typescript
// src/integration/trades.integration.test.ts
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../database/prisma';

describe('Trades API Integration', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashedpassword',
        role: 'trader',
      },
    });

    userId = user.id;
    
    // Login to get token
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    
    authToken = response.body.data.token;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } });
  });

  describe('POST /api/trades', () => {
    it('should create a new trade', async () => {
      const tradeData = {
        asset: 'EURUSD',
        tradeType: 'long',
        entryPrice: 1.1000,
        exitPrice: 1.1050,
        resultValue: 50,
        resultType: 'win',
        tradeDate: new Date().toISOString(),
      };

      const response = await request(app)
        .post('/api/trades')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tradeData)
        .expect(201);

      expect(response.body.data).toMatchObject({
        asset: 'EURUSD',
        tradeType: 'long',
        resultType: 'win',
      });
    });

    it('should require authentication', async () => {
      const tradeData = {
        asset: 'EURUSD',
        tradeType: 'long',
        entryPrice: 1.1000,
      };

      await request(app)
        .post('/api/trades')
        .send(tradeData)
        .expect(401);
    });
  });
});
```

## Deployment Strategy

### Docker Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@db:5432/ams_trading
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - ./uploads:/app/uploads

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=ams_trading
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docs/database-schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  worker:
    build: .
    command: npm run worker
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@db:5432/ams_trading
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - ./uploads:/app/uploads

volumes:
  postgres_data:
  redis_data:
```

## Monitoring and Observability

### Logging Configuration
```typescript
// src/config/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'ams-trading-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export { logger };
```

### Error Tracking
```typescript
// src/utils/errorHandler.ts
import { logger } from '../config/logger';
import { captureException } from '@sentry/node';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Send error to Sentry in production
  if (process.env.NODE_ENV === 'production') {
    captureException(err);
  }

  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err instanceof AppError ? err.message : 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: {
      code: statusCode,
      message,
    },
  });
};
```

This implementation guide provides a comprehensive roadmap for building your AMS Trading Journal Web platform with best practices for scalability, security, and maintainability.