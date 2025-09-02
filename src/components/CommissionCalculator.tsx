import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Calculator, Percent, DollarSign, Users } from 'lucide-react';
import { formatCurrency, parseValueInput } from '@/lib/utils';

interface CommissionCalculatorProps {
  propertyValue: number;
  onCommissionChange: (commission: {
    percentage: number;
    value: number;
    splitType: string;
    buyerSplit: number;
    sellerSplit: number;
  }) => void;
  initialCommission?: {
    percentage?: number;
    splitType?: string;
    buyerSplit?: number;
    sellerSplit?: number;
  };
}

export function CommissionCalculator({
  propertyValue,
  onCommissionChange,
  initialCommission = {}
}: CommissionCalculatorProps) {
  const [commissionPercentage, setCommissionPercentage] = useState(
    initialCommission.percentage || 6
  );
  const [splitType, setSplitType] = useState(
    initialCommission.splitType || '50/50'
  );
  const [customBuyerSplit, setCustomBuyerSplit] = useState(
    initialCommission.buyerSplit || 50
  );

  const commissionValue = (propertyValue * commissionPercentage) / 100;
  
  const buyerSplit = splitType === 'custom' ? customBuyerSplit : 
                     splitType === '60/40' ? 60 : 50;
  const sellerSplit = 100 - buyerSplit;

  const buyerCommission = (commissionValue * buyerSplit) / 100;
  const sellerCommission = (commissionValue * sellerSplit) / 100;

  useEffect(() => {
    onCommissionChange({
      percentage: commissionPercentage,
      value: commissionValue,
      splitType,
      buyerSplit,
      sellerSplit
    });
  }, [commissionPercentage, splitType, customBuyerSplit, propertyValue]);

  const predefinedSplits = [
    { label: '50/50', value: '50/50', description: 'Divisão igual' },
    { label: '60/40', value: '60/40', description: 'Captador leva mais' },
    { label: '70/30', value: '70/30', description: 'Captador leva muito mais' },
    { label: 'Customizado', value: 'custom', description: 'Defina sua divisão' }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Calculadora de Comissão
          <Badge variant="outline">
            {commissionPercentage}% • {formatCurrency(commissionValue)}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Commission Percentage */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Percentual da Comissão
            </Label>
            <span className="text-sm font-medium">{commissionPercentage}%</span>
          </div>
          
          <Slider
            value={[commissionPercentage]}
            onValueChange={(value) => setCommissionPercentage(value[0])}
            max={10}
            min={3}
            step={0.5}
            className="w-full"
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>3% (mínimo)</span>
            <span>10% (máximo)</span>
          </div>
        </div>

        {/* Commission Value */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium">
              <DollarSign className="h-4 w-4" />
              Valor Total da Comissão
            </span>
            <span className="text-lg font-bold text-primary">
              {formatCurrency(commissionValue)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {commissionPercentage}% sobre {formatCurrency(propertyValue)}
          </p>
        </div>

        {/* Split Configuration */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Rateio da Comissão
          </Label>
          
          <Select value={splitType} onValueChange={setSplitType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {predefinedSplits.map((split) => (
                <SelectItem key={split.value} value={split.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{split.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {split.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Custom Split */}
          {splitType === 'custom' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Corretor Captador (%)</Label>
                <span className="text-sm font-medium">{customBuyerSplit}%</span>
              </div>
              
              <Slider
                value={[customBuyerSplit]}
                onValueChange={(value) => setCustomBuyerSplit(value[0])}
                max={90}
                min={10}
                step={5}
                className="w-full"
              />
              
              <div className="text-center text-xs text-muted-foreground">
                Corretor Vendedor recebe: {100 - customBuyerSplit}%
              </div>
            </div>
          )}

          {/* Split Preview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <div className="text-sm font-medium text-primary">Corretor Captador</div>
              <div className="text-lg font-bold">{formatCurrency(buyerCommission)}</div>
              <div className="text-xs text-muted-foreground">{buyerSplit}% da comissão</div>
            </div>
            
            <div className="p-3 bg-secondary/10 rounded-lg">
              <div className="text-sm font-medium text-secondary">Corretor Vendedor</div>
              <div className="text-lg font-bold">{formatCurrency(sellerCommission)}</div>
              <div className="text-xs text-muted-foreground">{sellerSplit}% da comissão</div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="border-t pt-4">
          <div className="text-sm text-muted-foreground space-y-1">
            <div>💰 Valor do imóvel: {formatCurrency(propertyValue)}</div>
            <div>📊 Comissão total: {formatCurrency(commissionValue)} ({commissionPercentage}%)</div>
            <div>🤝 Rateio: {buyerSplit}% / {sellerSplit}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}