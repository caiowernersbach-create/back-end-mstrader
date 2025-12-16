"use client";

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
import { tradeService, accountService, assetService, strategyService } from '@/services';
import { ArrowLeft, Save, X, Upload } from 'lucide-react';

interface TradeFormData {
  tradeDate: Date;
  accountId: string;
  assetId: string;
  direction: 'BUY' | 'SELL';
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
  calculatedAt: string;
  isOutOfRisk: boolean;
}

const emotionOptions = [
  'Confident',
  'Excited',
  'Anxious',
  'Fearful',
  'Greedy',
  'Frustrated',
  'Patient',
  'Impatient',
  'Focused',
  'Distracted',
  'Calm',
  'Stressed',
  'Optimistic',
  'Pessimistic',
  'Neutral'
];

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

  // Fetch user accounts
  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountService.getUserAccounts(),
  });

  // Fetch user strategies
  const { data: strategies, isLoading: strategiesLoading } = useQuery({
    queryKey: ['strategies'],
    queryFn: () => strategyService.getUserStrategies(),
  });

  // Fetch assets filtered by selected account
  const { data: assets, isLoading: assetsLoading } = useQuery({
    queryKey: ['assets', formData.accountId],
    queryFn: () => formData.accountId ? assetService.getAssetsByAccount(formData.accountId) : Promise.resolve([]),
    enabled: !!formData.accountId,
  });

  // Fetch account risk settings when account changes
  useEffect(() => {
    if (formData.accountId) {
      const account = accounts?.find(acc => acc.id === formData.accountId);
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
    if (formData.accountId && formData.tradeDate && formData.resultValue) {
      checkDailyRisk();
    }
  }, [formData.accountId, formData.tradeDate, formData.resultValue]);

  const checkDailyRisk = async () => {
    if (!formData.accountId || !formData.tradeDate || !formData.resultValue) return;

    try {
      const resultValue = parseFloat(formData.resultValue);
      const accountId = formData.accountId;
      const tradeDate = formData.tradeDate;

      // Get daily risk data
      const dailyRiskData = await tradeService.getDailyRiskData(accountId, tradeDate);
      
      if (dailyRiskData && dailyRiskData.length > 0) {
        const dayData = dailyRiskData[0];
        const account = accounts?.find(acc => acc.id === accountId);
        
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
    if (!formData.accountId || !formData.resultValue || !riskAssessment) return;

    const resultValue = parseFloat(formData.resultValue);
    const stopLossPerTrade = riskAssessment.stopLossPerTrade;
    
    const isOutOfRisk = resultValue < -stopLossPerTrade;
    
    setRiskAssessment({
      ...riskAssessment,
      tradeResult: resultValue,
      isOutOfRisk,
    });
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
      const tradeData = {
        ...formData,
        resultValue,
        resultType: resultValue > 0 ? 'win' : resultValue < 0 ? 'loss' : 'breakeven',
        tradeOutOfRisk: riskAssessment?.isOutOfRisk || false,
        riskAssessment: riskAssessment ? {
          calculatedAt: riskAssessment.calculatedAt,
          stopLossPerTrade: riskAssessment.stopLossPerTrade,
          dailyStopLimit: riskAssessment.dailyStopLimit,
          tradeResult: resultValue,
          isOutOfRisk: riskAssessment.isOutOfRisk,
        } : null,
      };

      await createTradeMutation.mutateAsync(tradeData);
    } catch (error) {
      console.error('Error creating trade:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRiskColor = () => {
    if (!riskAssessment) return 'text-gray-400';
    if (riskAssessment.isOutOfRisk) return 'text-red-500';
    if (formData.resultValue === '0') return 'text-yellow-500';
    return 'text-green-500';
  };

  const getRiskText = () => {
    if (!riskAssessment) return 'Aguardando dados...';
    if (riskAssessment.isOutOfRisk) return 'Fora de Risco';
    if (formData.resultValue === '0') return 'Breakeven';
    return 'Dentro do Risco';
  };

  return (
    <div className="min-h-screen bg-[#100E0F] text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="mr-4 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Nova Operação</h1>
            <p className="text-gray-400 mt-1">Registre sua operação com validação de risco automática</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card className="bg-[#1A191B] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Informações Básicas</CardTitle>
                  <CardDescription className="text-gray-400">
                    Dados essenciais da operação
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Trade Date */}
                  <div className="space-y-2">
                    <Label htmlFor="tradeDate" className="text-white">Data da Operação</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start bg-[#2A292B] border-gray-700 text-white hover:bg-[#3A393B]"
                        >
                          <span>{format(formData.tradeDate, 'dd/MM/yyyy')}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-[#1A191B] border-gray-800">
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

                  {/* Account and Asset */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="accountId" className="text-white">Conta</Label>
                      <Select
                        value={formData.accountId}
                        onValueChange={(value) => handleInputChange('accountId', value)}
                        disabled={accountsLoading}
                      >
                        <SelectTrigger className="bg-[#2A292B] border-gray-700 text-white">
                          <SelectValue placeholder="Selecione uma conta" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A191B] border-gray-800">
                          {accounts?.map((account) => (
                            <SelectItem key={account.id} value={account.id} className="text-white">
                              {account.accountName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assetId" className="text-white">Ativo</Label>
                      <Select
                        value={formData.assetId}
                        onValueChange={(value) => handleInputChange('assetId', value)}
                        disabled={assetsLoading || !formData.accountId}
                      >
                        <SelectTrigger className="bg-[#2A292B] border-gray-700 text-white">
                          <SelectValue placeholder="Selecione um ativo" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A191B] border-gray-800">
                          {assets?.map((asset) => (
                            <SelectItem key={asset.id} value={asset.id} className="text-white">
                              {asset.assetSymbol}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Direction */}
                  <div className="space-y-2">
                    <Label htmlFor="direction" className="text-white">Direção</Label>
                    <Select
                      value={formData.direction}
                      onValueChange={(value: 'BUY' | 'SELL') => handleInputChange('direction', value)}
                    >
                      <SelectTrigger className="bg-[#2A292B] border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A191B] border-gray-800">
                        <SelectItem value="BUY" className="text-white">BUY</SelectItem>
                        <SelectItem value="SELL" className="text-white">SELL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Result Value */}
                  <div className="space-y-2">
                    <Label htmlFor="resultValue" className="text-white">
                      Resultado (P&L)
                    </Label>
                    <Input
                      id="resultValue"
                      type="number"
                      value={formData.resultValue}
                      onChange={(e) => handleInputChange('resultValue', e.target.value)}
                      placeholder="0.00"
                      className="bg-[#2A292B] border-gray-700 text-white placeholder-gray-500"
                    />
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400">Status:</span>
                      <span className={`text-sm font-medium ${getRiskColor()}`}>
                        {getRiskText()}
                      </span>
                    </div>
                  </div>

                  {/* Strategy */}
                  <div className="space-y-2">
                    <Label htmlFor="strategyId" className="text-white">Estratégia</Label>
                    <Select
                      value={formData.strategyId}
                      onValueChange={(value) => handleInputChange('strategyId', value)}
                      disabled={strategiesLoading}
                    >
                      <SelectTrigger className="bg-[#2A292B] border-gray-700 text-white">
                        <SelectValue placeholder="Selecione uma estratégia" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A191B] border-gray-800">
                        {strategies?.map((strategy) => (
                          <SelectItem key={strategy.id} value={strategy.id} className="text-white">
                            {strategy.strategyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Emotion */}
                  <div className="space-y-2">
                    <Label htmlFor="emotion" className="text-white">Emoção</Label>
                    <Select
                      value={formData.emotion}
                      onValueChange={(value) => handleInputChange('emotion', value)}
                    >
                      <SelectTrigger className="bg-[#2A292B] border-gray-700 text-white">
                        <SelectValue placeholder="Selecione uma emoção" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A191B] border-gray-800">
                        {emotionOptions.map((emotion) => (
                          <SelectItem key={emotion} value={emotion} className="text-white">
                            {emotion}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Notes and Image */}
              <Card className="bg-[#1A191B] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Observações e Imagem</CardTitle>
                  <CardDescription className="text-gray-400">
                    Detalhes adicionais da operação
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-white">Observações</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Adicione observações sobre esta operação..."
                      className="bg-[#2A292B] border-gray-700 text-white placeholder-gray-500 resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="tradeImage" className="text-white">Imagem (Opcional)</Label>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <Input
                          id="tradeImage"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('tradeImage')?.click()}
                          className="bg-[#2A292B] border-gray-700 text-white hover:bg-[#3A393B]"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Imagem
                        </Button>
                      </div>
                      {imagePreview && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={removeImage}
                          className="bg-[#2A292B] border-gray-700 text-white hover:bg-[#3A393B]"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {imagePreview && (
                      <div className="mt-2">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-20 h-20 object-cover rounded-md"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Risk Assessment */}
            <div className="space-y-6">
              {/* Risk Assessment */}
              <Card className="bg-[#1A191B] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Avaliação de Risco</CardTitle>
                  <CardDescription className="text-gray-400">
                    Análise automática de risco
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {riskAssessment ? (
                    <>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Stop por Operação:</span>
                          <span className="text-white font-medium">
                            {riskAssessment.stopLossPerTrade.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Stop Diário:</span>
                          <span className="text-white font-medium">
                            {riskAssessment.dailyStopLimit.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Resultado:</span>
                          <span className={`font-medium ${riskAssessment.tradeResult > 0 ? 'text-green-500' : riskAssessment.tradeResult < 0 ? 'text-red-500' : 'text-yellow-500'}`}>
                            {riskAssessment.tradeResult.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Status de Risco:</span>
                          <span className={`font-medium ${riskAssessment.isOutOfRisk ? 'text-red-500' : 'text-green-500'}`}>
                            {riskAssessment.isOutOfRisk ? 'Fora de Risco' : 'Dentro do Risco'}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400">Selecione uma conta para ver a avaliação de risco</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Daily Risk Alert */}
              {dailyRiskAlert && (
                <Alert className="bg-[#2A292B] border-yellow-600 text-yellow-100">
                  <AlertDescription>{dailyRiskAlert}</AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full bg-[#02AC73] hover:bg-[#029B63] text-white font-medium"
                  disabled={isSubmitting}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Salvando...' : 'Salvar Operação'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-[#2A292B] border-gray-700 text-white hover:bg-[#3A393B]"
                  onClick={() => navigate('/dashboard')}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}