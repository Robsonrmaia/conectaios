import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';

export default function MinisiteView() {
  const { slug } = useParams();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchMinisite();
    }
  }, [slug]);

  const fetchMinisite = async () => {
    try {
      const { data: minisiteData } = await supabase
        .from('minisite_configs')
        .select('*')
        .eq('id', slug)
        .single();

      if (minisiteData) {
        setConfig(minisiteData);
      }
    } catch (error) {
      console.error('Error fetching minisite:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold">Minisite não encontrado</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: config.primary_color }}>
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-3xl font-bold mb-4">{config.title}</h1>
            <p className="text-muted-foreground">{config.description}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}