import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Trade {
  id: string;
  tradeDate: Date;
  asset: { assetSymbol: string };
  direction: 'BUY' | 'SELL';
  resultValue: number;
  resultType: 'win' | 'loss' | 'breakeven';
  emotion: string;
  strategy: { strategyName: string; isOutOfStrategy?: boolean };
  isOutOfRisk: boolean;
}

interface RecentTradesProps {
  trades: Trade[];
  onTradeClick?: (tradeId: string) => void;
}

export function RecentTrades({ trades, onTradeClick }: RecentTradesProps) {
  const getDirectionIcon = (direction: 'BUY' | 'SELL') => {
    if (direction === 'BUY') return <TrendingUp className="h-3 w-3" />;
    return <TrendingDown className="h-3 w-3" />;
  };

  const getResultColor = (resultValue: number) => {
    if (resultValue > 0) return 'text-[#02AC73]';
    if (resultValue < 0) return 'text-red-400';
    return 'text-yellow-400';
  };

  const getStrategyColor = (strategyName: string, isOutOfStrategy?: boolean) => {
    if (isOutOfStrategy) return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-[#02AC73]/20 text-[#02AC73] border-[#02AC73]/30';
  };

  // Show max 7 trades
  const displayTrades = trades.slice(0, 7);

  return (
    <Card className="bg-[#1A191B] border-[rgba(255,255,255,0.06)] rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 h-[420px]">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-white flex items-center gap-3">
          <Calendar className="h-5 w-5 text-[#02AC73]" />
          Recent Trades
        </CardTitle>
        <CardDescription className="text-gray-400 text-sm">
          Your latest trading activity
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[calc(100%-80px)] overflow-y-auto">
        <div className="space-y-3">
          {displayTrades.map((trade) => (
            <div 
              key={trade.id} 
              className="group p-4 bg-[#2A292B] rounded-xl hover:bg-[#3A393B] transition-all duration-200 cursor-pointer border border-transparent hover:border-[rgba(2,172,115,0.2)]"
              onClick={() => onTradeClick?.(trade.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                    trade.direction === 'BUY' 
                      ? 'bg-[#02AC73]/10 text-[#02AC73] border border-[#02AC73]/30' 
                      : 'bg-red-500/10 text-red-400 border border-red-500/30'
                  }`}>
                    {getDirectionIcon(trade.direction)}
                    <span className="font-semibold">{trade.direction}</span>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-white">
                      {trade.asset?.assetSymbol}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(trade.tradeDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`text-lg font-semibold transition-colors duration-200 ${getResultColor(trade.resultValue)}`}>
                    {trade.resultValue.toFixed(2)}
                  </div>

                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getStrategyColor(trade.strategy.strategyName, trade.strategy.isOutOfStrategy)}`}
                  >
                    {trade.strategy.strategyName}
                  </Badge>

                  {trade.isOutOfRisk && (
                    <div className="flex items-center gap-1 text-xs text-red-400">
                      <Minus className="h-3 w-3" />
                      <span>Risk</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span className="text-xs text-gray-500">Emotion:</span>
                <Badge variant="secondary" className="text-xs">
                  {trade.emotion}
                </Badge>
              </div>
            </div>
          ))}

          {displayTrades.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No trades recorded for this month
            </div>
          )}

          {trades.length > 7 && (
            <div className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
              <Button 
                variant="outline" 
                className="w-full text-gray-400 hover:text-white hover:bg-[#1F1E20] rounded-lg"
              >
                View All Trades
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}