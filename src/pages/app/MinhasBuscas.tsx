import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const MinhasBuscas = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Minhas Buscas</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Saved searches functionality will be available soon.</p>
          <Button className="mt-4">
            Create New Search
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MinhasBuscas;