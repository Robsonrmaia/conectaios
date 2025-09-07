import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao ConectaIOS!',
    description: 'Vamos fazer um tour rápido pelas principais funcionalidades da plataforma.',
    target: '',
    position: 'bottom'
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Aqui você tem uma visão geral dos seus imóveis, clientes e negociações.',
    target: '[href="/app"]',
    position: 'right'
  },
  {
    id: 'properties',
    title: 'Meus Imóveis',
    description: 'Gerencie todos os seus imóveis, fotos e descrições em um só lugar.',
    target: '[href="/app/imoveis"]',
    position: 'right'
  },
  {
    id: 'marketplace',
    title: 'Marketplace',
    description: 'Veja imóveis de outros corretores e encontre oportunidades de parcerias.',
    target: '[href="/app/marketplace"]',
    position: 'right'
  },
  {
    id: 'match',
    title: 'Match',
    description: 'Nossa IA encontra os melhores imóveis para seus clientes automaticamente.',
    target: '[href="/app/match"]',
    position: 'right'
  },
  {
    id: 'crm',
    title: 'CRM',
    description: 'Organize seus clientes, pipeline de vendas e histórico de interações.',
    target: '[href="/app/crm"]',
    position: 'right'
  },
  {
    id: 'tools',
    title: 'Ferramentas',
    description: 'Use nossas ferramentas de IA: descrições automáticas, melhoramento de fotos e muito mais.',
    target: '[href="/app/ferramentas"]',
    position: 'right'
  }
];

interface OnboardingTourProps {
  onComplete: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const step = tourSteps[currentStep];
    if (step.target) {
      const element = document.querySelector(step.target) as HTMLElement;
      setTargetElement(element);
      
      // Scroll to element and highlight it
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.style.position = 'relative';
        element.style.zIndex = '1001';
        element.style.boxShadow = '0 0 0 4px hsl(var(--primary)), 0 0 0 8px hsl(var(--primary) / 0.3)';
        element.style.borderRadius = '8px';
      }
    }

    return () => {
      if (targetElement) {
        targetElement.style.boxShadow = '';
        targetElement.style.position = '';
        targetElement.style.zIndex = '';
        targetElement.style.borderRadius = '';
      }
    };
  }, [currentStep, targetElement]);

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      closeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const closeTour = () => {
    setIsVisible(false);
    if (targetElement) {
      targetElement.style.boxShadow = '';
      targetElement.style.position = '';
      targetElement.style.zIndex = '';
      targetElement.style.borderRadius = '';
    }
    onComplete();
  };

  const skipTour = () => {
    closeTour();
  };

  if (!isVisible) return null;

  const step = tourSteps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-1000" />
      
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-1001 w-full max-w-md mx-4"
        >
          <Card className="shadow-2xl border-primary/20">
            <CardHeader className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={closeTour}
                className="absolute right-2 top-2 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
              <CardTitle className="text-xl">{step.title}</CardTitle>
              <CardDescription className="text-base">
                {step.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Progresso</span>
                  <span>{currentStep + 1} / {tourSteps.length}</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between">
                <div className="flex gap-2">
                  {currentStep > 0 && (
                    <Button variant="outline" onClick={prevStep}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Anterior
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={skipTour}>
                    Pular tour
                  </Button>
                  <Button onClick={nextStep}>
                    {currentStep === tourSteps.length - 1 ? 'Finalizar' : 'Próximo'}
                    {currentStep < tourSteps.length - 1 && (
                      <ArrowRight className="h-4 w-4 ml-2" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </>
  );
}