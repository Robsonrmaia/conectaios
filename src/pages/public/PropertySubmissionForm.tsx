import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const PropertySubmissionForm = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Submit Property</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Property submission form will be available soon.</p>
          <Button className="mt-4">
            Submit Property
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertySubmissionForm;