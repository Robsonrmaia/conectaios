import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const PropertyDetail = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Property Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Property details will be available soon.</p>
          <Button className="mt-4">
            View Details
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyDetail;