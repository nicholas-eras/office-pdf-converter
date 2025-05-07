'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser } from '../../services/auth';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState({
    username: '',
    password: '',
  });

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      username: '',
      password: '',
    };

    if (!formData.username) {
      newErrors.username = 'username é obrigatório';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      try {
        const response = await loginUser(formData);
        localStorage.setItem('token', response.access_token);
        router.push('/');
      } catch (error) {
        console.error('Erro ao fazer login:', error);
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const res = await fetch('http://localhost:3000/auth/google');
      const data = await res.json();
      window.location.href = data.url; 
    } catch (err) {
      console.error('Erro ao iniciar login com Google:', err);
    }
  };
  

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#1E3A8A]">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-extrabold text-[#1E40AF] text-center mb-6">
          Bem-vindo de volta!
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-[#1E293B]"
            >
              username
            </label>
            <input
              id="username"
              username="username"
              type="username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="mt-1 block w-full rounded-md border border-[#94A3B8] bg-[#F8FAFC] p-2 text-[#1E293B] focus:border-[#2563EB] focus:ring-[#2563EB]"
              placeholder="Digite seu username"
            />
            {errors.username && (
              <p className="text-sm text-[#EF4444] mt-1">{errors.username}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#1E293B]"
            >
              Senha
            </label>
            <input
              id="password"
              username="password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="mt-1 block w-full rounded-md border border-[#94A3B8] bg-[#F8FAFC] p-2 text-[#1E293B] focus:border-[#2563EB] focus:ring-[#2563EB]"
              placeholder="Digite sua senha"
            />
            {errors.password && (
              <p className="text-sm text-[#EF4444] mt-1">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white py-2 px-4 rounded-md hover:from-[#1D4ED8] hover:to-[#1E40AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full mt-4 bg-white border border-[#D1D5DB] text-[#1E293B] py-2 px-4 rounded-md flex items-center justify-center hover:bg-gray-100"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5 mr-2"
            />
            Entrar com Google
          </button>

        </form>
        <div className="mt-6 text-center">
          <p className="text-sm text-[#475569]">
            Não tem uma conta?{' '}
            <a
              href="/register"
              className="text-[#2563EB] hover:underline font-medium"
            >
              Registre-se aqui
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
