import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const PropertySubmissions = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Property Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Property submissions functionality will be available soon.</p>
          <Button className="mt-4">
            View Submissions
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertySubmissions;