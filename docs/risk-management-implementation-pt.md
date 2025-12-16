# AMS Trading Journal Web - Guia de Implementação de Gestão de Risco

## Regras Profissionais de Gestão de Risco

### 1. Atualização da Tabela de Contas (ACCOUNTS)

#### Mudanças no Esquema:
```sql
-- Atualização da Tabela DE CONTAS (ACCOUNTS)
ALTER TABLE accounts ADD COLUMN daily_stop_limit DECIMAL(15,6) NOT NULL DEFAULT 500;
ALTER TABLE accounts ADD COLUMN stop_loss_per_trade DECIMAL(15,6) NOT NULL DEFAULT 100;

-- Garantir que os valores de stop diário e stop por trade sejam positivos
ALTER TABLE accounts ADD CONSTRAINT positive_stop_loss_per_trade CHECK (stop_loss_per_trade > 0);
ALTER TABLE accounts ADD CONSTRAINT positive_daily_stop_limit CHECK (daily_stop_limit > 0);
```

#### Lógica de Implementação:
```typescript
// src/services/account.service.ts
export class AccountService {
  async createAccount(userId: string, accountData: CreateAccountDto) {
    // Validar campos de gestão de risco
    if (!accountData.dailyStopLimit || accountData.dailyStopLimit <= 0) {
      throw new Error('O limite de stop diário deve ser um número positivo');
    }

    if (!accountData.stopLossPerTrade || accountData.stopLossPerTrade <= 0) {
      throw new Error('O limite de stop por operação deve ser um número positivo');
    }

    return this.prisma.account.create({
      data: {
        ...accountData,
        userId,
      },
    });
  }

  async updateAccountRiskSettings(accountId: string, riskSettings: UpdateAccountRiskDto) {
    return this.prisma.account.update({
      where: { id: accountId },
      data: {
        dailyStopLimit: riskSettings.dailyStopLimit,
        stopLossPerTrade: riskSettings.stopLossPerTrade,
      },
    });
  }

  async getAccountRiskSettings(accountId: string) {
    return this.prisma.account.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        accountName: true,
        stopLossPerTrade: true,
        dailyStopLimit: true,
        currency: true,
      },
    });
  }
}
```

### 2. Atualização da Tabela de Operações (TRADES)

#### Mudanças no Esquema:
```sql
-- Atualização da Tabela DE OPERACOES (TRADES)
ALTER TABLE trades ADD COLUMN trade_out_of_risk BOOLEAN DEFAULT false;
ALTER TABLE trades ADD COLUMN risk_assessment JSONB DEFAULT '{}';

-- Acompanhamento do limite de risco diário
ALTER TABLE trades ADD CONSTRAINT check_daily_stop_limit CHECK (
    result_value <= (SELECT daily_stop_limit FROM accounts WHERE id = trades.account_id)
);
```

#### Lógica de Implementação:
```typescript
// src/services/trade.service.ts
export class TradeService {
  async createTrade(userId: string, tradeData: CreateTradeDto) {
    // Validar todos os campos obrigatórios
    this.validateTradeData(tradeData);

    // Obter configuração de conta para cálculos de risco
    const account = await this.prisma.account.findUnique({
      where: { id: tradeData.accountId },
      select: { 
        dailyStopLimit: true, 
        stopLossPerTrade: true,
        currency: true 
      },
    });

    if (!account) {
      throw new Error('Conta não encontrada');
    }

    // Calcular flag de risco da operação
    const tradeOutOfRisk = this.calculateTradeOutOfRisk(
      tradeData.resultValue,
      account.stopLossPerTrade
    );

    // Criar operação com avaliação de risco
    return this.prisma.trade.create({
      data: {
        ...tradeData,
        userId,
        tradeOutOfRisk,
        riskAssessment: this.buildRiskAssessment(
          tradeData.resultValue,
          account.stopLossPerTrade,
          account.dailyStopLimit
        ),
      },
    });
  }

  private calculateTradeOutOfRisk(resultValue: number, stopLossPerTrade: number): boolean {
    return resultValue < -stopLossPerTrade;
  }

  private buildRiskAssessment(
    resultValue: number,
    stopLossPerTrade: number,
    dailyStopLimit: number
  ): any {
    return {
      calculatedAt: new Date(),
      stopLossPerTrade,
      dailyStopLimit,
      tradeResult: resultValue,
      isOutOfRisk: this.calculateTradeOutOfRisk(resultValue, stopLossPerTrade),
      riskLevel: this.calculateRiskLevel(resultValue, stopLossPerTrade),
    };
  }

  private calculateRiskLevel(resultValue: number, stopLossPerTrade: number): string {
    const riskRatio = Math.abs(resultValue) / stopLossPerTrade;
    
    if (riskRatio <= 0.5) return 'baixo';
    if (riskRatio <= 1.0) return 'médio';
    if (riskRatio <= 2.0) return 'alto';
    return 'crítico';
  }

  async getTradeRiskAnalysis(tradeId: string) {
    const trade = await this.prisma.trade.findUnique({
      where: { id: tradeId },
      include: {
        account: {
          select: {
            stopLossPerTrade: true,
            dailyStopLimit: true,
            currency: true,
          },
        },
      },
    });

    if (!trade) {
      throw new Error('Operação não encontrada');
    }

    return {
      ...trade,
      isOutOfRisk: this.calculateTradeOutOfRisk(
        trade.resultValue,
        trade.account.stopLossPerTrade
      ),
      riskLevel: this.calculateRiskLevel(
        trade.resultValue,
        trade.account.stopLossPerTrade
      ),
    };
  }
}
```

### 3. Validação de Risco da Operação

#### Implementação da Função de Banco de Dados:
```sql
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
```

#### Lógica de Implementação:
```typescript
// src/services/risk.service.ts
export class RiskService {
  async calculateTradeRisk(tradeId: string) {
    const trade = await this.prisma.trade.findUnique({
      where: { id: tradeId },
      include: {
        account: true,
      },
    });

    if (!trade) {
      throw new Error('Operação não encontrada');
    }

    const isOutOfRisk = trade.resultValue < -trade.account.stopLossPerTrade;

    return {
      tradeId,
      isOutOfRisk,
      stopLossPerTrade: trade.account.stopLossPerTrade,
      tradeResult: trade.resultValue,
      riskRatio: Math.abs(trade.resultValue) / trade.account.stopLossPerTrade,
    };
  }

  async batchUpdateTradeRiskFlags() {
    const trades = await this.prisma.trade.findMany({
      where: { is_active: true },
      include: {
        account: {
          select: { stopLossPerTrade: true },
        },
      },
    });

    const updates = trades.map(trade => ({
      id: trade.id,
      tradeOutOfRisk: trade.resultValue < -trade.account.stopLossPerTrade,
      riskAssessment: {
        calculatedAt: new Date(),
        stopLossPerTrade: trade.account.stopLossPerTrade,
        tradeResult: trade.resultValue,
        isOutOfRisk: trade.resultValue < -trade.account.stopLossPerTrade,
      },
    }));

    // Atualização em lote
    return this.prisma.trade.updateMany({
      data: updates,
    });
  }
}
```

### 4. Validação de Risco Diário

#### Implementação da Visão de Banco de Dados:
```sql
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
```

#### Lógica de Implementação:
```typescript
// src/services/risk.service.ts
export class RiskService {
  async getDailyRiskData(userId: string, accountId: string, date: Date) {
    return this.prisma.$queryRaw`
      SELECT 
        DATE(t.trade_date) AS trade_date,
        COUNT(t.id)::INTEGER AS trades_count,
        SUM(t.result_value)::DECIMAL AS daily_result,
        CASE WHEN SUM(t.result_value) < -a.daily_stop_limit THEN true ELSE false END AS day_out_of_risk,
        a.stop_loss_per_trade,
        a.daily_stop_limit,
        a.account_name
      FROM trades t
      JOIN accounts a ON t.account_id = a.id
      WHERE t.user_id = ${userId}
        AND t.account_id = ${accountId}
        AND DATE(t.trade_date) = ${date}
        AND t.is_active = true
      GROUP BY DATE(t.trade_date), a.stop_loss_per_trade, a.daily_stop_limit, a.account_name
    `;
  }

  async getDailyRiskTrends(userId: string, accountId: string, days: number = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    return this.prisma.$queryRaw`
      SELECT 
        DATE(t.trade_date) AS trade_date,
        SUM(t.result_value)::DECIMAL AS daily_result,
        CASE WHEN SUM(t.result_value) < -a.daily_stop_limit THEN true ELSE false END AS day_out_of_risk,
        a.daily_stop_limit
      FROM trades t
      JOIN accounts a ON t.account_id = a.id
      WHERE t.user_id = ${userId}
        AND t.account_id = ${accountId}
        AND t.trade_date >= ${startDate}
        AND t.trade_date <= ${endDate}
        AND t.is_active = true
      GROUP BY DATE(t.trade_date), a.daily_stop_limit
      ORDER BY trade_date
    `;
  }
}
```

### 5. Integração com Dashboard de Risco

#### Implementação da Função de Banco de Dados:
```sql
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
```

#### Lógica de Implementação:
```typescript
// src/services/risk.service.ts
export class RiskService {
  async getUserRiskDashboard(userId: string) {
    return this.prisma.$queryRaw`
      SELECT 
        a.id,
        a.account_name,
        a.stop_loss_per_trade,
        a.daily_stop_limit,
        COUNT(t.id)::INTEGER as total_trades,
        COUNT(CASE WHEN t.trade_out_of_risk = true THEN 1 END)::INTEGER as trades_out_of_risk,
        (SELECT COUNT(*) 
         FROM daily_risk_view drv 
         WHERE drv.user_id = ${userId} AND drv.account_id = a.id AND drv.day_out_of_risk = true) as days_out_of_risk,
        -- Cálculo de sequência atual
        (SELECT COUNT(*) 
         FROM (
             SELECT DATE(trade_date) as date
             FROM daily_risk_view
             WHERE user_id = ${userId} AND account_id = a.id AND day_out_of_risk = false
             ORDER BY date DESC
             LIMIT 1
         ) as recent_violation
         CROSS JOIN LATERAL (
             SELECT COUNT(*) as streak
             FROM daily_risk_view
             WHERE user_id = ${userId} AND account_id = a.id 
               AND day_out_of_risk = false
               AND date > recent_violation.date
             ORDER BY date ASC
         ) as streak_calc) as current_streak_days,
        -- Última data de violação de risco
        (SELECT MAX(trade_date)
         FROM daily_risk_view
         WHERE user_id = ${userId} AND account_id = a.id AND day_out_of_risk = true
         LIMIT 1) as last_risk_violation_date
      FROM accounts a
      LEFT JOIN trades t ON a.id = t.account_id AND t.is_active = true
      WHERE a.user_id = ${userId} AND a.is_active = true
      GROUP BY a.id, a.account_name, a.stop_loss_per_trade, a.daily_stop_limit
    `;
  }

  async getMonthlyRiskAnalysis(userId: string, year: number, month: number) {
    return this.prisma.$queryRaw`
      SELECT 
        a.id,
        a.account_name,
        COALESCE(SUM(t.result_value), 0)::DECIMAL as month_total_result,
        COUNT(CASE WHEN t.trade_out_of_risk = true THEN 1 END)::INTEGER as month_trades_out_of_risk,
        (SELECT COUNT(*) 
         FROM daily_risk_view drv 
         WHERE drv.user_id = ${userId} AND drv.account_id = a.id 
           AND drv.day_out_of_risk = true
           AND EXTRACT(YEAR FROM drv.trade_date) = ${year}
           AND EXTRACT(MONTH FROM drv.trade_date) = ${month}) as month_days_out_of_risk,
        CASE 
          WHEN COUNT(DISTINCT DATE(t.trade_date)) = 0 THEN 0
          ELSE (COUNT(DISTINCT DATE(t.trade_date)) - 
                (SELECT COUNT(*) 
                 FROM daily_risk_view drv 
                 WHERE drv.user_id = ${userId} AND drv.account_id = a.id 
                   AND drv.day_out_of_risk = true
                   AND EXTRACT(YEAR FROM drv.trade_date) = ${year}
                   AND EXTRACT(MONTH FROM drv.trade_date) = ${month}))::DECIMAL / 
               COUNT(DISTINCT DATE(t.trade_date)) * 100
        END as risk_compliance_rate,
        CASE 
          WHEN COUNT(DISTINCT DATE(t.trade_date)) = 0 THEN 0
          ELSE SUM(t.result_value) / COUNT(DISTINCT DATE(t.trade_date))
        END as avg_daily_result
      FROM accounts a
      LEFT JOIN trades t ON a.id = t.account_id 
        AND t.is_active = true
        AND EXTRACT(YEAR FROM t.trade_date) = ${year}
        AND EXTRACT(MONTH FROM t.trade_date) = ${month}
      WHERE a.user_id = ${userId} AND a.is_active = true
      GROUP BY a.id, a.account_name
    `;
  }
}
```

### 6. Pontos de API para Gestão de Risco

```typescript
// src/controllers/risk.controller.ts
@Controller('api/risk')
export class RiskController {
  constructor(private riskService: RiskService) {}

  @Get('dashboard/:userId')
  async getRiskDashboard(@Param('userId') userId: string) {
    return this.riskService.getUserRiskDashboard(userId);
  }

  @Get('diario/:userId/:contaId/:data')
  async getDailyRisk(
    @Param('userId') userId: string,
    @Param('contaId') contaId: string,
    @Param('data') data: string
  ) {
    return this.riskService.getDailyRiskData(userId, contaId, new Date(data));
  }

  @Get('tendencias/:userId/:contaId')
  async getRiskTrends(
    @Param('userId') userId: string,
    @Param('contaId') contaId: string,
    @Query('dias') dias: number = 30
  ) {
    return this.riskService.getDailyRiskTrends(userId, contaId, dias);
  }

  @Get('mensal/:userId')
  async getMonthlyAnalysis(
    @Param('userId') userId: string,
    @Query('ano') ano: number,
    @Query('mes') mes: number
  ) {
    return this.riskService.getMonthlyRiskAnalysis(userId, ano, mes);
  }

  @Post('atualizar-flags')
  async updateRiskFlags() {
    return this.riskService.batchUpdateTradeRiskFlags();
  }
}
```

### 7. Componentes UI para Gestão de Risco

```typescript
// src/components/risk/RiskDashboard.tsx
import { useQuery } from '@tanstack/react-query';
import { riskService } from '../../services/risk.service';

export function RiskDashboard({ userId }: { userId: string }) {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['risk-dashboard', userId],
    queryFn: () => riskService.getUserRiskDashboard(userId),
  });

  if (isLoading) return <div>Carregando dashboard de risco...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {dashboardData?.map((account) => (
        <RiskAccountCard key={account.id} account={account} />
      ))}
    </div>
  );
}

function RiskAccountCard({ account }: { account: any }) {
  const riskCompliance = account.total_trades > 0 
    ? ((account.total_trades - account.trades_out_of_risk) / account.total_trades) * 100 
    : 100;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">{account.account_name}</h3>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span>Stop por Operação:</span>
          <span className="font-medium">{account.stop_loss_per_trade}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Stop Diário:</span>
          <span className="font-medium">{account.daily_stop_limit}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Total de Operações:</span>
          <span className="font-medium">{account.total_trades}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Operações Fora de Risco:</span>
          <span className={`font-medium ${account.trades_out_of_risk > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {account.trades_out_of_risk}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Conformidade de Risco:</span>
          <span className={`font-medium ${riskCompliance >= 90 ? 'text-green-600' : 'text-yellow-600'}`}>
            {riskCompliance.toFixed(1)}%
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Sequência Atual:</span>
          <span className="font-medium">{account.current_streak_days} dias</span>
        </div>
      </div>
    </div>
  );
}
```

## Resumo das Funcionalidades de Gestão de Risco

### 1. **Configuração de Risco Nível Conta**
- Campos obrigatórios: `stop_loss_per_trade` e `daily_stop_limit`
- Valores positivos com restrições
- Parâmetros definidos pelo usuário nas configurações

### 2. **Validação de Risco Nível Operação**
- Flag `trade_out_of_risk` calculada automaticamente
- Campo `risk_assessment` JSON com detalhes da análise
- Classificação em tempo real do nível de risco

### 3. **Agregação de Risco Diário**
- Sem novas tabelas necessárias - usa visões computadas
- Agregação diária por usuário, conta e data
- Flag `day_out_of_risk` calculada automaticamente

### 4. **Dashboard de Risco Abrangente**
- Taxas de conformidade de risco
- Rastreamento de sequências (atual e máxima)
- Tendências de violação de risco
- Análise mensal de risco

### 5. **Arquitetura Escalável**
- Funções de banco de dados para cálculos complexos
- Visões indexadas para performance
- Processamento em lote para atualização de flags
- Cálculos escopados por usuário e conta

### 6. **Integração Pronta**
- Dashboard de consistência do tracker
- Visão de calendário com indicadores de risco
- Visão mensal com métricas de risco
- Análise anual com tendências de risco

Esta implementação de gestão de risco fornece análise profissional de risco enquanto mantém escalabilidade e performance para a sua plataforma de trading journal SaaS.