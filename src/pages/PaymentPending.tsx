import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Clock, Mail, ExternalLink } from "lucide-react";
import { CheckoutStepper } from "@/components/CheckoutStepper";

export default function PaymentPending() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"pending" | "confirmed" | "error">("pending");
  const [email, setEmail] = useState("");
  const subscriptionId = searchParams.get("subscription_id");

  useEffect(() => {
    if (!subscriptionId) {
      navigate("/checkout");
      return;
    }

    // Poll para verificar status do pagamento
    const checkPaymentStatus = async () => {
      const { data, error } = await supabase
        .from("pending_signups")
        .select("payment_confirmed, email")
        .eq("subscription_id", subscriptionId)
        .single();

      if (error) {
        console.error("Erro ao verificar status:", error);
        setStatus("error");
        return;
      }

      if (data) {
        setEmail(data.email);
        if (data.payment_confirmed) {
          setStatus("confirmed");
        }
      }
    };

    checkPaymentStatus();
    const interval = setInterval(checkPaymentStatus, 5000);

    return () => clearInterval(interval);
  }, [subscriptionId, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <CheckoutStepper currentStep={2} />

        <Card className="mt-8">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {status === "confirmed" ? "Pagamento Confirmado!" : "Aguardando Confirmação"}
            </CardTitle>
            <CardDescription>
              {status === "confirmed"
                ? "Seu pagamento foi processado com sucesso"
                : "Estamos processando seu pagamento"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {status === "pending" && (
              <>
                <div className="flex items-center justify-center py-8">
                  <Clock className="w-16 h-16 text-primary animate-pulse" />
                </div>
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    Assim que confirmarmos seu pagamento, você receberá um email em{" "}
                    <strong>{email}</strong> com o link para criar sua senha e acessar a
                    plataforma.
                  </AlertDescription>
                </Alert>
                <div className="space-y-4 text-sm text-muted-foreground">
                  <p>
                    <strong>Pagamento via PIX:</strong> Confirmação em até 5 minutos
                  </p>
                  <p>
                    <strong>Cartão de crédito:</strong> Confirmação imediata
                  </p>
                  <p>
                    <strong>Boleto:</strong> Confirmação em até 2 dias úteis
                  </p>
                </div>
              </>
            )}

            {status === "confirmed" && (
              <>
                <div className="flex items-center justify-center py-8">
                  <CheckCircle2 className="w-16 h-16 text-green-500" />
                </div>
                <Alert className="bg-green-50 border-green-200">
                  <Mail className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Enviamos um email para <strong>{email}</strong> com as instruções para
                    criar sua senha e acessar a plataforma.
                  </AlertDescription>
                </Alert>
                <div className="space-y-4">
                  <p className="text-center text-sm text-muted-foreground">
                    Não recebeu o email? Verifique sua caixa de spam ou aguarde alguns
                    minutos.
                  </p>
                </div>
              </>
            )}

            {status === "error" && (
              <Alert variant="destructive">
                <AlertDescription>
                  Houve um erro ao verificar o status do pagamento. Por favor, entre em
                  contato com o suporte.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-3 pt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/suporte")}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Preciso de Ajuda
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => navigate("/")}
              >
                Voltar para a Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
