import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Image, 
  MessageSquare, 
  FileText, 
  MapPin, 
  BarChart3, 
  Home, 
  Building2, 
  ArrowLeft,
  CheckCircle,
  Crown,
  Zap,
  Building
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useBroker } from "@/hooks/useBroker";
import { ExternalToolModal } from "@/components/ExternalToolModal";
import { AnimatedCard } from "@/components/AnimatedCard";

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: string;
  planRequired?: 'basic' | 'pro' | 'premium';
  isAvailable?: boolean;
  url?: string;
  external?: boolean;
  gradient: string;
}

const Ferramentas = () => {
  const [externalTool, setExternalTool] = useState<{ name: string; url: string } | null>(null);
  const navigate = useNavigate();
  const { broker } = useBroker();

  const toolCategories = {
    marketing: {
      title: "🎯 Marketing & Vendas",
      description: "Ferramentas para promover e vender seus imóveis",
      tools: [
        {
          id: "image-creator",
          name: "Criador de Imagens Pró",
          description: "Gere imagens profissionais para seus imóveis usando IA",
          icon: Image,
          category: "marketing",
          planRequired: 'pro' as const,
          isAvailable: true,
          gradient: "from-purple-500 to-pink-500"
        },
        {
          id: "whatsapp-sender",
          name: "Disparador WhatsApp",
          description: "Envie mensagens personalizadas em massa via WhatsApp",
          icon: MessageSquare,
          category: "marketing",
          planRequired: 'pro' as const,
          isAvailable: true,
          gradient: "from-green-500 to-emerald-500"
        }
      ]
    },
    analysis: {
      title: "📊 Análise & Mercado",
      description: "Dados e insights do mercado imobiliário",
      tools: [
        {
          id: "neighborhood-guide",
          name: "Guia de Bairros",
          description: "Informações detalhadas sobre bairros e regiões",
          icon: MapPin,
          category: "analysis",
          planRequired: 'basic' as const,
          isAvailable: true,
          gradient: "from-blue-500 to-cyan-500"
        },
        {
          id: "market-analysis",
          name: "Análise de Mercado",
          description: "Relatórios completos do mercado imobiliário",
          icon: BarChart3,
          category: "analysis",
          planRequired: 'pro' as const,
          isAvailable: true,
          gradient: "from-orange-500 to-red-500"
        },
        {
          id: "property-valuation",
          name: "Avaliação Imobiliária",
          description: "Avalie imóveis usando dados de mercado",
          icon: Home,
          category: "analysis",
          planRequired: 'pro' as const,
          isAvailable: true,
          gradient: "from-indigo-500 to-purple-500"
        }
      ]
    },
    documents: {
      title: "📄 Documentos & Contratos",
      description: "Geração de documentos e contratos profissionais",
      tools: [
        {
          id: "contract-generator",
          name: "Gerador de Contratos",
          description: "Crie contratos personalizados para seus clientes",
          icon: FileText,
          category: "documents",
          planRequired: 'basic' as const,
          isAvailable: true,
          gradient: "from-teal-500 to-green-500"
        },
        {
          id: "buyer-guide",
          name: "Guia do Comprador",
          description: "Materiais educativos para seus clientes compradores",
          icon: Building2,
          category: "documents",
          planRequired: 'basic' as const,
          isAvailable: true,
          gradient: "from-yellow-500 to-orange-500"
        },
        {
          id: "property-inspection",
          name: "Vistoria de Imóveis",
          description: "Checklist e relatórios de vistoria profissional",
          icon: CheckCircle,
          category: "documents",
          planRequired: 'pro' as const,
          isAvailable: true,
          gradient: "from-emerald-500 to-teal-500"
        }
      ]
    },
    management: {
      title: "🏠 Gestão de Propriedades",
      description: "Ferramentas para gerenciar seu portfólio",
      tools: [
        {
          id: "seasonal-budget",
          name: "Orçamento Temporada",
          description: "Planeje orçamentos para temporadas turísticas",
          icon: Building,
          category: "management",
          planRequired: 'pro' as const,
          isAvailable: true,
          gradient: "from-rose-500 to-pink-500"
        }
      ]
    }
  };

  const handleToolAccess = (tool: Tool) => {
    if (tool.external && tool.url) {
      setExternalTool({ name: tool.name, url: tool.url });
      return;
    }

    if (!tool.isAvailable) {
      toast({
        title: "Em Breve",
        description: "Esta ferramenta está em desenvolvimento.",
        variant: "default"
      });
      return;
    }

    // Handle internal navigation
    switch (tool.id) {
      case "image-creator":
        navigate("/app/ai-assistant");
        break;
      case "whatsapp-sender":
        navigate("/app/inbox");
        break;
      case "contract-generator":
      case "neighborhood-guide":
      case "market-analysis":
      case "property-valuation":
      case "buyer-guide":
      case "property-inspection":
      case "seasonal-budget":
        toast({
          title: tool.name,
          description: "Funcionalidade em desenvolvimento.",
        });
        break;
      default:
        toast({
          title: "Em Desenvolvimento",
          description: "Esta ferramenta está sendo desenvolvida.",
        });
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto p-6 space-y-8">
        <motion.div 
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/app/dashboard")}
            className="flex items-center gap-2 hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Button>
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Ferramentas
            </h1>
            <p className="text-muted-foreground mt-2">Potencialize seu negócio imobiliário</p>
          </div>
          <div className="w-20" /> {/* Spacer for balance */}
        </motion.div>

        <div className="space-y-12">
          {Object.entries(toolCategories).map(([categoryKey, category]) => (
            <motion.div 
              key={categoryKey} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: categoryKey === 'marketing' ? 0 : 0.1 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">{category.title}</h2>
                <p className="text-muted-foreground">{category.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.tools.map((tool, index) => {
                  const IconComponent = tool.icon;
                  
                  return (
                    <motion.div
                      key={tool.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ y: -5 }}
                    >
                      <AnimatedCard 
                        className="group cursor-pointer border-0 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 h-full"
                        onClick={() => handleToolAccess(tool)}
                      >
                        <div className="p-6 space-y-4 h-full flex flex-col">
                          <div className="flex items-start justify-between">
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${tool.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                              <IconComponent className="h-6 w-6 text-white" />
                            </div>
                            {tool.planRequired && (
                              <Badge 
                                variant={tool.planRequired === 'premium' ? 'default' : 'secondary'}
                                className="shadow-sm"
                              >
                                {tool.planRequired === 'premium' && <Crown className="h-3 w-3 mr-1" />}
                                {tool.planRequired.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="space-y-2 flex-1">
                            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                              {tool.name}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {tool.description}
                            </p>
                          </div>
                          
                          <Button 
                            className="w-full bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300"
                            variant="default"
                          >
                            <Zap className="h-4 w-4 mr-2" />
                            Usar Ferramenta
                          </Button>
                        </div>
                      </AnimatedCard>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {externalTool && (
          <ExternalToolModal
            isOpen={!!externalTool}
            onClose={() => setExternalTool(null)}
            toolName={externalTool.name}
            toolUrl={externalTool.url}
          />
        )}
      </div>
    </div>
  );
};

export default Ferramentas;