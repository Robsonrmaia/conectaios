import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const AdminMasterDashboard = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Master Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Admin dashboard functionality will be available soon.</p>
          <Button className="mt-4">
            Manage Users
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMasterDashboard;