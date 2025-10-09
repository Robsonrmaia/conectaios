import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, XCircle, CreditCard } from 'lucide-react';

interface SubscriptionBlockerProps {
  status: 'overdue' | 'suspended' | 'cancelled';
  daysOverdue?: number;
  amount?: number;
  message?: string;
}

/**
 * Componente visual para mostrar quando acesso está bloqueado
 * Exibe informações sobre o status da assinatura e ações para regularizar
 */
export function SubscriptionBlocker({ 
  status, 
  daysOverdue = 0,
  amount,
  message 
}: SubscriptionBlockerProps) {
  const navigate = useNavigate();
  
  // Configuração visual baseada no status
  const config = {
    overdue: {
      icon: Clock,
      title: 'Pagamento Atrasado',
      variant: 'default' as const,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      badgeVariant: 'default' as const,
    },
    suspended: {
      icon: XCircle,
      title: 'Assinatura Suspensa',
      variant: 'destructive' as const,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      badgeVariant: 'destructive' as const,
    },
    cancelled: {
      icon: AlertTriangle,
      title: 'Assinatura Cancelada',
      variant: 'default' as const,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      badgeVariant: 'secondary' as const,
    },
  };
  
  const current = config[status];
  const Icon = current.icon;
  
  return (
    <Card className={`border-2 ${current.bgColor}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${current.bgColor}`}>
              <Icon className={`h-6 w-6 ${current.color}`} />
            </div>
            <div>
              <CardTitle className={current.color}>{current.title}</CardTitle>
              <CardDescription>
                {status === 'overdue' && daysOverdue > 0 && (
                  `Atrasado há ${daysOverdue} dia${daysOverdue !== 1 ? 's' : ''}`
                )}
                {status === 'suspended' && 'Acesso bloqueado por falta de pagamento'}
                {status === 'cancelled' && 'Reative para continuar usando'}
              </CardDescription>
            </div>
          </div>
          <Badge variant={current.badgeVariant} className="uppercase">
            {status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Mensagem personalizada */}
        {message && (
          <Alert variant={current.variant}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        
        {/* Valor em atraso */}
        {amount && amount > 0 && (
          <div className="p-4 bg-background rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor em aberto</p>
                <p className="text-2xl font-bold text-primary">
                  {amount.toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  })}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
        )}
        
        {/* Informações adicionais */}
        <div className="p-4 bg-background rounded-lg border space-y-2">
          <h4 className="font-semibold text-sm">O que acontece agora?</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            {status === 'overdue' && (
              <>
                <li>Você ainda tem acesso limitado ao sistema</li>
                <li>Após 7 dias, a assinatura será suspensa</li>
                <li>Regularize o quanto antes para manter acesso total</li>
              </>
            )}
            {status === 'suspended' && (
              <>
                <li>Seu acesso está temporariamente bloqueado</li>
                <li>Seus dados estão seguros e preservados</li>
                <li>Regularize o pagamento para reativar imediatamente</li>
              </>
            )}
            {status === 'cancelled' && (
              <>
                <li>Sua assinatura foi cancelada</li>
                <li>Você pode reativar a qualquer momento</li>
                <li>Seus dados serão preservados por 30 dias</li>
              </>
            )}
          </ul>
        </div>
        
        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => navigate('/app/checkout')}
            className="flex-1"
            size="lg"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Regularizar Pagamento
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => navigate('/app/suporte')}
            className="flex-1"
          >
            Falar com Suporte
          </Button>
        </div>
        
        {/* Nota de segurança */}
        <p className="text-xs text-center text-muted-foreground">
          💳 Pagamento seguro via Asaas • Seus dados estão protegidos
        </p>
      </CardContent>
    </Card>
  );
}
