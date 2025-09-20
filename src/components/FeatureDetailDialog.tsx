import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { ReactNode } from 'react';

interface FeatureDetailDialogProps {
  children: ReactNode;
  title: string;
  description: string;
  icon: ReactNode;
  color: string;
  howItWorks: {
    title: string;
    items: string[];
  };
  benefits: {
    title: string;
    items: string[];
  };
  useCases: {
    title: string;
    scenarios: {
      title: string;
      description: string;
    }[];
  };
}

export function FeatureDetailDialog({
  children,
  title,
  description,
  icon,
  color,
  howItWorks,
  benefits,
  useCases
}: FeatureDetailDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto bg-white mx-auto">
        <DialogHeader className="text-center space-y-4 pb-6">
          <div className={`mx-auto w-16 h-16 ${color} rounded-full flex items-center justify-center`}>
            {icon}
          </div>
          <DialogTitle className="text-2xl sm:text-3xl font-bold text-primary">
            {title}
          </DialogTitle>
          <DialogDescription className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 sm:space-y-8 py-4">
          {/* Como Funciona */}
          <section>
            <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2 text-primary">
              <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
              {howItWorks.title}
            </h3>
            <div className="bg-primary/5 p-4 sm:p-6 rounded-lg">
              <div className="space-y-3">
                {howItWorks.items.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-sm sm:text-base text-gray-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Benefícios */}
          <section>
            <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2 text-primary">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
              {benefits.title}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              {benefits.items.map((benefit, index) => (
                <div key={index} className="flex items-start gap-2 sm:gap-3 bg-green-50 p-3 sm:p-4 rounded-lg">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 sm:mt-1 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Casos de Uso */}
          <section>
            <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2 text-primary">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">💡</span>
              </div>
              {useCases.title}
            </h3>
            <div className="space-y-4">
              {useCases.scenarios.map((scenario, index) => (
                <div key={index} className="border rounded-lg p-4 sm:p-6 bg-blue-50">
                  <h4 className="font-bold text-base sm:text-lg mb-2 text-blue-700">
                    {scenario.title}
                  </h4>
                  <p className="text-sm sm:text-base text-gray-700">
                    {scenario.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Call to Action */}
          <section className="text-center p-6 sm:p-8 bg-primary rounded-lg text-white">
            <h3 className="text-xl sm:text-2xl font-bold mb-4">
              ⚡ Experimente {title}
            </h3>
            <p className="text-base sm:text-lg mb-6">
              Transforme sua forma de trabalhar com essa funcionalidade exclusiva do ConectaIOS.
            </p>
            <Button 
              size="lg"
              variant="secondary"
              className="text-primary font-bold text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 hover:scale-105 transition-transform"
              onClick={() => window.location.href = "/auth"}
            >
              🚀 Começar Agora!
            </Button>
            <p className="text-xs sm:text-sm mt-4 opacity-90">
              Experimente grátis por 7 dias - Sem compromisso
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}