import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useBroker } from "@/hooks/useBroker";
import { useAsaasCoupon } from "@/hooks/useAsaasCoupon";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CreditCard, Check, AlertCircle, ArrowRight, Tag } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  value: number;
  features: string[];
  highlighted?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "basic",
    name: "Básico",
    value: 97,
    features: ["Até 50 imóveis", "Minisite personalizado", "CRM básico", "Suporte por email"],
  },
  {
    id: "pro",
    name: "Profissional",
    value: 197,
    features: [
      "Imóveis ilimitados",
      "Minisite + domínio próprio",
      "CRM avançado + automações",
      "IA para descrições",
      "Suporte prioritário",
    ],
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    value: 397,
    features: ["Tudo do Pro +", "API dedicada", "Whitelabel completo", "Gerente de conta", "SLA garantido"],
  },
];

type FlowStep = "select" | "confirm" | "processing" | "success" | "error";

interface UserData {
  name: string;
  email: string;
  phone: string;
  cpfCnpj: string;
}

export function AsaasSubscriptionFlow() {
  const { user } = useAuth();
  const { broker } = useBroker();
  const { validateCoupon, applyCoupon, clearCoupon, validatedCoupon, loading: couponLoading } = useAsaasCoupon();

  const [step, setStep] = useState<FlowStep>("select");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [processingStep, setProcessingStep] = useState(1);
  const [userData, setUserData] = useState<UserData>({
    name: broker?.name || "",
    email: broker?.email || user?.email || "",
    phone: broker?.phone || "",
    cpfCnpj: broker?.cpf_cnpj || "",
  });
  const [couponCode, setCouponCode] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState<string>("");

  const validateUserData = (): boolean => {
    if (!userData.name?.trim()) {
      toast.error("Nome é obrigatório");
      return false;
    }
    if (!userData.email?.trim() || !userData.email.includes("@")) {
      toast.error("Email válido é obrigatório");
      return false;
    }
    if (!userData.phone?.replace(/\D/g, "") || userData.phone.replace(/\D/g, "").length < 10) {
      toast.error("Telefone válido é obrigatório");
      return false;
    }
    if (!userData.cpfCnpj?.replace(/\D/g, "") || userData.cpfCnpj.replace(/\D/g, "").length < 11) {
      toast.error("CPF/CNPJ válido é obrigatório");
      return false;
    }
    return true;
  };

  const handleSubscribe = async () => {
    if (!selectedPlan || !user || !broker) return;

    if (!validateUserData()) {
      return;
    }

    setStep("processing");
    setProcessingStep(1);

    try {
      // Aplicar cupom se válido
      const finalValue = validatedCoupon ? applyCoupon(selectedPlan.value) : selectedPlan.value;

      // Step 1: Create or get customer
      console.log("🔄 Criando cliente no Asaas...");
      const { data: customerData, error: customerError } = await supabase.functions.invoke("asaas-integration", {
        body: {
          action: "create_customer",
          data: {
            name: userData.name,
            email: userData.email,
            phone: userData.phone.replace(/\D/g, ""),
            cpfCnpj: userData.cpfCnpj.replace(/\D/g, ""),
            notificationDisabled: false,
          },
        },
      });

      if (customerError) throw customerError;
      if (!customerData?.data?.id) throw new Error("Customer ID not returned");

      const customerId = customerData.data.id;
      console.log("✅ Cliente criado:", customerId);

      setProcessingStep(2);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 2: Create subscription
      console.log("🔄 Criando assinatura...");
      const { data: subscriptionData, error: subscriptionError } = await supabase.functions.invoke(
        "asaas-integration",
        {
          body: {
            action: "create_subscription",
            data: {
              customer: customerId,
              billingType: "UNDEFINED",
              value: finalValue,
              nextDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              cycle: "MONTHLY",
              description: `ConectaIOS - Plano ${selectedPlan.name}${validatedCoupon ? " (com desconto)" : ""}`,
              externalReference: `plan_${selectedPlan.id}_${user.id}_${Date.now()}`,
            },
          },
        },
      );

      if (subscriptionError) throw subscriptionError;
      if (!subscriptionData?.subscription) throw new Error("Subscription not created");

      console.log("✅ Assinatura criada:", subscriptionData.subscription.id);

      setProcessingStep(3);

      // Step 3: Get checkout URL
      const checkoutLink = subscriptionData.checkoutUrl || subscriptionData.subscription.invoiceUrl;
      if (checkoutLink) {
        setCheckoutUrl(checkoutLink);
        setStep("success");

        // Auto-redirect após 2s
        setTimeout(() => {
          window.open(checkoutLink, "_blank");
        }, 2000);
      } else {
        throw new Error("Checkout URL not available");
      }
    } catch (error: any) {
      console.error("❌ Erro no fluxo:", error);
      setStep("error");
      toast.error(error.message || "Erro ao processar assinatura");
    }
  };

  if (step === "select") {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Escolha seu Plano</h2>
          <p className="text-muted-foreground">Selecione o plano ideal para o seu negócio</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`relative cursor-pointer transition-all hover:shadow-lg ${
                selectedPlan?.id === plan.id ? "ring-2 ring-primary" : ""
              } ${plan.highlighted ? "border-primary" : ""}`}
              onClick={() => setSelectedPlan(plan)}
            >
              {plan.highlighted && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Mais Popular</Badge>}
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {selectedPlan?.id === plan.id && <Check className="h-5 w-5 text-primary" />}
                </CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">R$ {plan.value}</span>
                  <span className="text-muted-foreground">/mês</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={() => (selectedPlan ? setStep("confirm") : toast.error("Selecione um plano"))}
            disabled={!selectedPlan}
          >
            Continuar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Confirme seus dados</CardTitle>
          <CardDescription>
            Plano {selectedPlan?.name} - R$ {selectedPlan?.value}/mês
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cupom de Desconto */}
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <Label htmlFor="coupon" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Cupom de Desconto (Opcional)
            </Label>
            <div className="flex gap-2">
              <Input
                id="coupon"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="DIGITE SEU CUPOM"
                disabled={couponLoading || !!validatedCoupon}
              />
              {!validatedCoupon ? (
                <Button
                  onClick={() => validateCoupon(couponCode)}
                  disabled={!couponCode || couponLoading}
                  variant="outline"
                >
                  {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
                </Button>
              ) : (
                <Button onClick={clearCoupon} variant="outline">
                  Remover
                </Button>
              )}
            </div>
            {validatedCoupon && validatedCoupon.valid && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <Check className="h-4 w-4" />
                Cupom aplicado!
                {validatedCoupon.discount_percent && ` ${validatedCoupon.discount_percent}% de desconto`}
                {validatedCoupon.discount_value && ` R$ ${validatedCoupon.discount_value} de desconto`}
              </p>
            )}
          </div>

          {/* Valor com desconto */}
          {validatedCoupon?.valid && (
            <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Valor Original</p>
                  <p className="text-sm line-through text-muted-foreground">R$ {selectedPlan?.value.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Valor com Desconto</p>
                  <p className="text-xl font-bold text-green-600">
                    R$ {applyCoupon(selectedPlan?.value || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo *</Label>
            <Input
              id="name"
              value={userData.name}
              onChange={(e) => setUserData({ ...userData, name: e.target.value })}
              placeholder="João Silva"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={userData.email}
              onChange={(e) => setUserData({ ...userData, email: e.target.value })}
              placeholder="joao@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone *</Label>
            <Input
              id="phone"
              value={userData.phone}
              onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpfCnpj">CPF/CNPJ *</Label>
            <Input
              id="cpfCnpj"
              value={userData.cpfCnpj}
              onChange={(e) => setUserData({ ...userData, cpfCnpj: e.target.value })}
              placeholder="000.000.000-00"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setStep("select")} className="flex-1">
              Voltar
            </Button>
            <Button onClick={handleSubscribe} className="flex-1">
              Assinar Agora
              <CreditCard className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "processing") {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Processando sua assinatura...</h3>
              <p className="text-sm text-muted-foreground">Aguarde alguns instantes</p>
            </div>

            <div className="space-y-2">
              <div
                className={`flex items-center gap-2 ${processingStep >= 1 ? "text-success" : "text-muted-foreground"}`}
              >
                {processingStep > 1 ? <Check className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
                <span className="text-sm">Criando cliente</span>
              </div>
              <div
                className={`flex items-center gap-2 ${processingStep >= 2 ? "text-success" : "text-muted-foreground"}`}
              >
                {processingStep > 2 ? (
                  <Check className="h-4 w-4" />
                ) : processingStep === 2 ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <div className="h-4 w-4" />
                )}
                <span className="text-sm">Criando assinatura</span>
              </div>
              <div
                className={`flex items-center gap-2 ${processingStep >= 3 ? "text-success" : "text-muted-foreground"}`}
              >
                {processingStep >= 3 ? <Check className="h-4 w-4" /> : <div className="h-4 w-4" />}
                <span className="text-sm">Gerando checkout</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "success") {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <Check className="h-6 w-6 text-success" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Assinatura criada com sucesso!</h3>
              <p className="text-sm text-muted-foreground">Redirecionando para o checkout...</p>
            </div>

            <Button onClick={() => window.open(checkoutUrl, "_blank")} className="w-full">
              Ir para o Pagamento
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <Button variant="outline" onClick={() => setStep("select")} className="w-full">
              Voltar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "error") {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Erro ao processar assinatura</h3>
              <p className="text-sm text-muted-foreground">Tente novamente ou entre em contato com o suporte</p>
            </div>

            <Button
              onClick={() => {
                setStep("select");
                setProcessingStep(1);
              }}
              className="w-full"
            >
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
