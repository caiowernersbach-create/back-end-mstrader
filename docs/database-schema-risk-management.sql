-- AMS Trading Journal Web - Risk Management Schema Updates
-- Professional risk management rules for accounts and trades

-- =============================================
-- RISK MANAGEMENT UPDATES
-- =============================================

-- Update ACCOUNTS table with risk management fields
ALTER TABLE accounts ADD COLUMN stop_loss_per_trade DECIMAL(15,6) NOT NULL DEFAULT 100;
ALTER TABLE accounts ADD COLUMN daily_stop_limit DECIMAL(15,6) NOT NULL DEFAULT 500;

-- Add constraints for positive values
ALTER TABLE accounts ADD CONSTRAINT accounts_stop_loss_per_trade_positive CHECK (
    stop_loss_per_trade > 0
);

ALTER TABLE accounts ADD CONSTRAINT accounts_daily_stop_limit_positive CHECK (
    daily_stop_limit > 0
);

-- Update TRADES table with risk validation fields
ALTER TABLE trades ADD COLUMN trade_out_of_risk BOOLEAN DEFAULT false;
ALTER TABLE trades ADD COLUMN risk_assessment JSONB DEFAULT '{}';

-- Add constraint for trade result validation
ALTER TABLE trades ADD CONSTRAINT trades_result_range CHECK (
    result_value >= -999999.99 AND result_value <= 999999.99
);

-- =============================================
-- VIEWS FOR RISK MANAGEMENT
-- =============================================

-- Daily Risk View - Aggregated by user, account, and date
CREATE OR REPLACE VIEW daily_risk_view AS
SELECT 
    t.user_id,
    t.account_id,
    DATE(t.trade_date) AS trade_date,
    COUNT(t.id) AS trades_count,
    SUM(t.result_value) AS daily_result,
    CASE 
        WHEN SUM(t.result_value) < -a.daily_stop_limit THEN true
        ELSE false
    END AS day_out_of_risk,
    SUM(CASE WHEN t.result_type = 'win' THEN t.result_value ELSE 0 END) AS total_profit,
    SUM(CASE WHEN t.result_type = 'loss' THEN ABS(t.result_value) ELSE 0 END) AS total_loss,
    COUNT(CASE WHEN t.result_type = 'win' THEN 1 END) AS winning_trades,
    COUNT(CASE WHEN t.result_type = 'loss' THEN 1 END) AS losing_trades,
    COUNT(CASE WHEN t.result_type = 'breakeven' THEN 1 END) AS breakeven_trades,
    a.stop_loss_per_trade,
    a.daily_stop_limit,
    a.account_name
FROM trades t
JOIN accounts a ON t.account_id = a.id
WHERE t.is_active = true
GROUP BY t.user_id, t.account_id, DATE(t.trade_date), a.stop_loss_per_trade, a.daily_stop_limit, a.account_name
ORDER BY t.user_id, t.account_id, trade_date;

-- Trade Risk View - Individual trade risk assessment
CREATE OR REPLACE VIEW trade_risk_view AS
SELECT 
    t.id,
    t.user_id,
    t.account_id,
    t.trade_date,
    t.result_value,
    t.result_type,
    t.direction,
    t.emotion,
    t.risk,
    t.trade_out_of_risk,
    CASE 
        WHEN t.result_value < -a.stop_loss_per_trade THEN true
        ELSE false
    END AS calculated_trade_out_of_risk,
    a.stop_loss_per_trade,
    a.daily_stop_limit,
    a.account_name,
    t.notes,
    t.image_url
FROM trades t
JOIN accounts a ON t.account_id = a.id
WHERE t.is_active = true;

-- User Account Risk Summary View
CREATE OR REPLACE VIEW user_account_risk_summary AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.email,
    a.id as account_id,
    a.account_name,
    a.stop_loss_per_trade,
    a.daily_stop_limit,
    a.currency,
    COUNT(t.id) as total_trades,
    SUM(t.result_value) as total_result,
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
    COUNT(CASE WHEN t.trade_out_of_risk = true THEN 1 END) as trades_out_of_risk_count,
    COUNT(CASE WHEN t.trade_out_of_risk = true AND t.result_type = 'loss' THEN 1 END) as losing_trades_out_of_risk,
    (SELECT COUNT(*) 
     FROM daily_risk_view drv 
     WHERE drv.user_id = u.id AND drv.account_id = a.id AND drv.day_out_of_risk = true) as days_out_of_risk_count
FROM users u
JOIN accounts a ON u.id = a.user_id
LEFT JOIN trades t ON a.id = t.account_id AND t.is_active = true
WHERE u.is_active = true AND a.is_active = true
GROUP BY u.id, u.name, u.email, a.id, a.account_name, a.stop_loss_per_trade, a.daily_stop_limit, a.currency
ORDER BY u.name, a.account_name;

-- =============================================
-- FUNCTIONS FOR RISK CALCULATIONS
-- =============================================

-- Function to calculate trade out of risk
CREATE OR REPLACE FUNCTION calculate_trade_out_of_risk(trade_result DECIMAL, account_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    stop_loss DECIMAL(15,6);
BEGIN
    SELECT stop_loss_per_trade INTO stop_loss
    FROM accounts
    WHERE id = account_id AND is_active = true;
    
    RETURN trade_result < -stop_loss;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate daily out of risk
CREATE OR REPLACE FUNCTION calculate_daily_out_of_risk(user_id UUID, account_id UUID, trade_date DATE)
RETURNS BOOLEAN AS $$
DECLARE
    daily_result DECIMAL(15,6);
    daily_stop_limit DECIMAL(15,6);
BEGIN
    -- Get daily result
    SELECT COALESCE(SUM(t.result_value), 0) INTO daily_result
    FROM trades t
    WHERE t.user_id = user_id 
      AND t.account_id = account_id 
      AND DATE(t.trade_date) = trade_date
      AND t.is_active = true;
    
    -- Get daily stop limit
    SELECT daily_stop_limit INTO daily_stop_limit
    FROM accounts
    WHERE id = account_id AND is_active = true;
    
    RETURN daily_result < -daily_stop_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to update trade out of risk flag
CREATE OR REPLACE FUNCTION update_trade_out_of_risk_flags()
RETURNS VOID AS $$
BEGIN
    UPDATE trades
    SET trade_out_of_risk = calculate_trade_out_of_risk(result_value, account_id),
        risk_assessment = jsonb_build_object(
            'calculated_at', NOW(),
            'stop_loss_per_trade', (SELECT stop_loss_per_trade FROM accounts WHERE id = trades.account_id),
            'trade_result', result_value,
            'is_out_of_risk', calculate_trade_out_of_risk(result_value, trades.account_id)
        )
    WHERE is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's risk dashboard data
CREATE OR REPLACE FUNCTION get_user_risk_dashboard(user_id UUID)
RETURNS TABLE (
    account_id UUID,
    account_name VARCHAR(100),
    stop_loss_per_trade DECIMAL(15,6),
    daily_stop_limit DECIMAL(15,6),
    total_trades INTEGER,
    trades_out_of_risk INTEGER,
    days_out_of_risk INTEGER,
    current_streak_days INTEGER,
    max_streak_days INTEGER,
    last_risk_violation_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.account_name,
        a.stop_loss_per_trade,
        a.daily_stop_limit,
        COUNT(t.id) as total_trades,
        COUNT(CASE WHEN t.trade_out_of_risk = true THEN 1 END) as trades_out_of_risk,
        (SELECT COUNT(*) 
         FROM daily_risk_view drv 
         WHERE drv.user_id = user_id AND drv.account_id = a.id AND drv.day_out_of_risk = true) as days_out_of_risk,
        -- Current streak of days within risk limits
        (SELECT COUNT(*) 
         FROM (
             SELECT DATE(trade_date) as date
             FROM daily_risk_view
             WHERE user_id = user_id AND account_id = a.id AND day_out_of_risk = false
             ORDER BY date DESC
             LIMIT 1
         ) as recent_risk_violation
         CROSS JOIN LATERAL (
             SELECT COUNT(*) as streak
             FROM daily_risk_view
             WHERE user_id = user_id AND account_id = a.id 
               AND day_out_of_risk = false
               AND date > recent_risk_violation.date
             ORDER BY date ASC
         ) as streak_calc) as current_streak_days,
        -- Maximum streak of days within risk limits
        (SELECT MAX(streak_days)
         FROM (
             SELECT COUNT(*) as streak_days
             FROM daily_risk_view
             WHERE user_id = user_id AND account_id = a.id AND day_out_of_risk = false
             GROUP BY DATE(trade_date)
             ORDER BY streak_days DESC
             LIMIT 1
         ) as max_streak) as max_streak_days,
        -- Last risk violation date
        (SELECT MAX(trade_date)
         FROM daily_risk_view
         WHERE user_id = user_id AND account_id = a.id AND day_out_of_risk = true
         LIMIT 1) as last_risk_violation_date
    FROM accounts a
    LEFT JOIN trades t ON a.id = t.account_id AND t.is_active = true
    WHERE a.user_id = user_id AND a.is_active = true
    GROUP BY a.id, a.account_name, a.stop_loss_per_trade, a.daily_stop_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get monthly risk analysis
CREATE OR REPLACE FUNCTION get_monthly_risk_analysis(user_id UUID, year INTEGER, month INTEGER)
RETURNS TABLE (
    account_id UUID,
    account_name VARCHAR(100),
    month_total_result DECIMAL(15,2),
    month_trades_out_of_risk INTEGER,
    month_days_out_of_risk INTEGER,
    risk_compliance_rate DECIMAL(5,2),
    avg_daily_result DECIMAL(15,2),
    max_daily_loss DECIMAL(15,2),
    risk_violation_trend VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.account_name,
        COALESCE(SUM(t.result_value), 0) as month_total_result,
        COUNT(CASE WHEN t.trade_out_of_risk = true THEN 1 END) as month_trades_out_of_risk,
        (SELECT COUNT(*) 
         FROM daily_risk_view drv 
         WHERE drv.user_id = user_id AND drv.account_id = a.id 
           AND drv.day_out_of_risk = true
           AND EXTRACT(YEAR FROM drv.trade_date) = year
           AND EXTRACT(MONTH FROM drv.trade_date) = month) as month_days_out_of_risk,
        CASE 
            WHEN COUNT(DISTINCT DATE(t.trade_date)) = 0 THEN 0
            ELSE (COUNT(DISTINCT DATE(t.trade_date)) - 
                  (SELECT COUNT(*) 
                   FROM daily_risk_view drv 
                   WHERE drv.user_id = user_id AND drv.account_id = a.id 
                     AND drv.day_out_of_risk = true
                     AND EXTRACT(YEAR FROM drv.trade_date) = year
                     AND EXTRACT(MONTH FROM drv.trade_date) = month))::DECIMAL / 
                 COUNT(DISTINCT DATE(t.trade_date)) * 100
        END as risk_compliance_rate,
        CASE 
            WHEN COUNT(DISTINCT DATE(t.trade_date)) = 0 THEN 0
            ELSE SUM(t.result_value) / COUNT(DISTINCT DATE(t.trade_date))
        END as avg_daily_result,
        MIN(SUM(t.result_value)) OVER (PARTITION BY DATE(t.trade_date)) as max_daily_loss,
        CASE 
            WHEN (SELECT COUNT(*) 
                  FROM daily_risk_view drv 
                  WHERE drv.user_id = user_id AND drv.account_id = a.id 
                    AND drv.day_out_of_risk = true
                    AND EXTRACT(YEAR FROM drv.trade_date) = year
                    AND EXTRACT(MONTH FROM drv.trade_date) = month) > 
                 (SELECT COUNT(*) 
                  FROM daily_risk_view drv 
                  WHERE drv.user_id = user_id AND drv.account_id = a.id 
                    AND drv.day_out_of_risk = false
                    AND EXTRACT(YEAR FROM drv.trade_date) = year
                    AND EXTRACT(MONTH FROM drv.trade_date) = month) THEN 'improving'
            WHEN (SELECT COUNT(*) 
                  FROM daily_risk_view drv 
                  WHERE drv.user_id = user_id AND drv.account_id = a.id 
                    AND drv.day_out_of_risk = true
                    AND EXTRACT(YEAR FROM drv.trade_date) = year
                    AND EXTRACT(MONTH FROM drv.trade_date) = month) = 
                 (SELECT COUNT(*) 
                  FROM daily_risk_view drv 
                  WHERE drv.user_id = user_id AND drv.account_id = a.id 
                    AND drv.day_out_of_risk = false
                    AND EXTRACT(YEAR FROM drv.trade_date) = year
                    AND EXTRACT(MONTH FROM drv.trade_date) = month) THEN 'stable'
            ELSE 'declining'
        END as risk_violation_trend
    FROM accounts a
    LEFT JOIN trades t ON a.id = t.account_id 
      AND t.is_active = true
      AND EXTRACT(YEAR FROM t.trade_date) = year
      AND EXTRACT(MONTH FROM t.trade_date) = month
    WHERE a.user_id = user_id AND a.is_active = true
    GROUP BY a.id, a.account_name;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS FOR AUTOMATIC RISK CALCULATIONS
-- =============================================

-- Trigger to update trade out of risk flags when trade is created or updated
CREATE OR REPLACE FUNCTION update_trade_risk_on_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        NEW.trade_out_of_risk = calculate_trade_out_of_risk(NEW.result_value, NEW.account_id);
        NEW.risk_assessment = jsonb_build_object(
            'calculated_at', NOW(),
            'stop_loss_per_trade', (SELECT stop_loss_per_trade FROM accounts WHERE id = NEW.account_id),
            'trade_result', NEW.result_value,
            'is_out_of_risk', calculate_trade_out_of_risk(NEW.result_value, NEW.account_id)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to trades table
CREATE TRIGGER update_trade_risk_on_change
BEFORE INSERT OR UPDATE ON trades
FOR EACH ROW EXECUTE FUNCTION update_trade_risk_on_change();

-- =============================================
-- INDEXES FOR RISK MANAGEMENT PERFORMANCE
-- =============================================

-- Indexes for daily risk view
CREATE INDEX idx_daily_risk_user_account_date ON daily_risk_view(user_id, account_id, trade_date);
CREATE INDEX idx_daily_risk_day_out_of_risk ON daily_risk_view(day_out_of_risk);
CREATE INDEX idx_daily_risk_user_date ON daily_risk_view(user_id, trade_date);

-- Indexes for trade risk view
CREATE INDEX idx_trade_risk_user_account ON trade_risk_view(user_id, account_id);
CREATE INDEX idx_trade_risk_out_of_risk ON trade_risk_view(trade_out_of_risk);
CREATE INDEX idx_trade_risk_date ON trade_risk_view(trade_date);

-- Indexes for user account risk summary
CREATE INDEX idx_user_account_risk_user ON user_account_risk_summary(user_id);
CREATE INDEX idx_user_account_risk_account ON user_account_risk_summary(account_id);

-- =============================================
-- COMMENTS FOR RISK MANAGEMENT
-- =============================================

COMMENT ON COLUMN accounts.stop_loss_per_trade IS 'Maximum loss allowed per trade. Mandatory positive value.';
COMMENT ON COLUMN accounts.daily_stop_limit IS 'Maximum daily loss limit. Mandatory positive value.';
COMMENT ON COLUMN trades.trade_out_of_risk IS 'Boolean flag indicating if trade exceeded stop loss per trade.';
COMMENT ON COLUMN trades.risk_assessment IS 'JSON object containing risk assessment details and calculations.';
COMMENT ON VIEW daily_risk_view IS 'Aggregated daily risk data by user, account, and date.';
COMMENT ON VIEW trade_risk_view IS 'Individual trade risk assessment with account risk limits.';
COMMENT ON VIEW user_account_risk_summary IS 'Comprehensive risk summary for user accounts.';
COMMENT ON FUNCTION calculate_trade_out_of_risk(trade_result DECIMAL, account_id UUID) IS 'Calculates if a trade exceeded the account stop loss per trade limit.';
COMMENT ON FUNCTION calculate_daily_out_of_risk(user_id UUID, account_id UUID, trade_date DATE) IS 'Calculates if daily result exceeded the account daily stop limit.';
COMMENT ON FUNCTION get_user_risk_dashboard(user_id UUID) IS 'Returns comprehensive risk dashboard data for a user.';
COMMENT ON FUNCTION get_monthly_risk_analysis(user_id UUID, year INTEGER, month INTEGER) IS 'Returns monthly risk analysis with trends and compliance rates.';