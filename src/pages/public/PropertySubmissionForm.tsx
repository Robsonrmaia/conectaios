import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle, Clock, X } from 'lucide-react';

export default function PropertySubmissionForm() {
  const { token } = useParams<{ token: string }>();
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (token) loadSubmission();
  }, [token]);

  const loadSubmission = async () => {
    if (!token) return;

    try {
      setLoading(true);
      
      // Simple fetch to avoid type complexity
      const response = await fetch(`https://paawojkqrggnuvpnnwrc.supabase.co/rest/v1/property_submissions?submission_token=eq.${token}`, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhYXdvamtxcmdnbnV2cG5ud3JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MjcwMjIsImV4cCI6MjA3NDUwMzAyMn0.w6GWfIyEvcYDsG1W4J0yatSx-ueTm6_m7Qkj-GvxEIU'
        }
      });

      const data = await response.json();
      
      if (!data || data.length === 0) {
        setNotFound(true);
        return;
      }

      setSubmission(data[0]);

    } catch (error) {
      console.error('Error:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  if (notFound || !submission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">404</h1>
          <p className="text-muted-foreground mb-8">Formulário não encontrado</p>
          <Button onClick={() => window.location.href = '/'}>Voltar ao início</Button>
        </div>
      </div>
    );
  }

  const propertyData = submission.property_data || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Submissão de Imóvel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <strong>Nome:</strong> {submission.name}
                </div>
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
                  <strong>Status:</strong> 
                  <Badge className="ml-2">
                    {submission.status === 'approved' ? 'Aprovado' : 
                     submission.status === 'pending' ? 'Pendente' : 'Aguardando'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}