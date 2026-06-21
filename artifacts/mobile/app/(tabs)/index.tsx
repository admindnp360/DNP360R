import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CitizenHome from '@/screens/citizen/CitizenHome';
import SKHome from '@/screens/safaikarmi/SKHome';
import OfficialHome from '@/screens/official/OfficialHome';
import AdminHome from '@/screens/admin/AdminHome';

export default function HomeTab() {
  const { user } = useAuth();
  if (user?.role === 'safaikarmi') return <SKHome />;
  if (user?.role === 'official') return <OfficialHome />;
  if (user?.role === 'admin') return <AdminHome />;
  return <CitizenHome />;
}
