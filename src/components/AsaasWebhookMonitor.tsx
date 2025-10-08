import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from 'sonner';
import { RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface WebhookRecord {
  id: string;
  event: string;
  payment: any;
  received_at: string;
  processed: boolean;
  processed_at?: string;
  error?: string;
  created_at: string;
}

export function AsaasWebhookMonitor() {
  const { isAdmin } = useAdminAuth();
  const [webhooks, setWebhooks] = useState<WebhookRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('asaas_webhooks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setWebhooks(data || []);
    } catch (error: any) {
      console.error('Error fetching webhooks:', error);
      toast.error('Erro ao carregar webhooks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchWebhooks();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            Acesso restrito a administradores
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (webhook: WebhookRecord) => {
    if (webhook.error) {
      return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Erro</Badge>;
    }
    if (webhook.processed) {
      return <Badge variant="default" className="gap-1 bg-success"><CheckCircle2 className="h-3 w-3" /> Processado</Badge>;
    }
    return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pendente</Badge>;
  };

  const getEventBadge = (event: string) => {
    const colors: Record<string, string> = {
      'PAYMENT_CONFIRMED': 'bg-green-500',
      'PAYMENT_RECEIVED': 'bg-green-600',
      'PAYMENT_OVERDUE': 'bg-orange-500',
      'PAYMENT_DELETED': 'bg-red-500',
      'PAYMENT_CREATED': 'bg-blue-500',
      'PAYMENT_UPDATED': 'bg-yellow-500'
    };
    
    return (
      <Badge className={`${colors[event] || 'bg-gray-500'} text-white`}>
        {event}
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const stats = {
    total: webhooks.length,
    processed: webhooks.filter(w => w.processed).length,
    errors: webhooks.filter(w => w.error).length,
    pending: webhooks.filter(w => !w.processed && !w.error).length
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">{stats.processed}</div>
            <div className="text-sm text-muted-foreground">Processados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-destructive">{stats.errors}</div>
            <div className="text-sm text-muted-foreground">Erros</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pendentes</div>
          </CardContent>
        </Card>
      </div>

      {/* Webhooks List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Webhooks Recebidos</CardTitle>
              <CardDescription>
                Últimos 50 webhooks do Asaas
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchWebhooks}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            {webhooks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum webhook recebido ainda
              </div>
            ) : (
              <div className="space-y-4">
                {webhooks.map((webhook) => (
                  <Card key={webhook.id} className="p-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getEventBadge(webhook.event)}
                          {getStatusBadge(webhook)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(webhook.received_at)}
                        </div>
                      </div>

                      {/* Payment Info */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {webhook.payment?.id && (
                          <div>
                            <span className="text-muted-foreground">Payment ID:</span>
                            <div className="font-mono text-xs">{webhook.payment.id}</div>
                          </div>
                        )}
                        {webhook.payment?.value && (
                          <div>
                            <span className="text-muted-foreground">Valor:</span>
                            <div className="font-semibold">R$ {webhook.payment.value.toFixed(2)}</div>
                          </div>
                        )}
                        {webhook.payment?.customer && (
                          <div>
                            <span className="text-muted-foreground">Customer:</span>
                            <div className="font-mono text-xs">{webhook.payment.customer}</div>
                          </div>
                        )}
                        {webhook.payment?.externalReference && (
                          <div>
                            <span className="text-muted-foreground">Referência:</span>
                            <div className="font-mono text-xs">{webhook.payment.externalReference}</div>
                          </div>
                        )}
                      </div>

                      {/* Error Message */}
                      {webhook.error && (
                        <div className="p-2 rounded bg-destructive/10 border border-destructive/20">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-destructive">
                              <strong>Erro:</strong> {webhook.error}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Processing Time */}
                      {webhook.processed_at && (
                        <div className="text-xs text-muted-foreground">
                          Processado em: {formatDate(webhook.processed_at)}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
