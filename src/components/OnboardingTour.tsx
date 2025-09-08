import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Target, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector
  position: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    id: 'dashboard',
    title: 'Bem-vindo ao ConectAIOS!',
    description: 'Este é seu painel principal onde você pode acessar todas as funcionalidades.',
    target: '[data-tour="dashboard"]',
    position: 'bottom'
  },
  {
    id: 'properties',
    title: 'Seus Imóveis',
    description: 'Aqui você gerencia todos os seus imóveis. Adicione fotos, descrições e preços.',
    target: '[data-tour="properties"]',
    position: 'right'
  },
  {
    id: 'minisite',
    title: 'Seu Mini Site',
    description: 'Crie e personalize seu mini site profissional para mostrar seus imóveis.',
    target: '[data-tour="minisite"]',
    position: 'right'
  },
  {
    id: 'crm',
    title: 'CRM - Gestão de Clientes',
    description: 'Organize seus clientes, acompanhe negociações e historico de contatos.',
    target: '[data-tour="crm"]',
    position: 'right'
  },
  {
    id: 'tools',
    title: 'Ferramentas',
    description: 'Acesse calculadoras, geradores de contrato e outras ferramentas úteis.',
    target: '[data-tour="tools"]',
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
    const updateTargetElement = () => {
      const step = tourSteps[currentStep];
      const element = document.querySelector(step.target) as HTMLElement;
      setTargetElement(element);
      
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.style.position = 'relative';
        element.style.zIndex = '1001';
        element.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 20px rgba(0, 0, 0, 0.3)';
        element.style.borderRadius = '8px';
      }
    };

    if (isVisible) {
      setTimeout(updateTargetElement, 100);
    }

    return () => {
      if (targetElement) {
        targetElement.style.position = '';
        targetElement.style.zIndex = '';
        targetElement.style.boxShadow = '';
        targetElement.style.borderRadius = '';
      }
    };
  }, [currentStep, isVisible, targetElement]);

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
      targetElement.style.position = '';
      targetElement.style.zIndex = '';
      targetElement.style.boxShadow = '';
      targetElement.style.borderRadius = '';
    }
    onComplete();
  };

  const skipTour = () => {
    closeTour();
  };

  const step = tourSteps[currentStep];

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && skipTour()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative"
        >
          <Card className="w-full max-w-md bg-background border-border shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Passo {currentStep + 1} de {tourSteps.length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeTour}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex space-x-1">
                  {tourSteps.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 w-8 rounded-full ${
                        index <= currentStep ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={skipTour}
                  className="flex-1"
                >
                  Pular Tour
                </Button>
                
                <div className="flex gap-2">
                  {currentStep > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevStep}
                      className="px-3"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <Button
                    onClick={nextStep}
                    size="sm"
                    className="px-4"
                  >
                    {currentStep === tourSteps.length - 1 ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Finalizar
                      </>
                    ) : (
                      <>
                        Próximo
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}