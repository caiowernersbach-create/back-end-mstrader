import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Shield, TrendingUp, Target, Zap } from 'lucide-react';

interface ComplianceCardProps {
  riskManagement: number;
  strategyAdherence: number;
  entryQuality: number;
  consistencyStreak: number;
  isStreakActive: boolean;
}

export function ComplianceCard({ 
  riskManagement, 
  strategyAdherence, 
  entryQuality, 
  consistencyStreak, 
  isStreakActive 
}: ComplianceCardProps) {
  const [animatedValues, setAnimatedValues] = useState({
    riskManagement: 0,
    strategyAdherence: 0,
    entryQuality: 0,
  });

  useEffect(() => {
    const animateValue = (key: string, start: number, end: number, duration: number = 1500) => {
      let startTimestamp: number | null = null;
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = Math.floor(progress * (end - start) + start);
        
        setAnimatedValues(prev => ({
          ...prev,
          [key]: current
        }));

        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    };

    animateValue('riskManagement', 0, riskManagement);
    animateValue('strategyAdherence', 0, strategyAdherence);
    animateValue('entryQuality', 0, entryQuality);
  }, [riskManagement, strategyAdherence, entryQuality]);

  const getComplianceColor = (value: number) => {
    if (value >= 90) return 'text-[#02AC73]';
    if (value >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getProgressColor = (value: number) => {
    if (value >= 90) return 'bg-[#02AC73]';
    if (value >= 70) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  const complianceItems = [
    {
      title: 'Risk Management',
      value: animatedValues.riskManagement,
      icon: Shield,
      description: 'Stop loss & position sizing'
    },
    {
      title: 'Strategy Adherence',
      value: animatedValues.strategyAdherence,
      icon: Target,
      description: 'Following your plan'
    },
    {
      title: 'Entry Quality',
      value: animatedValues.entryQuality,
      icon: TrendingUp,
      description: 'Timing & execution'
    }
  ];

  return (
    <Card className="bg-[#1A191B] border-[rgba(255,255,255,0.06)] rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-white flex items-center gap-3">
          <Shield className="h-5 w-5 text-[#02AC73]" />
          Daily Compliance
        </CardTitle>
        <CardDescription className="text-gray-400 text-sm">
          Track your trading discipline and consistency
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress bars */}
        {complianceItems.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <item.icon className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-300">
                  {item.title}
                </span>
              </div>
              <span className={`text-sm font-semibold ${getComplianceColor(item.value)}`}>
                {item.value}%
              </span>
            </div>
            <Progress 
              value={item.value} 
              className="h-2 bg-[#2A292B]"
            />
            <p className="text-xs text-gray-500">{item.description}</p>
          </div>
        ))}

        {/* Streak indicator */}
        <div className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#02AC73]" />
              <span className="text-sm font-medium text-gray-300">Consistency Streak</span>
            </div>
            <div className={`flex items-center gap-2 ${isStreakActive ? 'animate-pulse' : ''}`}>
              <span className={`text-lg font-bold ${isStreakActive ? 'text-[#02AC73]' : 'text-gray-400'}`}>
                {consistencyStreak}
              </span>
              <span className="text-xs text-gray-500">days</span>
              {isStreakActive && (
                <span className="text-xs text-[#02AC73]">🔥 Active</span>
              )}
            </div>
          </div>
        </div>

        {/* Overall score */}
        <div className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-1">Overall Compliance Score</div>
            <div className={`text-3xl font-bold ${getComplianceColor(
              (animatedValues.riskManagement + animatedValues.strategyAdherence + animatedValues.entryQuality) / 3
            )}`}>
              {Math.round((animatedValues.riskManagement + animatedValues.strategyAdherence + animatedValues.entryQuality) / 3)}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}