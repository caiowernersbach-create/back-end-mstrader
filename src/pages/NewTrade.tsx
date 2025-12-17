import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { tradeService, accountService, assetService, strategyService } from '../services';
import { ArrowLeft, Save, X, Upload, CheckCircle, AlertTriangle, XCircle, TrendingUp, TrendingDown, Calendar as CalendarIcon, Target, Brain, Smile } from 'lucide-react';

// TypeScript interfaces
interface Account {
  id: string;
  accountName: string;
  stopLossPerTrade: number;
  dailyStopLimit: number;
  currency: string;
}

interface Asset {
  id: string;
  assetSymbol: string;
}

interface Strategy {
  id: string;
  strategyName: string;
}

type TradeDirection = 'BUY' | 'SELL';

interface TradeFormData {
  tradeDate: Date;
  accountId: string;
  assetId: string;
  direction: TradeDirection;
  resultValue: string;
  strategyId: string;
  emotion: string;
  notes?: string;
  tradeImage?: File;
}

interface RiskAssessment {
  stopLossPerTrade: number;
  dailyStopLimit: number;
  tradeResult: number;
  isOutOfRisk: boolean;
  calculatedAt: string;
}

const emotionOptions = [
  'Confident', 'Excited', 'Anxious', 'Fearful', 'Greedy', 'Frustrated',
  'Patient', 'Impatient', 'Focused', 'Distracted', 'Calm', 'Stressed',
  'Optimistic', 'Pessimistic', 'Neutral'
];

// Risk Status Component
const RiskStatusChip = ({ status }: { status: 'within' | 'breakeven' | 'out' }) => {
  const variants = {
    within: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      text: 'text-green-400',
      icon: CheckCircle,
      label: 'Within Risk'
    },
    breakeven: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      icon: AlertTriangle,
      label: 'Breakeven'
    },
    out: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      icon: XCircle,
      label: 'Out of Risk'
    }
  };

  const variant = variants[status];
  const Icon = variant.icon;

  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200",
      variant.bg,
      variant.border,
      variant.text
    )}>
      <Icon className="h-3 w-3" />
      {variant.label}
    </div>
  );
};

// Asset Card Component
const AssetCard = ({ asset, isSelected, onClick, disabled }: { 
  asset: Asset; 
  isSelected: boolean; 
  onClick: () => void; 
  disabled: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "relative p-4 rounded-xl border transition-all duration-200 cursor-pointer",
      "hover:scale-[1.02] active:scale-[0.98]",
      disabled 
        ? "opacity-50 cursor-not-allowed bg-[#1A191B] border-[#2A292B]" 
        : "bg-[#1A191B] border-[#2A292B] hover:border-[rgba(2,172,115,0.4)] hover:bg-[#1F1E20]",
      isSelected && "bg-[rgba(2,172,115,0.12)] border-[#02AC73] text-white shadow-[0_0_0_1px_rgba(2,172,115,0.6),0_0_12px_rgba(2,172,115,0.25)]"
    )}
  >
    <span className={cn(
      "font-medium text-sm uppercase tracking-wide",
      isSelected ? "text-white" : "text-gray-300"
    )}>
      {asset.assetSymbol}
    </span>
    {isSelected && (
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#02AC73] rounded-full border-2 border-[#100E0F]" />
    )}
  </button>
);

// Direction Toggle Component
const DirectionToggle = ({ direction, setDirection }: { 
  direction: TradeDirection; 
  setDirection: (dir: TradeDirection) => void;
}) => (
  <div className="flex gap-3">
    <button
      onClick={() => setDirection('BUY')}
      className={cn(
        "flex-1 py-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2",
        "hover:scale-105 active:scale-95",
        direction === 'BUY' 
          ? "bg-[#02AC73]/10 border-[#02AC73] shadow-lg shadow-[#02AC73]/20 text-[#02AC73]" 
          : "bg-[#1A191B] border-[#2A292B] hover:border-[#2A292B]"
      )}
    >
      <TrendingUp className="h-5 w-5" />
      <span className="font-semibold">BUY</span>
    </button>
    <button
      onClick={() => setDirection('SELL')}
      className={cn(
        "flex-1 py-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2",
        "hover:scale-105 active:scale-95",
        direction === 'SELL' 
          ? "bg-[#FF4D4F]/10 border-[#FF4D4F] shadow-lg shadow-[#FF4D4F]/20 text-[#FF4D4F]" 
          : "bg-[#1A191B] border-[#2A292B] hover:border-[#2A292B]"
      )}
    >
      <TrendingDown className="h-5 w-5" />
      <span className="font-semibold">SELL</span>
    </button>
  </div>
);

export function NewTrade() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<TradeFormData>({
    tradeDate: new Date(),
    accountId: '',
    assetId: '',
    direction: 'BUY',
    resultValue: '',
    strategyId: '',
    emotion: '',
    notes: '',
  });
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [dailyRiskAlert, setDailyRiskAlert] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch user accounts with defensive defaults
  const { data: accounts = [], isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: accountService.getUserAccounts,
  });

  // Fetch user strategies with defensive defaults
  const { data: strategies = [], isLoading: strategiesLoading } = useQuery<Strategy[]>({
    queryKey: ['strategies'],
    queryFn: strategyService.getUserStrategies,
  });

  // Fetch user assets (not account-specific) with defensive defaults
  const { data: assets = [], isLoading: assetsLoading } = useQuery<Asset[]>({
    queryKey: ['assets'],
    queryFn: assetService.getUserAssets,
  });

  // Fetch account risk settings when account changes
  useEffect(() => {
    if (formData.accountId && accounts.length > 0) {
      const account = accounts.find(acc => acc.id === formData.accountId);
      if (account) {
        setRiskAssessment({
          stopLossPerTrade: account.stopLossPerTrade,
          dailyStopLimit: account.dailyStopLimit,
          tradeResult: 0,
          calculatedAt: new Date().toISOString(),
          isOutOfRisk: false,
        });
      }
    }
  }, [formData.accountId, accounts]);

  // Check daily risk when form data changes
  useEffect(() => {
    if (formData.accountId && formData.tradeDate && formData.resultValue && accounts.length > 0) {
      checkDailyRisk();
    }
  }, [formData.accountId, formData.tradeDate, formData.resultValue, accounts]);

  const checkDailyRisk = async () => {
    if (!formData.accountId || !formData.tradeDate || !formData.resultValue || accounts.length === 0) return;

    try {
      const resultValue = parseFloat(formData.resultValue);
      const accountId = formData.accountId;
      const tradeDate = formData.tradeDate;

      // Get daily risk data
      const dailyRiskData = await tradeService.getDailyRiskData(accountId, tradeDate);
      
      if (dailyRiskData && dailyRiskData.length > 0) {
        const dayData = dailyRiskData[0];
        const account = accounts.find(acc => acc.id === accountId);
        
        if (account && dayData.daily_result < -account.dailyStopLimit) {
          setDailyRiskAlert(`⚠️ Dia fora de risco: Resultado diário ${dayData.daily_result.toFixed(2)} excede limite de ${account.dailyStopLimit}`);
        } else {
          setDailyRiskAlert('');
        }
      }
    } catch (error) {
      console.error('Error checking daily risk:', error);
      setDailyRiskAlert('');
    }
  };

  const updateRiskAssessment = () => {
    if (!formData.accountId || !formData.resultValue || !riskAssessment || accounts.length === 0) return;

    const resultValue = parseFloat(formData.resultValue);
    const account = accounts.find(acc => acc.id === formData.accountId);
    
    if (account) {
      const isOutOfRisk = resultValue < -account.stopLossPerTrade;
      
      setRiskAssessment({
        ...riskAssessment,
        tradeResult: resultValue,
        isOutOfRisk,
      });
    }
  };

  const handleInputChange = (field: keyof TradeFormData, value: string | Date | File) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'resultValue') {
      updateRiskAssessment();
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      handleInputChange('tradeImage', file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    handleInputChange('tradeImage', undefined as any);
  };

  const createTradeMutation = useMutation({
    mutationFn: (tradeData: any) => tradeService.createTrade(tradeData),
    onSuccess: () => {
      toast.success('Operação criada com sucesso!');
      
      // Refresh dashboard metrics
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-overview'] });
      
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar operação: ${error.message}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.accountId || !formData.assetId || !formData.strategyId || !formData.emotion) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (!formData.resultValue) {
      toast.error('Por favor, informe o resultado da operação');
      return;
    }

    const resultValue = parseFloat(formData.resultValue);
    if (isNaN(resultValue)) {
      toast.error('Por favor, informe um valor numérico válido');
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate result type based on business rules
      const resultType =
        resultValue > 0 ? 'win' :
        resultValue < 0 ? 'loss' :
        'breakeven';

      // Check if trade is out of risk
      const isOutOfRisk = resultValue < -(riskAssessment?.stopLossPerTrade || 0);

      const tradeData = {
        ...formData,
        resultValue,
        resultType,
        tradeOutOfRisk: isOutOfRisk,
        riskAssessment: riskAssessment ? {
          calculatedAt: riskAssessment.calculatedAt,
          stopLossPerTrade: riskAssessment.stopLossPerTrade,
          dailyStopLimit: riskAssessment.dailyStopLimit,
          tradeResult: resultValue,
          isOutOfRisk,
        } : null,
      };

      await createTradeMutation.mutateAsync(tradeData);
    } catch (error) {
      console.error('Error creating trade:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRiskStatus = () => {
    if (!formData.resultValue) return null;
    
    const resultValue = parseFloat(formData.resultValue);
    
    if (resultValue === 0) return 'breakeven';
    if (riskAssessment && riskAssessment.isOutOfRisk) return 'out';
    return 'within';
  };

  const getResultColor = () => {
    if (!formData.resultValue) return 'text-gray-400';
    
    const resultValue = parseFloat(formData.resultValue);
    
    if (resultValue === 0) return 'text-yellow-400';
    if (resultValue < 0) return 'text-red-400';
    return 'text-green-400';
  };

  const getRiskGlow = () => {
    if (!riskAssessment || !formData.resultValue) return '';
    
    const resultValue = parseFloat(formData.resultValue);
    
    if (resultValue === 0) return 'shadow-[0_0_20px_rgba(245,197,66,0.2)]';
    if (riskAssessment.isOutOfRisk) return 'shadow-[0_0_20px_rgba(255,77,79,0.2)]';
    return 'shadow-[0_0_20px_rgba(2,172,115,0.2)]';
  };

  return (
    <div className="min-h-screen bg-[#100E0F] text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Premium Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="text-gray-400 hover:text-white hover:bg-[#1A191B] rounded-xl px-6 py-3 transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          
          <div className="text-center">
            <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-[#02AC73] to-[#02AC73]/60 bg-clip-text text-transparent">
              New Trade
            </h1>
            <p className="text-gray-400 text-xl max-w-3xl mx-auto">
              Record your trade with compliance & performance tracking
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Left Column - Main Form */}
            <div className="xl:col-span-3 space-y-8">
              {/* Trade Direction Card */}
              <Card className="bg-[#1A191B] border-[rgba(255,255,255,0.06)] rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl font-semibold text-white flex items-center gap-3">
                    <Target className="h-6 w-6 text-[#02AC73]" />
                    Trade Direction
                  </CardTitle>
                  <CardDescription className="text-gray-400 text-base">
                    Select your trade direction
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DirectionToggle 
                    direction={formData.direction} 
                    setDirection={(dir) => handleInputChange('direction', dir)} 
                  />
                </CardContent>
              </Card>

              {/* Trade Details Card */}
              <Card className="bg-[#1A191B] border-[rgba(255,255,255,0.06)] rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl font-semibold text-white flex items-center gap-3">
                    <CalendarIcon className="h-6 w-6 text-[#02AC73]" />
                    Trade Details
                  </CardTitle>
                  <CardDescription className="text-gray-400 text-base">
                    Essential trade information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Trade Date */}
                  <div className="space-y-2">
                    <Label htmlFor="tradeDate" className="text-sm font-medium text-gray-300">Trade Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start bg-[#2A292B] border-[rgba(255,255,255,0.06)] text-white hover:bg-[#3A393B] hover:border-[#02AC73]/50 rounded-xl px-4 py-3 transition-all duration-200"
                        >
                          <CalendarIcon className="h-4 w-4 mr-3" />
                          <span className="text-base">{format(formData.tradeDate, 'dd/MM/yyyy')}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-[#1A191B] border-[rgba(255,255,255,0.06)] rounded-xl">
                        <Calendar
                          mode="single"
                          selected={formData.tradeDate}
                          onSelect={(date) => date && handleInputChange('tradeDate', date)}
                          disabled={(date) => date < new Date('1900-01-01')}
                          initialFocus
                          className="rounded-md bg-[#1A191B] text-white"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Account Selector */}
                  <div className="space-y-2">
                    <Label htmlFor="accountId" className="text-sm font-medium text-gray-300">Account</Label>
                    <Select
                      value={formData.accountId}
                      onValueChange={(value) => handleInputChange('accountId', value)}
                      disabled={accountsLoading}
                    >
                      <SelectTrigger className="bg-[#2A292B] border-[rgba(255,255,255,0.06)] text-white hover:bg-[#3A393B] hover:border-[#02AC73]/50 rounded-xl px-4 py-3 transition-all duration-200">
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A191B] border-[rgba(255,255,255,0.06)] rounded-xl">
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id} className="text-white hover:bg-[#1F1E20] rounded-lg">
                            {account.accountName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Asset Grid */}
                  <div className="space-y-2">
                    <Label htmlFor="assetId" className="text-sm font-medium text-gray-300">Asset</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      {assets.map((asset) => (
                        <AssetCard
                          key={asset.id}
                          asset={asset}
                          isSelected={formData.assetId === asset.id}
                          onClick={() => handleInputChange('assetId', asset.id)}
                          disabled={assetsLoading}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Strategy Selector */}
                  <div className="space-y-2">
                    <Label htmlFor="strategyId" className="text-sm font-medium text-gray-300">Strategy</Label>
                    <Select
                      value={formData.strategyId}
                      onValueChange={(value) => handleInputChange('strategyId', value)}
                      disabled={strategiesLoading}
                    >
                      <SelectTrigger className="bg-[#2A292B] border-[rgba(255,255,255,0.06)] text-white hover:bg-[#3A393B] hover:border-[#02AC73]/50 rounded-xl px-4 py-3 transition-all duration-200">
                        <SelectValue placeholder="Select strategy" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A191B] border-[rgba(255,255,255,0.06)] rounded-xl">
                        {strategies.map((strategy) => (
                          <SelectItem key={strategy.id} value={strategy.id} className="text-white hover:bg-[#1F1E20] rounded-lg">
                            {strategy.strategyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Result Input with Status */}
                  <div className="space-y-2">
                    <Label htmlFor="resultValue" className="text-sm font-medium text-gray-300">
                      Result (P&L)
                    </Label>
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <Input
                          id="resultValue"
                          type="number"
                          value={formData.resultValue}
                          onChange={(e) => handleInputChange('resultValue', e.target.value)}
                          placeholder="0.00"
                          className="bg-[#2A292B] border-[rgba(255,255,255,0.06)] text-white placeholder-gray-500 rounded-xl px-4 py-3 focus:border-[#02AC73] focus:shadow-[0_0_0_3px_rgba(2,172,115,0.15)] transition-all duration-200"
                        />
                      </div>
                      {formData.resultValue && (
                        <div className="transition-all duration-200">
                          {getRiskStatus() && <RiskStatusChip status={getRiskStatus() as any} />}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Result:</span>
                      <span className={`text-xl font-bold transition-colors duration-200 ${getResultColor()}`}>
                        {formData.resultValue ? parseFloat(formData.resultValue).toFixed(2) : '0.00'}
                      </span>
                    </div>
                  </div>

                  {/* Emotion Selector */}
                  <div className="space-y-2">
                    <Label htmlFor="emotion" className="text-sm font-medium text-gray-300">Emotion</Label>
                    <Select
                      value={formData.emotion}
                      onValueChange={(value) => handleInputChange('emotion', value)}
                    >
                      <SelectTrigger className="bg-[#2A292B] border-[rgba(255,255,255,0.06)] text-white hover:bg-[#3A393B] hover:border-[#02AC73]/50 rounded-xl px-4 py-3 transition-all duration-200">
                        <SelectValue placeholder="Select emotion" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A191B] border-[rgba(255,255,255,0.06)] rounded-xl">
                        {emotionOptions.map((emotion) => (
                          <SelectItem key={emotion} value={emotion} className="text-white hover:bg-[#1F1E20] rounded-lg">
                            <div className="flex items-center gap-2">
                              <Smile className="h-4 w-4" />
                              {emotion}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Notes Card */}
              <Card className="bg-[#1A191B] border-[rgba(255,255,255,0.06)] rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl font-semibold text-white flex items-center gap-3">
                    <Brain className="h-6 w-6 text-[#02AC73]" />
                    Trade Analysis
                  </CardTitle>
                  <CardDescription className="text-gray-400 text-base">
                    Document your trade insights
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="What worked? What failed? What can be improved?"
                    className="bg-[#2A292B] border-[rgba(255,255,255,0.06)] text-white placeholder-gray-500 resize-none rounded-xl px-4 py-3 focus:border-[#02AC73] focus:shadow-[0_0_0_3px_rgba(2,172,115,0.15)] transition-all duration-200"
                    rows={4}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Risk Panel */}
            <div className="xl:col-span-1 space-y-6">
              {/* Risk Assessment Card */}
              <Card className={`bg-[#1A191B] border-[rgba(255,255,255,0.06)] rounded-2xl shadow-xl transition-all duration-300 ${getRiskGlow()}`}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
                    <Target className="h-5 w-5 text-[#02AC73]" />
                    Risk Assessment
                  </CardTitle>
                  <CardDescription className="text-gray-400 text-sm">
                    Real-time risk analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {riskAssessment && accounts.length > 0 ? (
                    <>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-[rgba(255,255,255,0.06)]">
                          <span className="text-sm text-gray-400">Stop per Trade</span>
                          <span className="text-white font-semibold">
                            {riskAssessment.stopLossPerTrade.toFixed(2)}
                            <span className="text-xs text-gray-500 ml-1">USD</span>
                          </span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-[rgba(255,255,255,0.06)]">
                          <span className="text-sm text-gray-400">Daily Stop</span>
                          <span className="text-white font-semibold">
                            {riskAssessment.dailyStopLimit.toFixed(2)}
                            <span className="text-xs text-gray-500 ml-1">USD</span>
                          </span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-[rgba(255,255,255,0.06)]">
                          <span className="text-sm text-gray-400">Trade Result</span>
                          <span className={`font-semibold transition-colors duration-200 ${
                            formData.resultValue ? 
                              (parseFloat(formData.resultValue) > 0 ? 'text-green-400' : 
                               parseFloat(formData.resultValue) < 0 ? 'text-red-400' : 'text-yellow-400') : 
                              'text-gray-400'
                          }`}>
                            {formData.resultValue ? parseFloat(formData.resultValue).toFixed(2) : '0.00'}
                            <span className="text-xs text-gray-500 ml-1">USD</span>
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Risk Status</span>
                          <span className={`font-semibold text-sm ${
                            riskAssessment.isOutOfRisk ? 'text-red-400' : 'text-green-400'
                          }`}>
                            {riskAssessment.isOutOfRisk ? 'Out of Risk' : 'Within Risk'}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-500 text-sm">Select an account to view risk assessment</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Daily Risk Alert */}
              {dailyRiskAlert && (
                <Alert className="bg-[#1F1E20] border-[rgba(245,197,66,0.3)] text-yellow-100 rounded-xl">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{dailyRiskAlert}</AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#02AC73] to-[#02AC73]/80 hover:from-[#02AC73] hover:to-[#02AC73] text-white font-semibold rounded-xl px-8 py-4 text-lg transition-all duration-200 hover:shadow-[0_0_20px_rgba(2,172,115,0.3)] hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="h-5 w-5" />
                      Save Trade
                    </div>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="w-full bg-[#2A292B] border-[rgba(255,255,255,0.06)] text-white hover:bg-[#3A393B] hover:border-[#02AC73]/50 rounded-xl px-8 py-4 text-lg font-semibold transition-all duration-200"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}