/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PhDLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verify user has PhD-related permissions
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      const response = await fetch('/api/auth/user');
      if (response.status === 401) {
        router.push('/auth/login');
        return;
      }

      if (!response.ok) {
        setIsAuthorized(false);
        return;
      }

      const userData = await response.json();
      // Check if user has PhD-related roles
      if (!['lecturer', 'hod', 'dean', 'admin', 'viva_coordinator'].includes(userData.role)) {
        setIsAuthorized(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">You are not authorized to access this section.</div>
      </div>
    );
  }

  return <>{children}</>;
}
