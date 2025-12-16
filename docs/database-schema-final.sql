-- AMS Trading Journal Web - Final Database Schema
-- Strictly enforced core data model rules for SaaS trading journal

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- =============================================
-- CORE ENTITIES
-- =============================================

-- USERS - Multi-role support (Trader, Mentor, Both)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email CITEXT UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    roles TEXT[] NOT NULL DEFAULT ARRAY['trader']::TEXT[],
    subscription_plan_id UUID REFERENCES subscription_plans(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    timezone VARCHAR(50) DEFAULT 'UTC',
    preferences JSONB DEFAULT '{}',
    email_verified BOOLEAN DEFAULT false,
    email_verification_token UUID,
    reset_password_token UUID,
    reset_password_expires TIMESTAMP WITH TIME ZONE
);

-- ACCOUNTS - User configuration entities (single source of truth for stop_value)
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_name VARCHAR(100) NOT NULL,
    stop_value DECIMAL(15,6) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    risk_model JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ASSETS - User-defined trading assets
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset_symbol VARCHAR(50) NOT NULL,
    market_type VARCHAR(50) DEFAULT 'forex',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, asset_symbol)
);

-- STRATEGIES - User-created trading strategies
CREATE TABLE strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    strategy_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TRADES - Core trading entity (strict ownership and field rules)
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id),
    asset_id UUID NOT NULL REFERENCES assets(id),
    strategy_id UUID REFERENCES strategies(id),
    trade_date TIMESTAMP WITH TIME ZONE NOT NULL,
    result_value DECIMAL(15,2) NOT NULL,
    result_type VARCHAR(20) NOT NULL CHECK (result_type IN ('win', 'loss', 'breakeven')),
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('long', 'short')),
    emotion VARCHAR(100) NOT NULL,
    risk DECIMAL(15,6) NOT NULL,
    notes TEXT,
    image_url VARCHAR(500),
    source VARCHAR(50) DEFAULT 'manual' CHECK (source IN ('manual', 'metatrader', 'api', 'csv')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- =============================================
-- SUPPORTING ENTITIES
-- =============================================

-- CONSISTENCY TRACKER - Daily discipline tracking
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

-- MENTOR RELATIONSHIPS - One mentor per student, multiple students per mentor
CREATE TABLE mentor_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'terminated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    UNIQUE(trader_id)  -- Enforces one mentor per student
);

-- PERFORMANCE METRICS - Computed metrics (not stored in trades)
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL,
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    period_value JSONB NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    calculation_method VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AUDIT LOGS - Comprehensive tracking
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

-- =============================================
-- SUBSCRIPTION SUPPORT
-- =============================================

-- SUBSCRIPTION PLANS
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

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_roles ON users USING GIN(roles);
CREATE INDEX idx_users_subscription_plan ON users(subscription_plan_id);
CREATE INDEX idx_users_active ON users(is_active);

-- Account indexes
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_active ON accounts(is_active);

-- Asset indexes
CREATE INDEX idx_assets_user_id ON assets(user_id);
CREATE INDEX idx_assets_active ON assets(is_active);
CREATE INDEX idx_assets_user_symbol ON assets(user_id, asset_symbol);

-- Strategy indexes
CREATE INDEX idx_strategies_user_id ON strategies(user_id);
CREATE INDEX idx_strategies_active ON strategies(is_active);

-- Trade indexes (core entity)
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_account_id ON trades(account_id);
CREATE INDEX idx_trades_asset_id ON trades(asset_id);
CREATE INDEX idx_trades_strategy_id ON trades(strategy_id);
CREATE INDEX idx_trades_trade_date ON trades(trade_date);
CREATE INDEX idx_trades_result_type ON trades(result_type);
CREATE INDEX idx_trades_direction ON trades(direction);
CREATE INDEX idx_trades_created_at ON trades(created_at);
CREATE INDEX idx_trades_user_date ON trades(user_id, trade_date);

-- Consistency tracker indexes
CREATE UNIQUE INDEX idx_consistency_tracker_user_date ON consistency_tracker(user_id, date);
CREATE INDEX idx_consistency_tracker_user_id ON consistency_tracker(user_id);
CREATE INDEX idx_consistency_tracker_date ON consistency_tracker(date);

-- Mentor relationship indexes
CREATE UNIQUE INDEX idx_mentor_relationships_trader_id ON mentor_relationships(trader_id);
CREATE INDEX idx_mentor_relationships_mentor_id ON mentor_relationships(mentor_id);
CREATE INDEX idx_mentor_relationships_status ON mentor_relationships(status);

-- Performance metrics indexes
CREATE INDEX idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX idx_performance_metrics_type_period ON performance_metrics(metric_type, period_type);
CREATE INDEX idx_performance_metrics_user_type_period ON performance_metrics(user_id, metric_type, period_type);

-- Audit log indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- =============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON strategies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consistency_tracker_updated_at BEFORE UPDATE ON consistency_tracker
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mentor_relationships_updated_at BEFORE UPDATE ON mentor_relationships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_metrics_updated_at BEFORE UPDATE ON performance_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS) - Multi-tenant isolation
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE consistency_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- User data access policies
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Account access policies
CREATE POLICY "Users can view their own accounts" ON accounts
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage their own accounts" ON accounts
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Asset access policies
CREATE POLICY "Users can view their own assets" ON assets
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage their own assets" ON assets
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Strategy access policies
CREATE POLICY "Users can view their own strategies" ON strategies
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage their own strategies" ON strategies
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Trade access policies (strict ownership)
CREATE POLICY "Users can view their own trades" ON trades
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage their own trades" ON trades
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Mentor access policies
CREATE POLICY "Mentors can view their students' trades" ON trades
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM mentor_relationships mr
            WHERE mr.mentor_id = auth.uid()::text
            AND mr.trader_id = trades.user_id
            AND mr.status = 'approved'
        )
    );

CREATE POLICY "Mentors can view their students' accounts" ON accounts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM mentor_relationships mr
            JOIN trades t ON t.account_id = accounts.id
            WHERE mr.mentor_id = auth.uid()::text
            AND t.user_id = accounts.user_id
            AND mr.status = 'approved'
        )
    );

CREATE POLICY "Mentors can view their students' assets" ON assets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM mentor_relationships mr
            JOIN trades t ON t.asset_id = assets.id
            WHERE mr.mentor_id = auth.uid()::text
            AND t.user_id = assets.user_id
            AND mr.status = 'approved'
        )
    );

CREATE POLICY "Mentors can view their students' strategies" ON strategies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM mentor_relationships mr
            JOIN trades t ON t.strategy_id = strategies.id
            WHERE mr.mentor_id = auth.uid()::text
            AND t.user_id = strategies.user_id
            AND mr.status = 'approved'
        )
    );

-- Consistency tracker access policies
CREATE POLICY "Users can view their own consistency data" ON consistency_tracker
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Mentors can view their students' consistency data" ON consistency_tracker
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM mentor_relationships mr
            WHERE mr.mentor_id = auth.uid()::text
            AND mr.trader_id = consistency_tracker.user_id
            AND mr.status = 'approved'
        )
    );

-- Mentor relationship access policies
CREATE POLICY "Users can view their mentor relationships" ON mentor_relationships
    FOR SELECT USING (
        auth.uid()::text = mentor_id::text OR auth.uid()::text = trader_id::text
    );

-- Performance metrics access policies
CREATE POLICY "Users can view their own performance metrics" ON performance_metrics
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Mentors can view their students' performance metrics" ON performance_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM mentor_relationships mr
            WHERE mr.mentor_id = auth.uid()::text
            AND mr.trader_id = performance_metrics.user_id
            AND mr.status = 'approved'
        )
    );

-- Audit log access policies
CREATE POLICY "Users can view their own audit logs" ON audit_logs
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- =============================================
-- VIEWS FOR DERIVED DATA (Calendar View)
-- =============================================

CREATE OR REPLACE VIEW calendar_view AS
SELECT 
    t.user_id,
    DATE(t.trade_date) AS date,
    COUNT(t.id) AS trades_count,
    SUM(t.result_value) AS total_result,
    CASE 
        WHEN SUM(t.result_value) > 0 THEN 'positive'
        WHEN SUM(t.result_value) < 0 THEN 'negative'
        ELSE 'neutral'
    END AS day_status,
    COUNT(CASE WHEN t.result_type = 'win' THEN 1 END) AS winning_trades,
    COUNT(CASE WHEN t.result_type = 'loss' THEN 1 END) AS losing_trades,
    COUNT(CASE WHEN t.result_type = 'breakeven' THEN 1 END) AS breakeven_trades
FROM trades t
WHERE t.is_active = true
GROUP BY t.user_id, DATE(t.trade_date)
ORDER BY t.user_id, date;

-- =============================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- =============================================

-- Function to get stop value from account (not stored in trades)
CREATE OR REPLACE FUNCTION get_account_stop_value(account_id UUID)
RETURNS DECIMAL(15,6) AS $$
DECLARE
    stop_value DECIMAL(15,6);
BEGIN
    SELECT stop_value INTO stop_value
    FROM accounts
    WHERE id = account_id AND is_active = true;
    
    RETURN COALESCE(stop_value, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate strategy performance (not stored)
CREATE OR REPLACE FUNCTION calculate_strategy_performance(strategy_id UUID, user_id UUID)
RETURNS TABLE (
    total_trades INTEGER,
    winning_trades INTEGER,
    losing_trades INTEGER,
    breakeven_trades INTEGER,
    win_rate DECIMAL(5,2),
    total_profit DECIMAL(15,2),
    total_loss DECIMAL(15,2),
    net_result DECIMAL(15,2),
    profit_factor DECIMAL(10,4),
    avg_win DECIMAL(10,2),
    avg_loss DECIMAL(10,2),
    largest_win DECIMAL(15,2),
    largest_loss DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(t.id) as total_trades,
        COUNT(CASE WHEN t.result_type = 'win' THEN 1 END) as winning_trades,
        COUNT(CASE WHEN t.result_type = 'loss' THEN 1 END) as losing_trades,
        COUNT(CASE WHEN t.result_type = 'breakeven' THEN 1 END) as breakeven_trades,
        CASE 
            WHEN COUNT(t.id) = 0 THEN 0
            ELSE (COUNT(CASE WHEN t.result_type = 'win' THEN 1 END)::DECIMAL / COUNT(t.id)) * 100
        END as win_rate,
        SUM(CASE WHEN t.result_type = 'win' THEN t.result_value ELSE 0 END) as total_profit,
        SUM(CASE WHEN t.result_type = 'loss' THEN ABS(t.result_value) ELSE 0 END) as total_loss,
        SUM(t.result_value) as net_result,
        CASE 
            WHEN SUM(CASE WHEN t.result_type = 'loss' THEN ABS(t.result_value) ELSE 0 END) = 0 
            THEN NULL 
            ELSE SUM(CASE WHEN t.result_type = 'win' THEN t.result_value ELSE 0 END) / 
                 SUM(CASE WHEN t.result_type = 'loss' THEN ABS(t.result_value) ELSE 0 END)
        END as profit_factor,
        CASE 
            WHEN COUNT(CASE WHEN t.result_type = 'win' THEN 1 END) = 0 THEN 0
            ELSE SUM(CASE WHEN t.result_type = 'win' THEN t.result_value ELSE 0 END) / 
                 COUNT(CASE WHEN t.result_type = 'win' THEN 1 END)
        END as avg_win,
        CASE 
            WHEN COUNT(CASE WHEN t.result_type = 'loss' THEN 1 END) = 0 THEN 0
            ELSE SUM(CASE WHEN t.result_type = 'loss' THEN ABS(t.result_value) ELSE 0 END) / 
                 COUNT(CASE WHEN t.result_type = 'loss' THEN 1 END)
        END as avg_loss,
        MAX(CASE WHEN t.result_type = 'win' THEN t.result_value ELSE 0 END) as largest_win,
        MAX(CASE WHEN t.result_type = 'loss' THEN ABS(t.result_value) ELSE 0 END) as largest_loss
    FROM trades t
    WHERE t.strategy_id = strategy_id 
      AND t.user_id = user_id 
      AND t.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate monthly performance (not stored)
CREATE OR REPLACE FUNCTION calculate_monthly_performance(user_id UUID, year INTEGER, month INTEGER)
RETURNS TABLE (
    total_trades INTEGER,
    winning_trades INTEGER,
    losing_trades INTEGER,
    breakeven_trades INTEGER,
    win_rate DECIMAL(5,2),
    total_profit DECIMAL(15,2),
    total_loss DECIMAL(15,2),
    net_result DECIMAL(15,2),
    profit_factor DECIMAL(10,4)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(t.id) as total_trades,
        COUNT(CASE WHEN t.result_type = 'win' THEN 1 END) as winning_trades,
        COUNT(CASE WHEN t.result_type = 'loss' THEN 1 END) as losing_trades,
        COUNT(CASE WHEN t.result_type = 'breakeven' THEN 1 END) as breakeven_trades,
        CASE 
            WHEN COUNT(t.id) = 0 THEN 0
            ELSE (COUNT(CASE WHEN t.result_type = 'win' THEN 1 END)::DECIMAL / COUNT(t.id)) * 100
        END as win_rate,
        SUM(CASE WHEN t.result_type = 'win' THEN t.result_value ELSE 0 END) as total_profit,
        SUM(CASE WHEN t.result_type = 'loss' THEN ABS(t.result_value) ELSE 0 END) as total_loss,
        SUM(t.result_value) as net_result,
        CASE 
            WHEN SUM(CASE WHEN t.result_type = 'loss' THEN ABS(t.result_value) ELSE 0 END) = 0 
            THEN NULL 
            ELSE SUM(CASE WHEN t.result_type = 'win' THEN t.result_value ELSE 0 END) / 
                 SUM(CASE WHEN t.result_type = 'loss' THEN ABS(t.result_value) ELSE 0 END)
        END as profit_factor
    FROM trades t
    WHERE t.user_id = user_id 
      AND EXTRACT(YEAR FROM t.trade_date) = year
      AND EXTRACT(MONTH FROM t.trade_date) = month
      AND t.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- CONSTRAINTS AND VALIDATION
-- =============================================

-- Ensure all users have at least the trader role
ALTER TABLE users ADD CONSTRAINT users_must_have_trader_role CHECK (
    ARRAY['trader'] <@ roles
);

-- Ensure accounts have positive stop values
ALTER TABLE accounts ADD CONSTRAINT accounts_stop_value_positive CHECK (
    stop_value > 0
);

-- Ensure trades have valid result values
ALTER TABLE trades ADD CONSTRAINT trades_result_value_check CHECK (
    result_value != 0
);

-- Ensure trades have valid risk values
ALTER TABLE trades ADD CONSTRAINT trades_risk_positive CHECK (
    risk > 0
);

-- Ensure mentor relationships are between valid users
ALTER TABLE mentor_relationships ADD CONSTRAINT mentor_relationship_valid_users CHECK (
    mentor_id != trader_id
);

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE users IS 'Users can be trader, mentor, or both. Roles are logical, not exclusive.';
COMMENT ON TABLE accounts IS 'User configuration entities. Single source of truth for stop_value.';
COMMENT ON TABLE assets IS 'User-defined trading assets. Referenced by trades via asset_id.';
COMMENT ON TABLE strategies IS 'User-created trading strategies. Group trades but do not own them.';
COMMENT ON TABLE trades IS 'Core trading entity. Strict ownership: every trade belongs to exactly one user.';
COMMENT ON TABLE consistency_tracker IS 'Daily discipline tracking based on 3 pillars of trading.';
COMMENT ON TABLE mentor_relationships IS 'One mentor per student, multiple students per mentor. Read-only access.';
COMMENT ON TABLE performance_metrics IS 'Computed metrics calculated dynamically from trades, not stored.';
COMMENT ON TABLE calendar_view IS 'Derived view aggregating trades by day. No data stored, computed dynamically.';