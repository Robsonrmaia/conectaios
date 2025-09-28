import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Match = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Match</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Property matching functionality will be available soon.</p>
          <Button className="mt-4">
            Find Matches
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Match;