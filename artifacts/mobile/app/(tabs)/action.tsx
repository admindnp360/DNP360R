import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CitizenComplaints from '@/screens/citizen/CitizenComplaints';
import SKScan from '@/screens/safaikarmi/SKScan';
import OfficialComplaints from '@/screens/official/OfficialComplaints';
import AdminUsers from '@/screens/super-admin/AdminUsers';

export default function ActionTab() {
  const { user } = useAuth();
  if (user?.role === 'safaikarmi') return <SKScan />;
  if (user?.role === 'official') return <OfficialComplaints />;
  if (user?.role === 'admin') return <AdminUsers />;
  return <CitizenComplaints />;
}
