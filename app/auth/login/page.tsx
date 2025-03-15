import AuthForm from '../../components/Auth/AuthForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ToDo App</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Entrar na sua conta
          </p>
        </div>
        
        <AuthForm />
      </div>
    </div>
  );
} 