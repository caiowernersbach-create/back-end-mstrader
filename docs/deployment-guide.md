# AMS Trading Journal Web - Deployment Guide

## Environment Configuration

### Development Environment
```bash
# .env.development
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/ams_trading_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
```

### Production Environment
```bash
# .env.production
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@prod-db:5432/ams_trading
REDIS_URL=redis://prod-redis:6379
JWT_SECRET=your-production-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
SENTRY_DSN=your-sentry-dsn
```

## Infrastructure Setup

### Database Setup
```sql
-- Create database and user
CREATE DATABASE ams_trading;
CREATE USER ams_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE ams_trading TO ams_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ams_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ams_user;

-- Run schema migrations
psql -h localhost -U ams_user -d ams_trading -f docs/database-schema.sql
```

### Redis Setup
```bash
# Install Redis
sudo apt-get update
sudo apt-get install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf

# Set memory limit and persistence
maxmemory 2gb
maxmemory-policy allkeys-lru

# Restart Redis
sudo systemctl restart redis
```

## CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build application
      run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to production
      uses: appleboy/ssh-action@v0.1.4
      with:
        host: ${{ secrets.PRODUCTION_HOST }}
        username: ${{ secrets.PRODUCTION_USER }}
        key: ${{ secrets.PRODUCTION_SSH_KEY }}
        script: |
          cd /var/www/ams-trading
          git pull origin main
          npm ci --only=production
          npm run migrate
          npm run build
          pm2 reload ecosystem.config.js
```

### PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'ams-trading-api',
      script: 'dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/ams-trading/error.log',
      out_file: '/var/log/ams-trading/out.log',
      log_file: '/var/log/ams-tradio/combined.log',
      time: true,
      merge_logs: true,
    },
  ],
};
```

## Production Deployment Steps

### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Configure firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 2. Application Deployment
```bash
# Create application directory
sudo mkdir -p /var/www/ams-trading
sudo chown -R $USER:$USER /var/www/ams-trading

# Clone repository
cd /var/www/ams-trading
git clone https://github.com/your-org/ams-trading-web.git .
git checkout main

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Set up environment
cp .env.example .env
nano .env

# Run database migrations
npm run migrate

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 3. Nginx Configuration
```nginx
# /etc/nginx/sites-available/ams-trading
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    root /var/www/ams-trading/dist;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads
    location /uploads/ {
        alias /var/www/ams-trading/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### 4. SSL Certificate
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring and Maintenance

### Health Checks
```typescript
// src/controllers/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HttpHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
  ) {}

  @Get()
  check() {
    return this.health.check([
      () => this.http.pingCheck('database', 'postgresql://localhost:5432'),
      () => this.http.pingCheck('redis', 'redis://localhost:6379'),
    ]);
  }
}
```

### Log Rotation
```bash
# /etc/logrotate.d/ams-trading
/var/log/ams-trading/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload all
    endscript
}
```

### Backup Strategy
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/ams-trading"
DB_NAME="ams_trading"
DB_USER="ams_user"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Application backup
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz -C /var/www/ams-trading .

# Remove old backups (keep last 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

## Performance Optimization

### Database Optimization
```sql
-- Create indexes for common queries
CREATE INDEX idx_trades_user_date_result ON trades(user_id, trade_date, result_type);
CREATE INDEX idx_trades_asset_date ON trades(asset, trade_date);
CREATE INDEX idx_monthly_summaries_user_year ON monthly_summaries(user_id, year);

-- Analyze tables regularly
ANALYZE trades;
ANALYZE monthly_summaries;
ANALYZE calendar_stats;

-- Vacuum regularly
VACUUM trades;
VACUUM monthly_summaries;
VACUUM calendar_stats;
```

### Application Optimization
```typescript
// src/config/cache.ts
import { Cache } from 'cache-manager';

export class CacheService {
  constructor(private cache: Cache) {}

  async getTradeAnalytics(userId: string, period: string) {
    const cacheKey = `analytics:${userId}:${period}`;
    
    // Try to get from cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // If not in cache, calculate and store
    const analytics = await this.calculateAnalytics(userId, period);
    await this.cache.set(cacheKey, analytics, { ttl: 3600 }); // 1 hour
    
    return analytics;
  }

  private async calculateAnalytics(userId: string, period: string) {
    // Complex analytics calculation
    return { /* analytics data */ };
  }
}
```

This deployment guide provides a comprehensive approach to deploying your AMS Trading Journal Web platform in production with proper security, monitoring, and performance optimization.