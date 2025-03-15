'use client';

import { useEffect } from 'react';
import AuthForm from '../../components/Auth/AuthForm';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  
  // Efeito para definir o modo de registro quando o componente carregar
  useEffect(() => {
    // Encontrar o botão que muda o modo e clicar nele se estiver no modo login
    const toggleButton = document.querySelector('button.text-indigo-600');
    if (toggleButton && toggleButton.textContent?.includes('Não tem uma conta')) {
      (toggleButton as HTMLButtonElement).click();
    }
  }, []);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ToDo App</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Criar uma nova conta
          </p>
        </div>
        
        <AuthForm />
      </div>
    </div>
  );
} 