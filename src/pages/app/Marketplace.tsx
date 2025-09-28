import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Marketplace = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Marketplace</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Marketplace functionality will be available soon.</p>
          <Button className="mt-4">
            Browse Properties
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Marketplace;