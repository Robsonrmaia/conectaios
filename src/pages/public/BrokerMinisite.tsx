import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const BrokerMinisite = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Broker Minisite</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Broker minisite functionality will be available soon.</p>
          <Button className="mt-4">
            View Properties
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrokerMinisite;