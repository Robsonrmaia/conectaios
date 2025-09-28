import { useState } from 'react';
import AdminMasterLogin from './admin-master/AdminMasterLogin';
import AdminMasterDashboard from './admin-master/AdminMasterDashboard';

export default function AdminMaster() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <AdminMasterLogin onLogin={handleLogin} />;
  }

  return <AdminMasterDashboard />;
}