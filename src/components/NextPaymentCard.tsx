import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSubscriptionPayments } from '@/hooks/useSubscriptionPayments';

export function NextPaymentCard() {
  const { nextPayment, isLoading } = useSubscriptionPayments();

  if (isLoading) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Próxima Cobrança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!nextPayment) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Próxima Cobrança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <p className="text-sm text-muted-foreground text-center">
              Nenhuma cobrança pendente
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const dueDate = new Date(nextPayment.due_date);
  const daysUntilDue = differenceInDays(dueDate, new Date());
  const isOverdue = daysUntilDue < 0;
  const isConfirmed = nextPayment.status === 'confirmed';

  return (
    <Card className={isOverdue && !isConfirmed ? "border-destructive" : "border-primary"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {isConfirmed ? 'Último Pagamento' : 'Próxima Cobrança'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Data</span>
            <span className="font-semibold">
              {format(dueDate, 'dd/MM/yyyy', { locale: ptBR })}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Valor</span>
            <span className="text-2xl font-bold text-primary">
              R$ {Number(nextPayment.amount).toFixed(2)}
            </span>
          </div>

          {nextPayment.description && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Descrição</span>
              <span className="text-sm font-medium">{nextPayment.description}</span>
            </div>
          )}

          {isConfirmed ? (
            <Alert className="bg-green-500/10 border-green-500/20">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Pagamento confirmado em{' '}
                {nextPayment.paid_at && format(new Date(nextPayment.paid_at), 'dd/MM/yyyy', { locale: ptBR })}
              </AlertDescription>
            </Alert>
          ) : isOverdue ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Venceu há {Math.abs(daysUntilDue)} dia{Math.abs(daysUntilDue) !== 1 ? 's' : ''}
              </AlertDescription>
            </Alert>
          ) : daysUntilDue <= 7 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Vence em {daysUntilDue} dia{daysUntilDue !== 1 ? 's' : ''}
              </AlertDescription>
            </Alert>
          ) : null}

          {nextPayment.status === 'pending' && nextPayment.invoice_url && (
            <Button
              className="w-full"
              onClick={() => window.open(nextPayment.invoice_url!, '_blank')}
            >
              Pagar Agora
            </Button>
          )}

          {nextPayment.status === 'overdue' && nextPayment.invoice_url && (
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => window.open(nextPayment.invoice_url!, '_blank')}
            >
              Regularizar Pagamento
            </Button>
          )}

          {nextPayment.status === 'confirmed' && nextPayment.invoice_url && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open(nextPayment.invoice_url!, '_blank')}
            >
              Ver Comprovante
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
