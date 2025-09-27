import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PropertySubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  status: string;
  created_at: string;
  property_data?: any;
}

export function SimplifiedPropertySubmissionsList() {
  const [submissions, setSubmissions] = useState<PropertySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('property_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as submissões',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSubmissionStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('property_submissions')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setSubmissions(prev => 
        prev.map(sub => sub.id === id ? { ...sub, status } : sub)
      );

      toast({
        title: 'Sucesso',
        description: 'Status atualizado com sucesso'
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  if (loading) {
    return <div className="p-4">Carregando submissões...</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'approved': return 'Aprovado';
      case 'rejected': return 'Rejeitado';
      default: return status;
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Submissões de Imóveis</h2>
      
      {submissions.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Nenhuma submissão encontrada</p>
          </CardContent>
        </Card>
      ) : (
        submissions.map((submission) => (
          <Card key={submission.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{submission.name}</CardTitle>
                <Badge className={getStatusColor(submission.status)}>
                  {getStatusLabel(submission.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <strong>Email:</strong> {submission.email}
                </div>
                {submission.phone && (
                  <div>
                    <strong>Telefone:</strong> {submission.phone}
                  </div>
                )}
                {submission.message && (
                  <div>
                    <strong>Mensagem:</strong> {submission.message}
                  </div>
                )}
                <div>
                  <strong>Data:</strong> {new Date(submission.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
              
              {submission.status === 'pending' && (
                <div className="flex gap-2 mt-4">
                  <Button 
                    size="sm" 
                    onClick={() => updateSubmissionStatus(submission.id, 'approved')}
                  >
                    Aprovar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => updateSubmissionStatus(submission.id, 'rejected')}
                  >
                    Rejeitar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}