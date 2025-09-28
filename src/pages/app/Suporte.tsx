import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Suporte = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Suporte</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Support functionality will be available soon.</p>
          <Button className="mt-4">
            Create Support Ticket
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Suporte;