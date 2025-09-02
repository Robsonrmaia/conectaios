import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Calculator, 
  FileText, 
  Camera, 
  BarChart3, 
  Users, 
  Mail, 
  Lock, 
  Crown, 
  Home,
  Zap,
  Target,
  Briefcase,
  PieChart,
  Building,
  TrendingUp,
  DollarSign,
  FileCheck,
  Presentation
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useBroker } from '@/hooks/useBroker';
import { ExpandedFerramentas } from '@/components/ExpandedFerramentas';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  planRequired: string;
  isAvailable: boolean;
}

export default function Ferramentas() {
  const navigate = useNavigate();
  const { broker, plan } = useBroker();
  
  const tools: Tool[] = [
    {
      id: 'calculator',
      name: 'Calculadora de Financiamento',
      description: 'Simule financiamentos e apresente opções aos clientes',
      icon: Calculator,
      category: 'Vendas',
      planRequired: 'starter',
      isAvailable: true
    },
    {
      id: 'commission-calc',
      name: 'Calculadora de Comissão',
      description: 'Calcule comissões e divisões entre parceiros',
      icon: DollarSign,
      category: 'Vendas',
      planRequired: 'starter',
      isAvailable: true
    },
    {
      id: 'contracts',
      name: 'Gerador de Contratos',
      description: 'Gere contratos personalizados automaticamente',
      icon: FileText,
      category: 'Documentos',
      planRequired: 'professional',  
      isAvailable: plan?.slug === 'professional' || plan?.slug === 'premium'
    },
    {
      id: 'market-analysis',
      name: 'Análise de Mercado',
      description: 'Relatórios detalhados sobre tendências imobiliárias',
      icon: TrendingUp,
      category: 'Análise',
      planRequired: 'professional',
      isAvailable: plan?.slug === 'professional' || plan?.slug === 'premium'
    },
    {
      id: 'presentation-builder',
      name: 'Criador de Apresentações',
      description: 'Monte apresentações profissionais para seus imóveis',
      icon: Presentation,
      category: 'Marketing',
      planRequired: 'professional',
      isAvailable: plan?.slug === 'professional' || plan?.slug === 'premium'
    },
    {
      id: 'crm-advanced',
      name: 'CRM Avançado',
      description: 'Gestão completa de clientes e funil de vendas',
      icon: Users,
      category: 'CRM',
      planRequired: 'starter',
      isAvailable: true
    }
  ];

  const handleToolAccess = (tool: Tool) => {
    if (!tool.isAvailable) {
      toast({
        title: "Upgrade Necessário",
        description: `Esta ferramenta requer o plano ${tool.planRequired}. Faça upgrade para acessar.`,
        variant: "destructive",
      });
      return;
    }

    switch (tool.id) {
      case 'crm-advanced':
        navigate('/app/crm');
        break;
      case 'contracts':
        navigate('/app/deals');
        break;
      default:
        toast({
          title: "Ferramenta",
          description: `Abrindo ${tool.name}...`,
        });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/app')}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-brand-secondary bg-clip-text text-transparent">
              Ferramentas
            </h1>
            <p className="text-muted-foreground">
              Potencialize suas vendas com nossas ferramentas profissionais
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map(tool => {
          const IconComponent = tool.icon;
          return (
            <Card 
              key={tool.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                !tool.isAvailable ? 'opacity-60' : ''
              }`}
              onClick={() => handleToolAccess(tool)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    tool.isAvailable 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{tool.name}</CardTitle>
                </div>
              </CardHeader>
              
              <CardContent>
                <CardDescription className="text-sm mb-4">
                  {tool.description}
                </CardDescription>
                
                <div className="flex justify-between items-center">
                  {tool.isAvailable ? (
                    <Badge variant="outline" className="text-green-600">
                      <Zap className="h-3 w-3 mr-1" />
                      Disponível
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-orange-600">
                      <Lock className="h-3 w-3 mr-1" />
                      Upgrade
                    </Badge>
                  )}
                  
                  <Button size="sm" variant={tool.isAvailable ? "default" : "outline"}>
                    {tool.isAvailable ? 'Abrir' : 'Upgrade'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {/* Calculator Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Calculator className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">Calculadora</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm mb-4">
              Simule financiamentos imobiliários
            </CardDescription>
            <Button variant="outline" className="w-full">
              Abrir Calculadora
            </Button>
          </CardContent>
        </Card>
      </div>

      <ExpandedFerramentas />
    </div>
  );
}