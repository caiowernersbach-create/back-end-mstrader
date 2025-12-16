-- =============================================
-- AJUSTES PARA A GESTÃO DE RISCO (RISK MANAGEMENT)
-- =============================================

-- Atualização da Tabela DE CONTAS (ACCOUNTS)
ALTER TABLE accounts ADD COLUMN daily_stop_limit DECIMAL(15,6) NOT NULL DEFAULT 500;
ALTER TABLE accounts ADD COLUMN stop_loss_per_trade DECIMAL(15,6) NOT NULL DEFAULT 100;

-- Garantir que os valores de stop diário e stop por trade sejam positivos
ALTER TABLE accounts ADD CONSTRAINT positive_stop_loss_per_trade CHECK (stop_loss_per_trade > 0);
ALTER TABLE accounts ADD CONSTRAINT positive_daily_stop_limit CHECK (daily_stop_limit > 0);

-- Atualização da Tabela DE OPERACOES (TRADES)
ALTER TABLE trades ADD COLUMN trade_out_of_risk BOOLEAN DEFAULT false;
ALTER TABLE trades ADD COLUMN risk_assessment JSONB DEFAULT '{}';

-- Acompanhamento do limite de risco diário
ALTER TABLE trades ADD CONSTRAINT check_daily_stop_limit CHECK (
    result_value <= (SELECT daily_stop_limit FROM accounts WHERE id = trades.account_id)
);

-- Atualizar a visão de risco diário
CREATE OR REPLACE VIEW daily_risk_view AS
SELECT 
    t.user_id,
    t.account_id,
    DATE(t.trade_date) AS trade_date,
    COUNT(t.id) AS trades_count,
    SUM(t.result_value) AS daily_result,
    CASE WHEN SUM(t.result_value) < -a.daily_stop_limit THEN true ELSE false END AS day_out_of_risk,
    a.stop_loss_per_trade,
    a.daily_stop_limit,
    a.account_name
FROM trades t
JOIN accounts a ON t.account_id = a.id
WHERE t.is_active = true
GROUP BY t.user_id, t.account_id, DATE(t.trade_date), a.stop_loss_per_trade, a.daily_stop_limit, a.account_name
ORDER BY t.user_id, t.account_id, trade_date;

-- Função para calcular se a operação está fora do risco
CREATE OR REPLACE FUNCTION calculate_trade_out_of_risk(trade_result DECIMAL, account_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    stop_loss DECIMAL(15,6);
BEGIN
    SELECT stop_loss_per_trade INTO stop_loss FROM accounts WHERE id = account_id AND is_active = true;
    RETURN trade_result < -stop_loss;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular o risco diário
CREATE OR REPLACE FUNCTION calculate_daily_out_of_risk(user_id UUID, account_id UUID, trade_date DATE)
RETURNS BOOLEAN AS $$
DECLARE
    daily_result DECIMAL(15,6);
    daily_stop_limit DECIMAL(15,6);
BEGIN
    -- Verificar o resultado diário
    SELECT COALESCE(SUM(t.result_value), 0) INTO daily_result
    FROM trades t
    WHERE t.user_id = user_id 
      AND t.account_id = account_id 
      AND DATE(t.trade_date) = trade_date
      AND t.is_active = true;

    -- Limite de stop diário
    SELECT daily_stop_limit INTO daily_stop_limit FROM accounts WHERE id = account_id AND is_active = true;

    -- Verifica se o resultado diário excedeu o limite
    RETURN daily_result < -daily_stop_limit;
END;
$$ LANGUAGE plpgsql;

-- Atualizar os indicadores de risco na operação
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

-- Atualização das Views para visualização de Risco
CREATE OR REPLACE VIEW user_account_risk_summary AS
SELECT 
    u.id AS user_id,
    u.name AS user_name,
    u.email,
    a.id AS account_id,
    a.account_name,
    a.stop_loss_per_trade,
    a.daily_stop_limit,
    COUNT(t.id) AS total_trades,
    SUM(t.result_value) AS total_result,
    -- Outros campos necessários para relatórios
    CASE WHEN COUNT(t.id) = 0 THEN 0 ELSE 
        (COUNT(CASE WHEN t.result_type = 'win' THEN 1 END)::DECIMAL / COUNT(t.id)) * 100
    END AS win_rate
FROM users u
JOIN accounts a ON u.id = a.user_id
LEFT JOIN trades t ON a.id = t.account_id AND t.is_active = true
WHERE u.is_active = true AND a.is_active = true
GROUP BY u.id, u.name, u.email, a.id, a.account_name, a.stop_loss_per_trade, a.daily_stop_limit
ORDER BY u.name, a.account_name;

-- =============================================
-- VIEWS ADICIONAIS PARA GESTÃO DE RISCO
-- =============================================

-- Visão de risco por operação individual
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
    CASE WHEN t.result_value < -a.stop_loss_per_trade THEN true ELSE false END AS calculated_trade_out_of_risk,
    a.stop_loss_per_trade,
    a.daily_stop_limit,
    a.account_name,
    t.notes,
    t.image_url
FROM trades t
JOIN accounts a ON t.account_id = a.id
WHERE t.is_active = true;

-- Visão de resumo de risco mensal
CREATE OR REPLACE VIEW monthly_risk_summary AS
SELECT 
    u.id AS user_id,
    u.name AS user_name,
    a.id AS account_id,
    a.account_name,
    EXTRACT(YEAR FROM t.trade_date) AS year,
    EXTRACT(MONTH FROM t.trade_date) AS month,
    COUNT(t.id) AS total_trades,
    SUM(t.result_value) AS monthly_result,
    COUNT(CASE WHEN t.trade_out_of_risk = true THEN 1 END) AS trades_out_of_risk,
    COUNT(CASE WHEN t.result_type = 'win' THEN 1 END) AS winning_trades,
    COUNT(CASE WHEN t.result_type = 'loss' THEN 1 END) AS losing_trades,
    COUNT(CASE WHEN t.result_type = 'breakeven' THEN 1 END) AS breakeven_trades,
    CASE WHEN COUNT(t.id) = 0 THEN 0 ELSE 
        (COUNT(CASE WHEN t.result_type = 'win' THEN 1 END)::DECIMAL / COUNT(t.id)) * 100
    END AS win_rate,
    CASE WHEN COUNT(DISTINCT DATE(t.trade_date)) = 0 THEN 0 ELSE 
        (COUNT(DISTINCT DATE(t.trade_date)) - 
         (SELECT COUNT(*) 
          FROM daily_risk_view drv 
          WHERE drv.user_id = u.id AND drv.account_id = a.id 
            AND drv.day_out_of_risk = true
            AND EXTRACT(YEAR FROM drv.trade_date) = EXTRACT(YEAR FROM t.trade_date)
            AND EXTRACT(MONTH FROM drv.trade_date) = EXTRACT(MONTH FROM t.trade_date)))::DECIMAL / 
         COUNT(DISTINCT DATE(t.trade_date)) * 100
    END AS risk_compliance_rate
FROM users u
JOIN accounts a ON u.id = a.user_id
JOIN trades t ON a.id = t.account_id AND t.is_active = true
WHERE u.is_active = true AND a.is_active = true
GROUP BY u.id, u.name, a.id, a.account_name, EXTRACT(YEAR FROM t.trade_date), EXTRACT(MONTH FROM t.trade_date)
ORDER BY u.name, a.account_name, year, month;

-- =============================================
-- FUNÇÕES ADICIONAIS PARA GESTÃO DE RISCO
-- =============================================

-- Função para obter dashboard de risco do usuário
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
        -- Sequência atual de dias dentro dos limites de risco
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
        -- Maior sequência de dias dentro dos limites de risco
        (SELECT MAX(streak_days)
         FROM (
             SELECT COUNT(*) as streak_days
             FROM daily_risk_view
             WHERE user_id = user_id AND account_id = a.id AND day_out_of_risk = false
             GROUP BY DATE(trade_date)
             ORDER BY streak_days DESC
             LIMIT 1
         ) as max_streak) as max_streak_days,
        -- Última data de violação de risco
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

-- Função para análise de risco mensal
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
                    AND EXTRACT(MONTH FROM drv.trade_date) = month) THEN 'melhorando'
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
                    AND EXTRACT(MONTH FROM drv.trade_date) = month) THEN 'estável'
            ELSE 'deteriorando'
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

-- Função para atualização automática de flags de risco
CREATE OR REPLACE FUNCTION update_all_risk_flags()
RETURNS VOID AS $$
BEGIN
    -- Atualizar flags de risco nas operações
    PERFORM update_trade_out_of_risk_flags();
    
    -- Atualizar flags de risco diário (se necessário)
    -- Esta função pode ser expandida para incluir atualizações de risco diário
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA DE RISCO
-- =============================================

-- Trigger para atualizar flags de risco quando uma operação é criada ou atualizada
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

-- Aplicar trigger à tabela de operações
CREATE TRIGGER update_trade_risk_on_change
BEFORE INSERT OR UPDATE ON trades
FOR EACH ROW EXECUTE FUNCTION update_trade_risk_on_change();

-- =============================================
-- ÍNDICES PARA PERFORMANCE DE GESTÃO DE RISCO
-- =============================================

-- Índices para visão de risco diário
CREATE INDEX idx_daily_risk_user_account_date ON daily_risk_view(user_id, account_id, trade_date);
CREATE INDEX idx_daily_risk_day_out_of_risk ON daily_risk_view(day_out_of_risk);
CREATE INDEX idx_daily_risk_user_date ON daily_risk_view(user_id, trade_date);

-- Índices para visão de risco por operação
CREATE INDEX idx_trade_risk_user_account ON trade_risk_view(user_id, account_id);
CREATE INDEX idx_trade_risk_out_of_risk ON trade_risk_view(trade_out_of_risk);
CREATE INDEX idx_trade_risk_date ON trade_risk_view(trade_date);

-- Índices para resumo de risco do usuário
CREATE INDEX idx_user_account_risk_user ON user_account_risk_summary(user_id);
CREATE INDEX idx_user_account_risk_account ON user_account_risk_summary(account_id);

-- =============================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =============================================

COMMENT ON COLUMN accounts.daily_stop_limit IS 'Limite máximo de perda diária. Valor obrigatório e positivo.';
COMMENT ON COLUMN accounts.stop_loss_per_trade IS 'Limite máximo de perda por operação. Valor obrigatório e positivo.';
COMMENT ON COLUMN trades.trade_out_of_risk IS 'Flag booleana indicando se a operação excedeu o limite de risco por operação.';
COMMENT ON COLUMN trades.risk_assessment IS 'Objeto JSON com detalhes da avaliação de risco e cálculos.';
COMMENT ON VIEW daily_risk_view IS 'Visão agregada de risco diário por usuário, conta e data.';
COMMENT ON VIEW trade_risk_view IS 'Visão de avaliação de risco individual por operação com limites de conta.';
COMMENT ON VIEW user_account_risk_summary IS 'Resumo abrangente de risco para contas de usuário.';
COMMENT ON VIEW monthly_risk_summary IS 'Resumo de risco mensal com taxas de conformidade e tendências.';
COMMENT ON FUNCTION calculate_trade_out_of_risk(trade_result DECIMAL, account_id UUID) IS 'Calcula se uma operação excedeu o limite de risco por operação.';
COMMENT ON FUNCTION calculate_daily_out_of_risk(user_id UUID, account_id UUID, trade_date DATE) IS 'Calcula se o resultado diário excedeu o limite de risco diário.';
COMMENT ON FUNCTION get_user_risk_dashboard(user_id UUID) IS 'Retorna dados abrangentes do dashboard de risco para um usuário.';
COMMENT ON FUNCTION get_monthly_risk_analysis(user_id UUID, year INTEGER, month INTEGER) IS 'Retorna análise de risco mensal com tendências e taxas de conformidade.';
COMMENT ON FUNCTION update_trade_out_of_risk_flags() IS 'Atualiza as flags de risco em todas as operações ativas.';
COMMENT ON FUNCTION update_all_risk_flags() IS 'Função principal para atualização completa de flags de risco.';
COMMENT ON FUNCTION update_trade_risk_on_change() IS 'Trigger para atualização automática de flags de risco ao criar ou atualizar operações.';