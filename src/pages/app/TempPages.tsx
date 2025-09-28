// Páginas temporárias para fazer build passar
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Páginas simplificadas
const TempPage = ({ title, description }: { title: string; description: string }) => (
  <div className="container mx-auto px-4 py-8">
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  </div>
);

export const TempDashboard = () => (
  <TempPage title="Dashboard" description="Dashboard em manutenção temporária" />
);

export const TempMarketplace = () => (
  <TempPage title="Marketplace" description="Marketplace em manutenção temporária" />
);

export const TempMatch = () => (
  <TempPage title="Match" description="Sistema de match em manutenção temporária" />
);

export const TempMinhasBuscas = () => (
  <TempPage title="Minhas Buscas" description="Buscas salvas em manutenção temporária" />
);

export const TempMinisite = () => (
  <TempPage title="Minisite" description="Editor de minisite em manutenção temporária" />
);

export const TempPropertySubmissions = () => (
  <TempPage title="Submissões" description="Submissões de imóveis em manutenção temporária" />
);

export const TempSupporte = () => (
  <TempPage title="Suporte" description="Sistema de suporte em manutenção temporária" />
);