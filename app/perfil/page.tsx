'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/Auth/ProtectedRoute';
import supabase from '../lib/supabase';
import Link from 'next/link';
import SecurityService from '../services/SecurityService';

export default function ProfilePage() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [bio, setBio] = useState('');
  const [language, setLanguage] = useState('pt-BR');
  const [theme, setTheme] = useState('system');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.name || '');
      setPhone(user.user_metadata?.phone || '');
      setWebsite(user.user_metadata?.website || '');
      setBio(user.user_metadata?.bio || '');
      setLanguage(user.user_metadata?.language || 'pt-BR');
      setTheme(user.user_metadata?.theme || 'system');
      setAvatarUrl(user.user_metadata?.avatar_url || null);
      
      // Também verificar no perfil público
      fetchPublicProfile();
    }
  }, [user]);
  
  const fetchPublicProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error('Erro ao buscar perfil:', error);
        return;
      }
      
      if (data) {
        // Preencher dados do perfil público que não estão nos metadados
        if (!name && data.name) setName(data.name);
        if (!website && data.website) setWebsite(data.website);
        if (!avatarUrl && data.avatar_url) setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error('Erro ao buscar perfil público:', error);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        setMessage({
          type: 'error',
          text: 'A imagem deve ter no máximo 2MB'
        });
        return;
      }
      setAvatar(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  const uploadAvatar = async () => {
    if (!avatar || !user) return null;
    
    const fileExt = avatar.name.split('.').pop();
    const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    try {
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatar);
      
      if (uploadError) {
        throw uploadError;
      }
      
      const { data: publicURL } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      return publicURL.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    
    try {
      let newAvatarUrl = null;
      
      if (avatar) {
        newAvatarUrl = await uploadAvatar();
        if (!newAvatarUrl) {
          throw new Error('Falha ao fazer upload da imagem de perfil');
        }
      }
      
      // Coletar campos que foram atualizados
      const updatedFields = [];
      if (name !== user?.user_metadata?.name) updatedFields.push('name');
      if (phone !== user?.user_metadata?.phone) updatedFields.push('phone');
      if (website !== user?.user_metadata?.website) updatedFields.push('website');
      if (bio !== user?.user_metadata?.bio) updatedFields.push('bio');
      if (language !== user?.user_metadata?.language) updatedFields.push('language');
      if (theme !== user?.user_metadata?.theme) updatedFields.push('theme');
      if (newAvatarUrl) updatedFields.push('avatar');
      
      // Atualizar metadados do usuário
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          name,
          phone,
          website,
          bio,
          language,
          theme,
          ...(newAvatarUrl ? { avatar_url: newAvatarUrl } : {})
        }
      });
      
      if (authError) throw authError;
      
      // Atualizar perfil público na tabela profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          name,
          website,
          avatar_url: newAvatarUrl || avatarUrl,
          updated_at: new Date().toISOString()
        });
        
      if (profileError) throw profileError;
      
      // Registrar atividade de atualização de perfil
      if (updatedFields.length > 0) {
        const securityService = SecurityService.getInstance();
        await securityService.logProfileUpdate(updatedFields);
      }
      
      setMessage({
        type: 'success',
        text: 'Perfil atualizado com sucesso!'
      });
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Erro ao atualizar perfil'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Seu Perfil
          </h1>
          
          {message && (
            <div className={`mb-6 p-4 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
            }`}>
              {message.text}
            </div>
          )}
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Avatar do usuário" 
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl">
                    {user?.email?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <label 
                  htmlFor="avatar-upload" 
                  className="absolute bottom-0 right-0 bg-indigo-600 text-white rounded-full p-2 cursor-pointer hover:bg-indigo-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </label>
                <input 
                  id="avatar-upload" 
                  type="file" 
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Clique no ícone para alterar sua foto
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
                
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nome
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Telefone
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Website
                  </label>
                  <input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://seusite.com"
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Biografia
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Conte um pouco sobre você"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Idioma Preferido
                  </label>
                  <select
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">English (United States)</option>
                    <option value="es">Español</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="theme" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tema da Interface
                  </label>
                  <select
                    id="theme"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="system">Automático (Sistema)</option>
                    <option value="light">Claro</option>
                    <option value="dark">Escuro</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    isLoading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
          
          <div className="mt-8 flex justify-center gap-4">
            <a 
              href="/"
              className="inline-block text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Voltar para o aplicativo
            </a>
            
            <button 
              onClick={() => {
                if (window.confirm('Tem certeza que deseja alterar sua senha?')) {
                  window.location.href = '/auth/redefinir-senha';
                }
              }}
              className="inline-block text-sm text-orange-600 dark:text-orange-400 hover:underline"
            >
              Alterar Senha
            </button>
            
            <Link 
              href="/auth/two-factor"
              className="inline-block text-sm text-purple-600 dark:text-purple-400 hover:underline"
            >
              Autenticação em Duas Etapas
            </Link>
            
            <Link 
              href="/auth/sessoes"
              className="inline-block text-sm text-green-600 dark:text-green-400 hover:underline"
            >
              Gerenciar Sessões
            </Link>
            
            <Link 
              href="/auth/atividades"
              className="inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Histórico de Atividades
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 