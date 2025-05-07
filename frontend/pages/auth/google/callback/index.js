// pages/auth/google/callback.tsx (App Router ou Pages Router)

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function GoogleCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const code = router.query.code;

      if (!code) return;

      const res = await fetch(`http://localhost:3000/auth/google/callback?code=${code}`);
      const data = await res.json();
      console.log(res);
      // Salvar JWT no localStorage
      localStorage.setItem('token', data.token); // Assumindo que `data` tem { token }

      // Redirecionar para página autenticada
      router.push('/'); // ou onde quiser
    };

    if (router.isReady) handleCallback();
  }, [router]);

  return <p>Autenticando com Google...</p>;
}
