'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, ComponentType } from 'react';
import { Spinner } from 'react-bootstrap';

// This is a Higher-Order Component (HOC) for client-side route protection
const withAuth = <P extends object>(
  WrappedComponent: ComponentType<P>,
  allowedRoles: Array<'ADMIN' | 'INSTRUCTOR' | 'STUDENT'>
) => {
  const AuthComponent = (props: P) => {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    useEffect(() => {
      if (!loading && mounted) {
        if (!user) {
          // If not logged in, redirect to login page
          router.replace('/login');
        } else if (!allowedRoles.includes(user.role)) {
          // If role is not allowed, redirect to a fallback page (e.g., home or their own dashboard)
          router.replace('/'); 
        }
      }
    }, [user, loading, router, mounted]);

    // Only render conditionally after mounting to avoid hydration mismatch
    if (!mounted || loading || !user || !allowedRoles.includes(user.role)) {
      return (
        <div className="auth-loading-container">
          <Spinner animation="border" />
        </div>
      );
    }

    // If authenticated and authorized, render the component
    return <WrappedComponent {...props} />;
  };

  return AuthComponent;
};

export default withAuth;
