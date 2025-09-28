import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminMasterDashboardProps {
  onLogout: () => void;
}

export default function AdminMasterDashboard({ onLogout }: AdminMasterDashboardProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>🔧 Admin Master Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Dashboard administrativo em manutenção para correções de tipos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}