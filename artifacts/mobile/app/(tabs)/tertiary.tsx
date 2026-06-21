import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CitizenEmergency from '@/screens/citizen/CitizenEmergency';
import SKPerformance from '@/screens/safaikarmi/SKPerformance';
import OfficialHouses from '@/screens/official/OfficialHouses';
import AdminManagement from '@/screens/admin/AdminManagement';

export default function TertiaryTab() {
  const { user } = useAuth();
  if (user?.role === 'safaikarmi') return <SKPerformance />;
  if (user?.role === 'official') return <OfficialHouses />;
  if (user?.role === 'admin') return <AdminManagement />;
  return <CitizenEmergency />;
}
