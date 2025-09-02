import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calculator, 
  FileText, 
  TrendingUp, 
  Home, 
  DollarSign, 
  PieChart,
  MapPin,
  Calendar,
  UserCheck,
  Briefcase,
  Target,
  BarChart3
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { CommissionCalculator } from '@/components/CommissionCalculator';
import { formatCurrency } from '@/lib/utils';

interface FinancingResult {
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
}

interface MarketAnalysis {
  averagePrice: number;
  pricePerSqm: number;
  appreciation: number;
  timeOnMarket: number;
}

export function ExpandedFerramentas() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  
  // Financing Calculator States
  const [propertyValue, setPropertyValue] = useState('');
  const [downPayment, setDownPayment] = useState('');
  const [interestRate, setInterestRate] = useState('10.5');
  const [loanTerm, setLoanTerm] = useState('360');
  const [financingResult, setFinancingResult] = useState<FinancingResult | null>(null);

  // Market Analysis States
  const [neighborhood, setNeighborhood] = useState('');
  const [propertyType, setPropertyType] = useState('apartamento');
  const [marketData, setMarketData] = useState<MarketAnalysis | null>(null);

  // Contract Generator States
  const [contractType, setContractType] = useState('compra');
  const [buyerName, setBuyerName] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');

  const tools = [
    {
      id: 'commission',
      name: 'Calculadora de Comissão',
      description: 'Calcule comissões e divisões',
      icon: Calculator,
      category: 'Financeiro'
    },
    {
      id: 'financing',
      name: 'Simulador de Financiamento',
      description: 'Simule financiamentos imobiliários',
      icon: DollarSign,
      category: 'Financeiro'
    },
    {
      id: 'market',
      name: 'Análise de Mercado',
      description: 'Análise de preços por região',
      icon: TrendingUp,
      category: 'Análise'
    },
    {
      id: 'contracts',
      name: 'Gerador de Contratos',
      description: 'Gere contratos automaticamente',
      icon: FileText,
      category: 'Documentos'
    },
    {
      id: 'roi',
      name: 'Calculadora de ROI',
      description: 'Retorno sobre investimento',
      icon: PieChart,
      category: 'Análise'
    },
    {
      id: 'valuation',
      name: 'Avaliação de Imóveis',
      description: 'Estime o valor de mercado',
      icon: Home,
      category: 'Análise'
    },
    {
      id: 'schedule',
      name: 'Agenda de Visitas',
      description: 'Gerencie visitas e reuniões',
      icon: Calendar,
      category: 'Produtividade'
    },
    {
      id: 'leads',
      name: 'Qualificação de Leads',
      description: 'Score e classificação automática',
      icon: UserCheck,
      category: 'CRM'
    }
  ];

  const calculateFinancing = () => {
    const value = parseFloat(propertyValue.replace(/\D/g, '')) || 0;
    const down = parseFloat(downPayment.replace(/\D/g, '')) || 0;
    const rate = parseFloat(interestRate) / 100 / 12; // Monthly rate
    const months = parseInt(loanTerm);
    
    const loanAmount = value - down;
    
    if (loanAmount <= 0 || rate <= 0 || months <= 0) {
      toast({
        title: "Erro",
        description: "Verifique os valores inseridos",
        variant: "destructive",
      });
      return;
    }

    // PMT formula
    const monthlyPayment = loanAmount * (rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
    const totalPayment = monthlyPayment * months;
    const totalInterest = totalPayment - loanAmount;

    setFinancingResult({
      monthlyPayment,
      totalInterest,
      totalPayment
    });
  };

  const analyzeMarket = () => {
    // Simulate market analysis with mock data
    const mockData: MarketAnalysis = {
      averagePrice: Math.random() * 500000 + 300000,
      pricePerSqm: Math.random() * 3000 + 2000,
      appreciation: Math.random() * 10 + 2,
      timeOnMarket: Math.random() * 90 + 30
    };
    
    setMarketData(mockData);
    toast({
      title: "Análise Concluída",
      description: `Dados do mercado para ${neighborhood} foram atualizados`,
    });
  };

  const generateContract = () => {
    // Simulate contract generation
    toast({
      title: "Contrato Gerado! 📄",
      description: "Contrato básico criado. Revise antes de usar.",
    });
  };

  const categories = [...new Set(tools.map(tool => tool.category))];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary mb-2">
          Ferramentas Profissionais
        </h2>
        <p className="text-muted-foreground">
          Kit completo de ferramentas para corretores de imóveis
        </p>
      </div>

      <Tabs defaultValue={categories[0]} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tools
                .filter(tool => tool.category === category)
                .map((tool) => (
                  <Card 
                    key={tool.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedTool(tool.id)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <tool.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg">{tool.name}</h3>
                          <Badge variant="outline" className="mt-1">
                            {tool.category}
                          </Badge>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {tool.description}
                      </p>
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTool(tool.id);
                        }}
                      >
                        Abrir Ferramenta
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Tool Dialogs */}
      {/* Commission Calculator */}
      <Dialog open={selectedTool === 'commission'} onOpenChange={() => setSelectedTool(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Calculadora de Comissão
            </DialogTitle>
          </DialogHeader>
          <CommissionCalculator 
            propertyValue={500000}
            onCommissionChange={(commission) => {
              console.log('Commission calculated:', commission);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Financing Calculator */}
      <Dialog open={selectedTool === 'financing'} onOpenChange={() => setSelectedTool(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Simulador de Financiamento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="propertyValue">Valor do Imóvel</Label>
                <Input
                  id="propertyValue"
                  value={propertyValue}
                  onChange={(e) => setPropertyValue(e.target.value)}
                  placeholder="R$ 500.000"
                />
              </div>
              <div>
                <Label htmlFor="downPayment">Entrada</Label>
                <Input
                  id="downPayment"
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value)}
                  placeholder="R$ 100.000"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="interestRate">Taxa de Juros (% ao ano)</Label>
                <Input
                  id="interestRate"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  placeholder="10.5"
                />
              </div>
              <div>
                <Label htmlFor="loanTerm">Prazo (meses)</Label>
                <Select value={loanTerm} onValueChange={setLoanTerm}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="120">10 anos</SelectItem>
                    <SelectItem value="180">15 anos</SelectItem>
                    <SelectItem value="240">20 anos</SelectItem>
                    <SelectItem value="300">25 anos</SelectItem>
                    <SelectItem value="360">30 anos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button onClick={calculateFinancing} className="w-full">
              Calcular Financiamento
            </Button>
            
            {financingResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Resultado da Simulação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Parcela Mensal:</span>
                    <span className="font-bold text-primary">
                      {formatCurrency(financingResult.monthlyPayment)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total de Juros:</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(financingResult.totalInterest)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total a Pagar:</span>
                    <span className="font-bold">
                      {formatCurrency(financingResult.totalPayment)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Market Analysis */}
      <Dialog open={selectedTool === 'market'} onOpenChange={() => setSelectedTool(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Análise de Mercado
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Vila Madalena"
                />
              </div>
              <div>
                <Label htmlFor="propertyType">Tipo de Imóvel</Label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartamento">Apartamento</SelectItem>
                    <SelectItem value="casa">Casa</SelectItem>
                    <SelectItem value="terreno">Terreno</SelectItem>
                    <SelectItem value="comercial">Comercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button onClick={analyzeMarket} className="w-full" disabled={!neighborhood}>
              Analisar Mercado
            </Button>
            
            {marketData && (
              <Card>
                <CardHeader>
                  <CardTitle>Dados do Mercado - {neighborhood}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Preço Médio</p>
                    <p className="text-xl font-bold text-primary">
                      {formatCurrency(marketData.averagePrice)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Preço por m²</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(marketData.pricePerSqm)}/m²
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Valorização/Ano</p>
                    <p className="text-xl font-bold text-green-600">
                      +{marketData.appreciation.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Tempo no Mercado</p>
                    <p className="text-xl font-bold">
                      {Math.round(marketData.timeOnMarket)} dias
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Contract Generator */}
      <Dialog open={selectedTool === 'contracts'} onOpenChange={() => setSelectedTool(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Gerador de Contratos
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="contractType">Tipo de Contrato</Label>
              <Select value={contractType} onValueChange={setContractType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compra">Compra e Venda</SelectItem>
                  <SelectItem value="locacao">Locação</SelectItem>
                  <SelectItem value="intermediacao">Intermediação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="buyerName">Nome do Comprador</Label>
                <Input
                  id="buyerName"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="João Silva"
                />
              </div>
              <div>
                <Label htmlFor="sellerName">Nome do Vendedor</Label>
                <Input
                  id="sellerName"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  placeholder="Maria Santos"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="propertyAddress">Endereço do Imóvel</Label>
              <Input
                id="propertyAddress"
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
                placeholder="Rua das Flores, 123 - São Paulo/SP"
              />
            </div>
            
            <Button 
              onClick={generateContract} 
              className="w-full"
              disabled={!buyerName || !sellerName || !propertyAddress}
            >
              Gerar Contrato
            </Button>
            
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
              <p className="font-medium mb-1">⚠️ Importante:</p>
              <p>Este é um contrato básico. Sempre revise com um advogado antes de usar.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Placeholder dialogs for other tools */}
      {['roi', 'valuation', 'schedule', 'leads'].map((toolId) => (
        <Dialog key={toolId} open={selectedTool === toolId} onOpenChange={() => setSelectedTool(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {tools.find(t => t.id === toolId)?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                {(() => {
                  const Tool = tools.find(t => t.id === toolId)?.icon || Calculator;
                  return <Tool className="h-8 w-8 text-primary" />;
                })()}
              </div>
              <h3 className="text-lg font-semibold mb-2">Em Desenvolvimento</h3>
              <p className="text-muted-foreground">
                Esta ferramenta estará disponível em breve!
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  toast({
                    title: "Obrigado pelo interesse!",
                    description: "Você será notificado quando a ferramenta estiver pronta.",
                  });
                }}
              >
                Notificar Quando Pronto
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
}