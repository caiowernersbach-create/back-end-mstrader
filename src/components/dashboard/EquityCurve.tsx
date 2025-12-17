import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign } from 'lucide-react';

interface EquityCurveProps {
  dailyData: Array<{
    date: string;
    equity: number;
    dailyResult: number;
    tradesCount: number;
  }>;
}

export function EquityCurve({ dailyData }: EquityCurveProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    equity: number;
    dailyResult: number;
    tradesCount: number;
    x: number;
    y: number;
  } | null>(null);

  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationProgress(1);
    }, 100);
    return () => clearTimeout(timer);
  }, [dailyData]);

  if (!dailyData || dailyData.length === 0) {
    return (
      <Card className="bg-[#1A191B] border-[rgba(255,255,255,0.06)] rounded-2xl shadow-xl h-[420px]">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-white flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-[#02AC73]" />
            Equity Curve
          </CardTitle>
          <CardDescription className="text-gray-400 text-sm">
            Monthly equity progression
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[calc(100%-80px)] flex items-center justify-center text-gray-500">
          No trading data for this month
        </CardContent>
      </Card>
    );
  }

  const chartHeight = 250;
  const chartWidth = 400;
  const padding = 40;
  
  const maxEquity = Math.max(...dailyData.map(d => d.equity));
  const minEquity = Math.min(...dailyData.map(d => d.equity));
  const equityRange = maxEquity - minEquity || 1;

  const getPointColor = (dailyResult: number) => {
    if (dailyResult > 0) return '#02AC73';
    if (dailyResult < 0) return '#EF4444';
    return '#FACC15';
  };

  const generatePath = () => {
    if (dailyData.length < 2) return '';
    
    let path = `M ${padding} ${chartHeight - padding - ((dailyData[0].equity - minEquity) / equityRange) * (chartHeight - 2 * padding)}`;
    
    for (let i = 1; i < dailyData.length; i++) {
      const progress = Math.min(animationProgress * dailyData.length, i + 1) / dailyData.length;
      if (progress > (i - 1) / dailyData.length) {
        const x = padding + (i / (dailyData.length - 1)) * (chartWidth - 2 * padding);
        const y = chartHeight - padding - ((dailyData[i].equity - minEquity) / equityRange) * (chartHeight - 2 * padding);
        path += ` L ${x} ${y}`;
      }
    }
    
    return path;
  };

  const generateAreaPath = () => {
    const path = generatePath();
    if (!path) return '';
    
    const lastPoint = dailyData[dailyData.length - 1];
    const lastX = padding + ((dailyData.length - 1) / (dailyData.length - 1)) * (chartWidth - 2 * padding);
    const lastY = chartHeight - padding - ((lastPoint.equity - minEquity) / equityRange) * (chartHeight - 2 * padding);
    
    return `${path} L ${lastX} ${chartHeight - padding} L ${padding} ${chartHeight - padding} Z`;
  };

  return (
    <Card className="bg-[#1A191B] border-[rgba(255,255,255,0.06)] rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 h-[420px]">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-white flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-[#02AC73]" />
          Equity Curve
        </CardTitle>
        <CardDescription className="text-gray-400 text-sm">
          Monthly equity progression
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[calc(100%-80px)] p-4">
        <div className="relative h-full">
          <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
            <defs>
              <linearGradient id="equityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#02AC73" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#02AC73" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            
            {animationProgress > 0 && (
              <path
                d={generateAreaPath()}
                fill="url(#equityGradient)"
                opacity={animationProgress * 0.8}
              />
            )}
            
            {animationProgress > 0 && (
              <path
                d={generatePath()}
                stroke="#02AC73"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={animationProgress}
              />
            )}
            
            {dailyData.map((point, index) => {
              const progress = Math.min(animationProgress * dailyData.length, index + 1) / dailyData.length;
              if (progress <= index / dailyData.length) return null;
              
              const x = padding + (index / (dailyData.length - 1)) * (chartWidth - 2 * padding);
              const y = chartHeight - padding - ((point.equity - minEquity) / equityRange) * (chartHeight - 2 * padding);
              
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="5"
                  fill={getPointColor(point.dailyResult)}
                  stroke="#100E0F"
                  strokeWidth="2"
                  className="cursor-pointer transition-all duration-200 hover:r-7"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredPoint({
                      ...point,
                      x: rect.left + rect.width / 2,
                      y: rect.top + rect.height / 2,
                    });
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              );
            })}
          </svg>
          
          {hoveredPoint && (
            <div 
              className="absolute bg-[#1A191B] border border-[rgba(255,255,255,0.3)] rounded-lg p-4 shadow-xl z-10 backdrop-blur-sm"
              style={{
                left: hoveredPoint.x,
                top: hoveredPoint.y - 100,
                transform: 'translate(-50%, -100%)',
                minWidth: '200px'
              }}
            >
              <div className="text-base font-bold text-white mb-2">
                {new Date(hoveredPoint.date).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2 text-sm mb-2">
                <DollarSign className="h-4 w-4 text-[#02AC73]" />
                <span className="text-lg font-bold text-white">
                  {hoveredPoint.equity.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={hoveredPoint.dailyResult > 0 ? 'default' : hoveredPoint.dailyResult < 0 ? 'destructive' : 'secondary'}
                  className="text-sm font-semibold"
                >
                  {hoveredPoint.dailyResult.toFixed(2)}
                </Badge>
                <span className="text-sm text-gray-400">
                  {hoveredPoint.tradesCount} trades
                </span>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-between mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
          <div className="text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wider">Start</div>
            <div className="text-lg font-bold text-white">
              {dailyData[0]?.equity.toFixed(2) || '0.00'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wider">End</div>
            <div className="text-lg font-bold text-white">
              {dailyData[dailyData.length - 1]?.equity.toFixed(2) || '0.00'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wider">Change</div>
            <div className={`text-lg font-bold ${
              (dailyData[dailyData.length - 1]?.equity || 0) - (dailyData[0]?.equity || 0) >= 0 
                ? 'text-[#02AC73]' 
                : 'text-red-400'
            }`}>
              {((dailyData[dailyData.length - 1]?.equity || 0) - (dailyData[0]?.equity || 0)).toFixed(2)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}