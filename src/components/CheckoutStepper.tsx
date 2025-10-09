import { Check } from "lucide-react";

interface CheckoutStepperProps {
  currentStep: 1 | 2 | 3;
}

const steps = [
  { number: 1, label: "Informações" },
  { number: 2, label: "Pagamento" },
  { number: 3, label: "Criar Senha" },
];

export function CheckoutStepper({ currentStep }: CheckoutStepperProps) {
  return (
    <div className="w-full py-8">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                  ${
                    currentStep > step.number
                      ? "bg-primary border-primary text-primary-foreground"
                      : currentStep === step.number
                      ? "border-primary text-primary bg-background"
                      : "border-muted text-muted-foreground bg-background"
                  }
                `}
              >
                {currentStep > step.number ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="font-semibold">{step.number}</span>
                )}
              </div>
              <span
                className={`
                  mt-2 text-sm font-medium text-center
                  ${
                    currentStep >= step.number
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }
                `}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`
                  h-0.5 flex-1 mx-4 transition-all
                  ${
                    currentStep > step.number
                      ? "bg-primary"
                      : "bg-muted"
                  }
                `}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
