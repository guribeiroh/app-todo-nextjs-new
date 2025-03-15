'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/Auth/ProtectedRoute';
import supabase from '../../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';
import SecurityService from '../../services/SecurityService';

export default function TwoFactorPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [has2FA, setHas2FA] = useState(false);
  const [enrollmentStep, setEnrollmentStep] = useState('initial');
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [otpUrl, setOtpUrl] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');

  useEffect(() => {
    if (user) {
      // Verificar se o usuário já tem 2FA ativado
      checkTwoFactorStatus();
    }
  }, [user]);

  const checkTwoFactorStatus = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      
      if (error) throw error;
      
      // Verificar se tem algum fator MFA ativo
      setHas2FA(data.currentLevel === 'aal2');
      
    } catch (error) {
      console.error('Erro ao verificar status 2FA:', error);
    }
  };

  const startEnrollment = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp'
      });
      
      if (error) throw error;
      
      setTotpSecret(data.totp.secret);
      setOtpUrl(data.totp.uri);
      setEnrollmentStep('verify');
    } catch (error: any) {
      console.error('Erro ao iniciar configuração de 2FA:', error);
      setError(error.message || 'Não foi possível iniciar a configuração de 2FA.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEnrollment = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('O código de verificação deve ter 6 dígitos.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId: totpSecret,
      });
      
      if (error) throw error;
      
      // Verificar o código após o desafio
      const verifyResult = await supabase.auth.mfa.verify({
        factorId: totpSecret,
        challengeId: data.id,
        code: verificationCode
      });
      
      if (verifyResult.error) throw verifyResult.error;
      
      // Registrar ativação do 2FA
      const securityService = SecurityService.getInstance();
      await securityService.logTwoFactorEnabled();
      
      setHas2FA(true);
      setEnrollmentStep('success');
      setMessage('Autenticação em duas etapas ativada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao verificar código 2FA:', error);
      setError(error.message || 'Código de verificação inválido. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!window.confirm('Tem certeza que deseja desativar a autenticação em duas etapas? Isso reduzirá a segurança da sua conta.')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.mfa.unenroll({
        factorId: totpSecret
      });
      
      if (error) throw error;
      
      // Registrar desativação do 2FA
      const securityService = SecurityService.getInstance();
      await securityService.logTwoFactorDisabled();
      
      setHas2FA(false);
      setEnrollmentStep('initial');
      setMessage('Autenticação em duas etapas desativada com sucesso.');
    } catch (error: any) {
      console.error('Erro ao desativar 2FA:', error);
      setError(error.message || 'Não foi possível desativar a autenticação em duas etapas.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Autenticação em Duas Etapas
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Adicione uma camada extra de segurança à sua conta
            </p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md">
              {error}
            </div>
          )}
          
          {message && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-md">
              {message}
            </div>
          )}
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            {has2FA ? (
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <svg className="h-6 w-6 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Autenticação em duas etapas está ativada
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Sua conta está protegida com uma camada extra de segurança.
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={disable2FA}
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-red-300 text-red-700 dark:text-red-300 dark:border-red-700 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  {isLoading ? 'Processando...' : 'Desativar autenticação em duas etapas'}
                </button>
              </div>
            ) : enrollmentStep === 'initial' ? (
              <div className="space-y-6">
                <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                        Recomendação de segurança
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-200">
                        <p>
                          Proteja sua conta com verificação em duas etapas. Você precisará do seu celular e um app autenticador como Google Authenticator ou Microsoft Authenticator.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={startEnrollment}
                  disabled={isLoading}
                  className="w-full flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isLoading ? 'Processando...' : 'Configurar autenticação em duas etapas'}
                </button>
              </div>
            ) : enrollmentStep === 'verify' ? (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
                    1. Escaneie este QR code com seu aplicativo autenticador
                  </p>
                  
                  <div className="inline-block p-2 bg-white rounded-lg mb-4">
                    {otpUrl && (
                      <QRCodeSVG value={otpUrl} size={180} />
                    )}
                  </div>
                  
                  <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                    2. Digite o código de verificação exibido no app
                  </p>
                </div>
                
                <div>
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="000000"
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-center text-2xl font-mono focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <button
                  onClick={verifyEnrollment}
                  disabled={isLoading || verificationCode.length !== 6}
                  className="w-full flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Verificando...' : 'Verificar e ativar'}
                </button>
              </div>
            ) : (
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Configuração concluída!</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Sua conta está agora protegida com autenticação em duas etapas.
                </p>
              </div>
            )}
          </div>
          
          <div className="mt-8 text-center">
            <Link 
              href="/perfil" 
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Voltar para o perfil
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 