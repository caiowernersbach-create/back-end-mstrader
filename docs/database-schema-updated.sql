-- AMS Trading Journal Web - Updated Database Schema
-- Incorporating non-negotiable business rules and domain requirements

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable citext for case-insensitive email comparison
CREATE EXTENSION IF NOT EXISTS "citext";

-- Users Table - Updated to support multiple roles
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

-- Accounts Table - Configuration table for user accounts
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_name VARCHAR(100) NOT NULL,
    stop_value DECIMAL(15,6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Assets Table - Configuration table for trading assets
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset VARCHAR(100) NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    UNIQUE(user_id, asset)
);

-- Strategies Table - Updated to be created by users
CREATE TABLE strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tags TEXT[] DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50) DEFAULT 'trending-up'
);

-- Trades Table - Updated with mandatory fields and account reference
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id),
    asset_id UUID NOT NULL REFERENCES assets(id),
    trade_type VARCHAR(20) NOT NULL CHECK (trade_type IN ('long', 'short')),
    result_value DECIMAL(15,2) NOT NULL,
    result_type VARCHAR(20) NOT NULL CHECK (result_type IN ('win', 'loss', 'breakeven')),
    risk_reward_ratio DECIMAL(10,4),
    strategy_id UUID REFERENCES strategies(id),
    trade_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    source VARCHAR(50) DEFAULT 'manual' CHECK (source IN ('manual', 'metatrader', 'api', 'csv')),
    metadata JSONB DEFAULT '{}',
    fees DECIMAL(15,2) DEFAULT 0,
    swap DECIMAL(15,2) DEFAULT 0,
    commission DECIMAL(15,2) DEFAULT 0,
    -- Mandatory fields from business rules
    emotion VARCHAR(100),
    notes TEXT,
    image_url VARCHAR(500)
);

-- Trade Details Table - Updated to include additional mandatory fields
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
    follow_up_actions JSONB DEFAULT '[]',
    planning_quality INTEGER CHECK (planning_quality BETWEEN 1 AND 10),
    execution_quality INTEGER CHECK (execution_quality BETWEEN 1 AND 10),
    risk_assessment_quality INTEGER CHECK (risk_assessment_quality BETWEEN 1 AND 10)
);

-- Consistency Tracker Table - Updated to align with business rules
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

-- Mentor Relationships Table - Updated to reflect business rules
CREATE TABLE mentor_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'terminated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    access_level JSONB DEFAULT '{"view_trades": true, "view_analytics": true, "view_consistency": true}',
    requested_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES users(id)
);

-- Monthly Summaries Table - Updated to align with business rules
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
    is_calculated BOOLEAN DEFAULT false,
    calculation_method VARCHAR(50)
);

-- Performance Metrics Table - Updated to align with business rules
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

-- Audit Log Table - Updated to align with business rules
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
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_roles ON users USING GIN(roles);
CREATE INDEX idx_users_subscription_plan ON users(subscription_plan_id);
CREATE INDEX idx_users_active ON users(is_active);

CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX idx_subscription_plans_billing_cycle ON subscription_plans(billing_cycle);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_active ON accounts(is_active);

CREATE INDEX idx_assets_user_id ON assets(user_id);
CREATE INDEX idx_assets_active ON assets(is_active);
CREATE INDEX idx_assets_user_asset ON assets(user_id, asset);

CREATE INDEX idx_strategies_user_id ON strategies(user_id);
CREATE INDEX idx_strategies_active ON strategies(is_active);
CREATE INDEX idx_strategies_user_active ON strategies(user_id, is_active);

CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_account_id ON trades(account_id);
CREATE INDEX idx_trades_asset_id ON trades(asset_id);
CREATE INDEX idx_trades_strategy_id ON trades(strategy_id);
CREATE INDEX idx_trades_trade_date ON trades(trade_date);
CREATE INDEX idx_trades_result_type ON trades(result_type);
CREATE INDEX idx_trades_created_at ON trades(created_at);
CREATE INDEX idx_trades_user_date ON trades(user_id, trade_date);
CREATE INDEX idx_trades_source ON trades(source);

CREATE INDEX idx_trade_details_trade_id ON trade_details(trade_id);

CREATE UNIQUE INDEX idx_consistency_tracker_user_date ON consistency_tracker(user_id, date);
CREATE INDEX idx_consistency_tracker_user_id ON consistency_tracker(user_id);
CREATE INDEX idx_consistency_tracker_date ON consistency_tracker(date);
CREATE INDEX idx_consistency_tracker_overall_score ON consistency_tracker(overall_score);

CREATE UNIQUE INDEX idx_mentor_relationships_trader_id ON mentor_relationships(trader_id);
CREATE INDEX idx_mentor_relationships_mentor_id ON mentor_relationships(mentor_id);
CREATE INDEX idx_mentor_relationships_status ON mentor_relationships(status);
CREATE INDEX idx_mentor_relationships_mentor_status ON mentor_relationships(mentor_id, status);

CREATE UNIQUE INDEX idx_monthly_summaries_user_period ON monthly_summaries(user_id, year, month);
CREATE INDEX idx_monthly_summaries_user_id ON monthly_summaries(user_id);
CREATE INDEX idx_monthly_summaries_year_month ON monthly_summaries(year, month);
CREATE INDEX idx_monthly_summaries_win_rate ON monthly_summaries(win_rate);
CREATE INDEX idx_monthly_summaries_net_result ON monthly_summaries(net_result);

CREATE INDEX idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX idx_performance_metrics_type_period ON performance_metrics(metric_type, period_type);
CREATE INDEX idx_performance_metrics_user_type_period ON performance_metrics(user_id, metric_type, period_type);
CREATE INDEX idx_performance_metrics_calculated_at ON performance_metrics(calculated_at);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
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

CREATE TRIGGER update_monthly_summaries_updated_at BEFORE UPDATE ON monthly_summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) setup
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE consistency_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can view their own accounts" ON accounts
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own accounts" ON accounts
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own accounts" ON accounts
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own accounts" ON accounts
    FOR DELETE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their own assets" ON assets
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own assets" ON assets
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own assets" ON assets
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own assets" ON assets
    FOR DELETE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their own strategies" ON strategies
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own strategies" ON strategies
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own strategies" ON strategies
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own strategies" ON strategies
    FOR DELETE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their own trades" ON trades
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own trades" ON trades
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own trades" ON trades
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own trades" ON trades
    FOR DELETE USING (auth.uid()::text = user_id::text);

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

-- Similar policies for other tables...