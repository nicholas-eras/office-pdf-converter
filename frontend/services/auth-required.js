import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const checkAuth = async () => {
  try {
    const response = await fetch('http://localhost:3000/auth/validate-token/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) {
      throw new Error('Not authenticated');
    }
    return true; // Usuário autenticado
  } catch (error) {
    return false; // Usuário não autenticado
  }
};

const AuthRequired = (WrappedComponent) => {
  return function AuthRequiredComponent(props) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
      const authCheck = async () => {
        const authenticated = await checkAuth();
        setIsAuthenticated(authenticated);
        setIsLoading(false);
        if (!authenticated) {
          router.push('/login');
        }
      };
      authCheck();
    }, [router]);

    if (isLoading) {
      return <div>Loading...</div>;
    }

    return isAuthenticated ? <WrappedComponent {...props} /> : null;
  };
};

export default AuthRequired;