import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  Home, 
  Percent,
  Calendar,
  PiggyBank,
  FileText,
  Share2
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface FinancingResult {
  monthlyPayment: number;
  totalAmount: number;
  totalInterest: number;
  downPayment: number;
  financedAmount: number;
}

interface SimulationData {
  propertyValue: number;
  downPaymentPercent: number;
  interestRate: number;
  termYears: number;
  monthlyIncome: number;
}

export function FinancingCalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [simulation, setSimulation] = useState<SimulationData>({
    propertyValue: 500000,
    downPaymentPercent: 20,
    interestRate: 10.5,
    termYears: 30,
    monthlyIncome: 8000
  });
  const [result, setResult] = useState<FinancingResult | null>(null);

  const calculateFinancing = () => {
    const { propertyValue, downPaymentPercent, interestRate, termYears } = simulation;
    
    const downPayment = (propertyValue * downPaymentPercent) / 100;
    const financedAmount = propertyValue - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const totalPayments = termYears * 12;
    
    // Fórmula do SAC (Sistema de Amortização Constante) - aproximação
    const monthlyPayment = (financedAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                          (Math.pow(1 + monthlyRate, totalPayments) - 1);
    
    const totalAmount = monthlyPayment * totalPayments;
    const totalInterest = totalAmount - financedAmount;

    const calculatedResult: FinancingResult = {
      monthlyPayment,
      totalAmount,
      totalInterest,
      downPayment,
      financedAmount
    };

    setResult(calculatedResult);
  };

  const getAffordabilityStatus = () => {
    if (!result) return null;
    
    const incomeRatio = (result.monthlyPayment / simulation.monthlyIncome) * 100;
    
    if (incomeRatio <= 30) {
      return { status: 'excellent', label: 'Excelente', color: 'bg-green-100 text-green-700' };
    } else if (incomeRatio <= 40) {
      return { status: 'good', label: 'Bom', color: 'bg-blue-100 text-blue-700' };
    } else if (incomeRatio <= 50) {
      return { status: 'caution', label: 'Atenção', color: 'bg-yellow-100 text-yellow-700' };
    } else {
      return { status: 'risk', label: 'Alto Risco', color: 'bg-red-100 text-red-700' };
    }
  };

  const shareSimulation = () => {
    if (!result) return;
    
    const shareText = `
🏠 Simulação de Financiamento
💰 Valor do Imóvel: ${simulation.propertyValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
📊 Entrada: ${result.downPayment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
💳 Parcela: ${result.monthlyPayment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
⏰ Prazo: ${simulation.termYears} anos
📈 Taxa: ${simulation.interestRate}% a.a.

Simulado via Conecta IOS 🚀
    `.trim();

    if (navigator.share) {
      navigator.share({
        title: 'Simulação de Financiamento',
        text: shareText
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast({
        title: "Simulação Copiada!",
        description: "A simulação foi copiada para a área de transferência.",
      });
    }
  };

  const affordability = getAffordabilityStatus();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="outline">
          <Calculator className="h-4 w-4 mr-2" />
          Calculadora de Financiamento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Calculadora de Financiamento Imobiliário
          </DialogTitle>
          <DialogDescription>
            Simule diferentes cenários de financiamento para seus clientes
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="simulation" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simulation">Simulação</TabsTrigger>
            <TabsTrigger value="comparison">Comparação</TabsTrigger>
          </TabsList>

          <TabsContent value="simulation" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Home className="h-5 w-5" />
                    Dados do Financiamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="property-value">Valor do Imóvel (R$)</Label>
                    <Input
                      id="property-value"
                      type="number"
                      value={simulation.propertyValue}
                      onChange={(e) => setSimulation({...simulation, propertyValue: Number(e.target.value)})}
                      placeholder="500.000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="down-payment">Entrada (%)</Label>
                    <Select 
                      value={simulation.downPaymentPercent.toString()} 
                      onValueChange={(value) => setSimulation({...simulation, downPaymentPercent: Number(value)})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10% - Mínimo FGTS</SelectItem>
                        <SelectItem value="20">20% - Recomendado</SelectItem>
                        <SelectItem value="30">30% - Ótima condição</SelectItem>
                        <SelectItem value="40">40% - Excelente</SelectItem>
                        <SelectItem value="50">50% - Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="interest-rate">Taxa de Juros (% ao ano)</Label>
                    <Select 
                      value={simulation.interestRate.toString()} 
                      onValueChange={(value) => setSimulation({...simulation, interestRate: Number(value)})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="8.5">8,5% - FGTS</SelectItem>
                        <SelectItem value="9.5">9,5% - Caixa</SelectItem>
                        <SelectItem value="10.5">10,5% - Banco do Brasil</SelectItem>
                        <SelectItem value="11.5">11,5% - Itaú</SelectItem>
                        <SelectItem value="12.0">12,0% - Bradesco</SelectItem>
                        <SelectItem value="12.5">12,5% - Santander</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="term-years">Prazo (anos)</Label>
                    <Select 
                      value={simulation.termYears.toString()} 
                      onValueChange={(value) => setSimulation({...simulation, termYears: Number(value)})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 anos</SelectItem>
                        <SelectItem value="20">20 anos</SelectItem>
                        <SelectItem value="25">25 anos</SelectItem>
                        <SelectItem value="30">30 anos</SelectItem>
                        <SelectItem value="35">35 anos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="monthly-income">Renda Familiar (R$)</Label>
                    <Input
                      id="monthly-income"
                      type="number"
                      value={simulation.monthlyIncome}
                      onChange={(e) => setSimulation({...simulation, monthlyIncome: Number(e.target.value)})}
                      placeholder="8.000"
                    />
                  </div>

                  <Button onClick={calculateFinancing} className="w-full">
                    <Calculator className="h-4 w-4 mr-2" />
                    Calcular Financiamento
                  </Button>
                </CardContent>
              </Card>

              {/* Results */}
              <div className="space-y-4">
                {result && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <TrendingUp className="h-5 w-5 text-primary" />
                          Resultado da Simulação
                        </CardTitle>
                        {affordability && (
                          <Badge className={affordability.color}>
                            {affordability.label}
                          </Badge>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-2xl font-bold text-primary">
                              {result.monthlyPayment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                            <div className="text-sm text-muted-foreground">Parcela Mensal</div>
                          </div>

                          <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              {result.downPayment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                            <div className="text-sm text-muted-foreground">Entrada</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Valor Financiado:</span>
                            <span className="font-semibold">
                              {result.financedAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total de Juros:</span>
                            <span className="font-semibold text-red-600">
                              {result.totalInterest.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total a Pagar:</span>
                            <span className="font-semibold">
                              {(result.totalAmount + result.downPayment).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">% da Renda:</span>
                            <span className="font-semibold">
                              {((result.monthlyPayment / simulation.monthlyIncome) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <PiggyBank className="h-4 w-4" />
                          Dicas de Aprovação
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <span>Mantenha o CPF limpo no SPC/Serasa</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <span>Comprove renda estável há pelo menos 2 anos</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <span>Tenha relacionamento bancário sólido</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <span>Parcela não deve exceder 30% da renda</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex gap-2">
                      <Button onClick={shareSimulation} variant="outline" className="flex-1">
                        <Share2 className="h-4 w-4 mr-2" />
                        Compartilhar
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <FileText className="h-4 w-4 mr-2" />
                        Salvar PDF
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Comparação de Cenários</CardTitle>
                <CardDescription>
                  Compare diferentes opções de financiamento lado a lado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Calculator className="h-12 w-12 mx-auto mb-4" />
                  <p>Funcionalidade de comparação será implementada em breve</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}