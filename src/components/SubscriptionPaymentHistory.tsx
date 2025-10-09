import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, CreditCard, Smartphone, Receipt } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSubscriptionPayments } from '@/hooks/useSubscriptionPayments';

const paymentStatusMap = {
  pending: { label: 'Pendente', variant: 'outline' as const, color: 'text-yellow-600' },
  confirmed: { label: 'Pago', variant: 'default' as const, color: 'text-green-600' },
  overdue: { label: 'Atrasado', variant: 'destructive' as const, color: 'text-red-600' },
  refunded: { label: 'Reembolsado', variant: 'secondary' as const, color: 'text-gray-600' },
};

const paymentMethodMap = {
  pix: { label: 'PIX', icon: Smartphone },
  credit_card: { label: 'Cartão', icon: CreditCard },
  boleto: { label: 'Boleto', icon: Receipt },
};

export function SubscriptionPaymentHistory() {
  const { payments, isLoading, totalPaid } = useSubscriptionPayments();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('365');

  const filteredPayments = useMemo(() => {
    let filtered = [...payments];

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Filtro por período
    const periodDays = parseInt(periodFilter);
    const cutoffDate = subDays(new Date(), periodDays);
    filtered = filtered.filter(p => new Date(p.due_date) >= cutoffDate);

    return filtered;
  }, [payments, statusFilter, periodFilter]);

  const periodTotal = useMemo(() => {
    return filteredPayments
      .filter(p => p.status === 'confirmed')
      .reduce((sum, p) => sum + Number(p.amount), 0);
  }, [filteredPayments]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
          <CardDescription>Carregando histórico...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
          <CardDescription>Acompanhe todas suas transações</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center">
            <p className="text-sm text-muted-foreground text-center">
              Nenhum pagamento registrado ainda.<br />
              Os pagamentos aparecerão aqui após a primeira cobrança.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Pagamentos</CardTitle>
        <CardDescription>Acompanhe todas suas transações</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="confirmed">Pagos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="overdue">Atrasados</SelectItem>
              <SelectItem value="refunded">Reembolsados</SelectItem>
            </SelectContent>
          </Select>

          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="180">Últimos 6 meses</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabela */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="hidden sm:table-cell">Método</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhum pagamento encontrado neste período
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment) => {
                  const statusInfo = paymentStatusMap[payment.status];
                  const methodInfo = payment.payment_method 
                    ? paymentMethodMap[payment.payment_method]
                    : null;
                  const MethodIcon = methodInfo?.icon;

                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {format(new Date(payment.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {payment.description || 'Mensalidade'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {methodInfo && MethodIcon && (
                          <div className="flex items-center gap-1.5">
                            <MethodIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{methodInfo.label}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        R$ {Number(payment.amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant={statusInfo.variant} className={statusInfo.color}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {payment.invoice_url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(payment.invoice_url!, '_blank')}
                            title="Ver comprovante"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Total */}
        {filteredPayments.length > 0 && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <div>
                <p className="text-sm font-medium">Total pago no período selecionado</p>
                <p className="text-xs text-muted-foreground">
                  {filteredPayments.filter(p => p.status === 'confirmed').length} pagamento(s) confirmado(s)
                </p>
              </div>
              <p className="text-2xl font-bold text-primary">
                R$ {periodTotal.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Total geral */}
        <div className="mt-2 text-xs text-muted-foreground text-right">
          Total geral pago: R$ {totalPaid.toFixed(2)}
        </div>
      </CardContent>
    </Card>
  );
}
