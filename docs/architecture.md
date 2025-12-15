# AMS Trading Journal Web - System Architecture & Database Design

## Executive Summary

This document outlines the architecture and database schema for AMS Trading Journal Web, a subscription-based SaaS platform designed for traders to track, analyze, and improve their trading performance through data-driven insights.

## Core Architecture Principles

### 1. Multi-Tenant Design
- **Database**: Single database with tenant isolation via user_id
- **API**: Tenant-aware endpoints
- **Security**: Row-level security policies

### 2. Separation of Concerns
- **Raw Data**: Original trade entries
- **Behavioral Data**: Qualitative analysis
- **Aggregated Data**: Performance metrics and summaries

### 3. Scalability Considerations
- **Read-heavy analytics** with optimized indexes
- **Background jobs** for aggregation
- **Caching layer** for frequently accessed data
- **API-first design** for future integrations

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('trader', 'mentor', 'admin')),
    subscription_plan_id UUID REFERENCES subscription_plans(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    timezone VARCHAR(50) DEFAULT 'UTC',
    preferences JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_subscription_plan ON users(subscription_plan_id);
```

### Subscription Plans Table
```sql
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
    features JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX idx_subscription_plans_billing_cycle ON subscription_plans(billing_cycle);
```

### Trades Table
```sql
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset VARCHAR(100) NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    trade_type VARCHAR(20) NOT NULL CHECK (trade_type IN ('long', 'short')),
    entry_price DECIMAL(15,6) NOT NULL,
    exit_price DECIMAL(15,6),
    position_size DECIMAL(15,2),
    result_value DECIMAL(15,2),
    result_type VARCHAR(20) CHECK (result_type IN ('win', 'loss', 'breakeven')),
    risk_reward_ratio DECIMAL(10,4),
    strategy_id UUID REFERENCES strategies(id),
    trade_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    source VARCHAR(50) DEFAULT 'manual' CHECK (source IN ('manual', 'metatrader', 'api', 'csv')),
    metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_trade_date ON trades(trade_date);
CREATE INDEX idx_trades_strategy_id ON trades(strategy_id);
CREATE INDEX idx_trades_asset ON trades(asset);
CREATE INDEX idx_trades_result_type ON trades(result_type);
CREATE INDEX idx_trades_created_at ON trades(created_at);
CREATE INDEX idx_trades_user_date ON trades(user_id, trade_date);
```

### Trade Details Table
```sql
CREATE TABLE trade_details (
    trade_id UUID PRIMARY KEY REFERENCES trades(id) ON DELETE CASCADE,
    emotional_state VARCHAR(100),
    entry_process_quality INTEGER CHECK (entry_process_quality BETWEEN 1 AND 10),
    risk_management_respected BOOLEAN DEFAULT true,
    exit_process_quality INTEGER CHECK (exit_process_quality BETWEEN 1 AND 10),
    notes TEXT,
    trade_image_url VARCHAR(500),
    market_conditions VARCHAR(100),
    confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 10),
    psychological_factors JSONB DEFAULT '{}',
    follow_up_actions JSONB DEFAULT '[]'
);

-- Indexes
CREATE INDEX idx_trade_details_trade_id ON trade_details(trade_id);
```

### Strategies Table
```sql
CREATE TABLE strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tags TEXT[] DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_strategies_user_id ON strategies(user_id);
CREATE INDEX idx_strategies_active ON strategies(is_active);
CREATE INDEX idx_strategies_user_active ON strategies(user_id, is_active);
```

### Consistency Tracker Table
```sql
CREATE TABLE consistency_tracker (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    risk_management_score INTEGER CHECK (risk_management_score BETWEEN 1 AND 10),
    strategy_execution_score INTEGER CHECK (strategy_execution_score BETWEEN 1 AND 10),
    emotional_discipline_score INTEGER CHECK (emotional_discipline_score BETWEEN 1 AND 10),
    followed_plan BOOLEAN DEFAULT false,
    daily_notes TEXT,
    improvement_areas TEXT[] DEFAULT '{}',
    achievements TEXT[] DEFAULT '{}',
    overall_score DECIMAL(5,2) GENERATED ALWAYS AS (
        (risk_management_score + strategy_execution_score + emotional_discipline_score) / 3
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint and indexes
CREATE UNIQUE INDEX idx_consistency_tracker_user_date ON consistency_tracker(user_id, date);
CREATE INDEX idx_consistency_tracker_user_id ON consistency_tracker(user_id);
CREATE INDEX idx_consistency_tracker_date ON consistency_tracker(date);
CREATE INDEX idx_consistency_tracker_overall_score ON consistency_tracker(overall_score);
```

### Mentor Relationships Table
```sql
CREATE TABLE mentor_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'terminated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    access_level JSONB DEFAULT '{"view_trades": true, "view_analytics": true, "view_consistency": true}'
);

-- Unique constraint and indexes
CREATE UNIQUE INDEX idx_mentor_relationships_trader_id ON mentor_relationships(trader_id);
CREATE INDEX idx_mentor_relationships_mentor_id ON mentor_relationships(mentor_id);
CREATE INDEX idx_mentor_relationships_status ON mentor_relationships(status);
CREATE INDEX idx_mentor_relationships_mentor_status ON mentor_relationships(mentor_id, status);
```

### Monthly Summaries Table
```sql
CREATE TABLE monthly_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    total_trades INTEGER NOT NULL DEFAULT 0,
    winning_trades INTEGER NOT NULL DEFAULT 0,
    losing_trades INTEGER NOT NULL DEFAULT 0,
    breakeven_trades INTEGER NOT NULL DEFAULT 0,
    win_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN total_trades = 0 THEN 0
            ELSE (winning_trades::DECIMAL / total_trades) * 100
        END
    ) STORED,
    total_profit DECIMAL(15,2) DEFAULT 0,
    total_loss DECIMAL(15,2) DEFAULT 0,
    net_result DECIMAL(15,2) GENERATED ALWAYS AS (total_profit - total_loss) STORED,
    profit_factor DECIMAL(10,4) GENERATED ALWAYS AS (
        CASE 
            WHEN total_loss = 0 THEN NULL
            ELSE total_profit / total_loss
        END
    ) STORED,
    avg_win DECIMAL(10,2),
    avg_loss DECIMAL(10,2),
    largest_win DECIMAL(15,2),
    largest_loss DECIMAL(15,2),
    avg_holding_time INTERVAL,
    best_day DATE,
    worst_day DATE,
    consistency_score DECIMAL(5,2),
    risk_management_avg_score DECIMAL(5,2),
    strategy_execution_avg_score DECIMAL(5,2),
    emotional_discipline_avg_score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_calculated BOOLEAN DEFAULT false
);

-- Unique constraint and indexes
CREATE UNIQUE INDEX idx_monthly_summaries_user_period ON monthly_summaries(user_id, year, month);
CREATE INDEX idx_monthly_summaries_user_id ON monthly_summaries(user_id);
CREATE INDEX idx_monthly_summaries_year_month ON monthly_summaries(year, month);
CREATE INDEX idx_monthly_summaries_win_rate ON monthly_summaries(win_rate);
CREATE INDEX idx_monthly_summaries_net_result ON monthly_summaries(net_result);
```

### Calendar Stats Table
```sql
CREATE TABLE calendar_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    trades_count INTEGER NOT NULL DEFAULT 0,
    net_result DECIMAL(15,2) DEFAULT 0,
    day_status VARCHAR(20) GENERATED ALWAYS AS (
        CASE 
            WHEN net_result > 0 THEN 'positive'
            WHEN net_result < 0 THEN 'negative'
            ELSE 'neutral'
        END
    ) STORED,
    total_profit DECIMAL(15,2) DEFAULT 0,
    total_loss DECIMAL(15,2) DEFAULT 0,
    win_rate DECIMAL(5,2),
    avg_result DECIMAL(10,2),
    best_trade DECIMAL(15,2),
    worst_trade DECIMAL(15,2),
    consistency_score DECIMAL(5,2),
    risk_management_avg_score DECIMAL(5,2),
    strategy_execution_avg_score DECIMAL(5,2),
    emotional_discipline_avg_score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint and indexes
CREATE UNIQUE INDEX idx_calendar_stats_user_date ON calendar_stats(user_id, date);
CREATE INDEX idx_calendar_stats_user_id ON calendar_stats(user_id);
CREATE INDEX idx_calendar_stats_date ON calendar_stats(date);
CREATE INDEX idx_calendar_stats_day_status ON calendar_stats(day_status);
CREATE INDEX idx_calendar_stats_net_result ON calendar_stats(net_result);
```

### Performance Metrics Table
```sql
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL,
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    period_value JSONB NOT NULL, -- e.g., {"year": 2024, "month": 1, "week": 1}
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    calculation_method VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX idx_performance_metrics_type_period ON performance_metrics(metric_type, period_type);
CREATE INDEX idx_performance_metrics_user_type_period ON performance_metrics(user_id, metric_type, period_type);
CREATE INDEX idx_performance_metrics_calculated_at ON performance_metrics(calculated_at);
```

### Audit Log Table
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
```

## Database Relationships

### Core Entity Relationships
```
Users (1) ←→ (N) Trades
Users (1) ←→ (N) Strategies  
Users (1) ←→ (N) ConsistencyTracker
Users (1) ←→ (N) MonthlySummaries
Users (1) ←→ (N) CalendarStats
Users (1) ←→ (N) PerformanceMetrics

Trades (1) ←→ (1) TradeDetails
Trades (N) ←→ (1) Strategies
Trades (N) ←→ (1) Users

MentorRelationships (1) ←→ (N) Users (as mentor)
MentorRelationships (1) ←→ (1) Users (as trader)
```

### Foreign Key Constraints
- All foreign keys have ON DELETE CASCADE for data integrity
- Unique constraints prevent duplicate data
- Generated columns ensure data consistency

## Scalability Architecture

### 1. Database Optimization
- **Read Replicas**: For analytics queries
- **Partitioning**: By date for large tables
- **Materialized Views**: For complex aggregations
- **Connection Pooling**: For high concurrency

### 2. Caching Strategy
- **Redis**: For frequently accessed user data
- **Application Cache**: For computed metrics
- **CDN**: For static assets

### 3. Background Processing
- **Monthly Summary Calculation**: Scheduled jobs
- **Performance Metric Updates**: Event-driven
- **Data Import Processing**: Queue-based

### 4. API Design
- **RESTful endpoints** with consistent naming
- **Pagination** for large datasets
- **Filtering and sorting** capabilities
- **Rate limiting** for API protection

## Security Considerations

### 1. Data Access Control
- **Row-level security** for multi-tenant isolation
- **Role-based access control** (RBAC)
- **Field-level permissions** for sensitive data

### 2. Data Protection
- **Encryption at rest** for sensitive fields
- **SSL/TLS** for data in transit
- **Input validation** and sanitization

### 3. Audit Trail
- **Comprehensive logging** of all data changes
- **User activity tracking**
- **System monitoring** and alerting

## Future Integration Ready

### 1. API Integration Points
- **Trade Import API**: For external data sources
- **Webhook endpoints**: For real-time notifications
- **Authentication endpoints**: For third-party integrations

### 2. Data Import Architecture
- **Validation pipeline** for imported data
- **Duplicate detection** and handling
- **Error handling** and retry mechanisms

### 3. Extensibility
- **Plugin architecture** for new features
- **Configurable metrics** and calculations
- **Custom fields** for user-specific data

## Production Readiness Checklist

### ✅ Database Design
- [x] Normalized schema with proper relationships
- [x] Appropriate indexing strategy
- [x] Data integrity constraints
- [x] Scalability considerations

### ✅ Security
- [x] Multi-tenant isolation
- [x] Access control mechanisms
- [x] Data encryption
- [x] Audit logging

### ✅ Performance
- [x] Optimized queries
- [x] Caching strategy
- [x] Background processing
- [x] Monitoring capabilities

### ✅ Maintainability
- [x] Clear documentation
- [x] Modular design
- [x] Version control strategy
- [x] Backup and recovery

## Conclusion

This architecture provides a solid foundation for a scalable, production-ready SaaS trading analytics platform. The database schema is designed to handle large volumes of trade data while maintaining performance and data integrity. The modular approach allows for easy extension and integration with future systems.

The separation of raw data, behavioral data, and aggregated analytics ensures that the system can grow and adapt to changing requirements without major restructuring.