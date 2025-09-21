import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Calculator, Percent, DollarSign, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface CommissionCalculatorProps {
  propertyValue: number;
  businessType?: string;
  onCommissionChange: (commission: {
    percentage: number;
    value: number;
    splitType: string;
    buyerSplit: number;
    sellerSplit: number;
    businessType: string;
  }) => void;
  initialCommission?: {
    percentage: number;
    splitType: string;
    buyerSplit: number;
    sellerSplit: number;
    businessType?: string;
  };
}

export const CommissionCalculator: React.FC<CommissionCalculatorProps> = ({
  propertyValue,
  businessType = "venda",
  onCommissionChange,
  initialCommission
}) => {
  const [currentBusinessType, setCurrentBusinessType] = useState(
    initialCommission?.businessType || businessType || "venda"
  );
  const [commissionPercentage, setCommissionPercentage] = useState(
    initialCommission?.percentage || (currentBusinessType === "venda" ? 5 : currentBusinessType === "temporada" ? 20 : 100)
  );
  const [splitType, setSplitType] = useState(
    initialCommission?.splitType || "50/50"
  );
  const [customBuyerSplit, setCustomBuyerSplit] = useState(
    initialCommission?.buyerSplit || 50
  );

  // Calculate commission value and splits based on business type
  const getCommissionValue = () => {
    switch (currentBusinessType) {
      case "locacao":
        // For rentals, commission is 100% of the first rent
        return propertyValue;
      case "temporada":
        // For seasonal rentals, commission is a percentage (10-30%)
        return (propertyValue * commissionPercentage) / 100;
      case "venda":
      default:
        // For sales, commission is a percentage (3-10%)
        return (propertyValue * commissionPercentage) / 100;
    }
  };

  const commissionValue = getCommissionValue();
  const buyerSplit = splitType === "Custom" ? customBuyerSplit : parseInt(splitType.split("/")[0]);
  const sellerSplit = 100 - buyerSplit;
  const buyerCommission = (commissionValue * buyerSplit) / 100;
  const sellerCommission = (commissionValue * sellerSplit) / 100;

  // Update parent component when values change
  useEffect(() => {
    onCommissionChange({
      percentage: commissionPercentage,
      value: commissionValue,
      splitType,
      buyerSplit,
      sellerSplit,
      businessType: currentBusinessType,
    });
  }, [propertyValue, commissionPercentage, splitType, customBuyerSplit, currentBusinessType, onCommissionChange]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-primary">
          Calculadora de Comissão
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Negócio</label>
            <Select value={currentBusinessType} onValueChange={setCurrentBusinessType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="venda">Venda</SelectItem>
                <SelectItem value="locacao">Locação</SelectItem>
                <SelectItem value="temporada">Temporada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {currentBusinessType !== "locacao" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {currentBusinessType === "temporada" 
                  ? `Percentual de Comissão: ${commissionPercentage}%`
                  : `Percentual de Comissão: ${commissionPercentage}%`
                }
              </label>
              <Slider
                value={[commissionPercentage]}
                onValueChange={(value) => setCommissionPercentage(value[0])}
                max={currentBusinessType === "temporada" ? 30 : 10}
                min={currentBusinessType === "temporada" ? 10 : 3}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{currentBusinessType === "temporada" ? "10%" : "3%"}</span>
                <span>{currentBusinessType === "temporada" ? "30%" : "10%"}</span>
              </div>
            </div>
          )}

          {currentBusinessType === "locacao" && (
            <div className="p-3 bg-info/10 rounded-lg border border-info/20">
              <p className="text-sm text-info-foreground">
                <strong>Locação:</strong> A comissão é de 100% do valor do primeiro aluguel.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Rateio da Comissão</label>
            <Select value={splitType} onValueChange={setSplitType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50/50">50/50 - Divisão igual</SelectItem>
                <SelectItem value="60/40">60/40 - Captador leva mais</SelectItem>
                <SelectItem value="70/30">70/30 - Captador leva muito mais</SelectItem>
                <SelectItem value="Custom">Customizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {splitType === "Custom" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Percentual do Corretor {currentBusinessType === "venda" ? "Comprador" : "Locatário"}: {customBuyerSplit}%
              </label>
              <Slider
                value={[customBuyerSplit]}
                onValueChange={(value) => setCustomBuyerSplit(value[0])}
                max={90}
                min={10}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10%</span>
                <span>90%</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <div className="text-sm font-medium text-primary">
                Corretor {currentBusinessType === "venda" ? "Comprador" : "Locatário"}
              </div>
              <div className="text-lg font-bold">{formatCurrency(buyerCommission)}</div>
              <div className="text-xs text-muted-foreground">{buyerSplit}% da comissão</div>
            </div>
            
            <div className="p-3 bg-secondary/10 rounded-lg">
              <div className="text-sm font-medium text-secondary">
                Corretor {currentBusinessType === "venda" ? "Vendedor" : "Locador"}
              </div>
              <div className="text-lg font-bold">{formatCurrency(sellerCommission)}</div>
              <div className="text-xs text-muted-foreground">{sellerSplit}% da comissão</div>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <h4 className="font-medium">Resumo da Comissão</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Valor {currentBusinessType === "venda" ? "do Imóvel" : "do Aluguel/Diária"}:</span>
              <span className="font-medium">{formatCurrency(propertyValue)}</span>
            </div>
            <div className="flex justify-between">
              <span>
                Comissão Total 
                 {currentBusinessType === "locacao" 
                   ? " (100% do 1º aluguel)" 
                   : ` (${commissionPercentage}%)`
                }:
              </span>
              <span className="font-medium text-primary">{formatCurrency(commissionValue)}</span>
            </div>
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between">
                <span>Corretor {currentBusinessType === "venda" ? "Comprador" : "Locatário"} ({buyerSplit}%):</span>
                <span className="font-medium">{formatCurrency(buyerCommission)}</span>
              </div>
              <div className="flex justify-between">
                <span>Corretor {currentBusinessType === "venda" ? "Vendedor" : "Locador"} ({sellerSplit}%):</span>
                <span className="font-medium">{formatCurrency(sellerCommission)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};