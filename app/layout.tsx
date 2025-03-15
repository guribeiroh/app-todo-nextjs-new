import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SupabaseProvider } from './context/SupabaseContext';
import { TaskProvider } from './context/TaskContext';
import ToastProvider from './components/Toast';
import { PomodoroProvider } from './context/PomodoroContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Script from 'next/script';
import { ScrumProvider } from './context/ScrumContext';
import { SupabaseSyncProvider } from './components/SupabaseSyncProvider';

// Usando uma fonte mais moderna
const inter = Inter({ subsets: ['latin'] });

// Configuração de viewport seguindo as recomendações do Next.js
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3b82f6',
}

export const metadata: Metadata = {
  title: 'App To Do - Gerenciador de Tarefas',
  description: 'Um aplicativo completo para gerenciar suas tarefas e aumentar sua produtividade.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
        <meta name="theme-color" content="#6366F1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="icon" href="/favicon.ico" />
        <Script id="force-dark-theme" strategy="beforeInteractive" src="/force-dark.js" />
      </head>
      <body className={`${inter.className} text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col`}>
        <SupabaseProvider>
          <ToastProvider>
            <AuthProvider>
              <ThemeProvider>
                <TaskProvider>
                  <PomodoroProvider>
                    <ScrumProvider>
                      <SupabaseSyncProvider>
                        <div className="flex flex-col min-h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
                          <main className="flex-grow flex flex-col relative bg-gray-50 dark:bg-gray-900">
                            {children}
                          </main>
                          <footer className="bg-white dark:bg-gray-900 shadow-md py-3 border-t border-gray-200 dark:border-gray-800">
                            <div className="container mx-auto px-4 flex justify-between items-center">
                              <div className="flex items-center space-x-4">
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  &copy; {new Date().getFullYear()} App de Tarefas
                                </div>
                                <div className="text-sm flex space-x-4">
                                  <a href="/termos" className="hover:text-indigo-500 transition-colors">Termos</a>
                                  <a href="/privacidade" className="hover:text-indigo-500 transition-colors">Privacidade</a>
                                  <a href="/ajuda" className="hover:text-indigo-500 transition-colors">Ajuda</a>
                                </div>
                              </div>
                            </div>
                          </footer>
                        </div>
                      </SupabaseSyncProvider>
                    </ScrumProvider>
                  </PomodoroProvider>
                </TaskProvider>
              </ThemeProvider>
            </AuthProvider>
          </ToastProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
} 