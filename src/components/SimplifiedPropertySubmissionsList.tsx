import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SimpleLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: string;
  created_at: string;
}

export default function SimplifiedPropertySubmissionsList() {
  const [leads, setLeads] = useState<SimpleLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar leads",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setLeads(prev => 
        prev.map(lead => 
          lead.id === id ? { ...lead, status } : lead
        )
      );

      toast({
        title: "Status atualizado",
        description: "Status do lead foi alterado."
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Leads de Propriedades</h1>
      {leads.map((lead) => (
        <Card key={lead.id}>
          <CardHeader>
            <CardTitle>{lead.name}</CardTitle>
            <CardDescription>{lead.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Telefone:</strong> {lead.phone}</p>
              <p><strong>Mensagem:</strong> {lead.message}</p>
              <Badge>{lead.status}</Badge>
              <div className="flex gap-2">
                <Button onClick={() => updateLeadStatus(lead.id, 'approved')} size="sm">
                  Aprovar
                </Button>
                <Button onClick={() => updateLeadStatus(lead.id, 'rejected')} size="sm" variant="outline">
                  Rejeitar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}