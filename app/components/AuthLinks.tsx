'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { FaUserCircle, FaSignOutAlt, FaUser, FaUserPlus } from 'react-icons/fa';

export default function AuthLinks() {
  const { isAuthenticated, user, signOut, isLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };
  
  if (isLoading) {
    return (
      <div className="inline-flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <div className="w-4 h-4 border-t-2 border-indigo-500 rounded-full animate-spin"></div>
        <span>Carregando...</span>
      </div>
    );
  }
  
  if (isAuthenticated) {
    const userInitials = user?.user_metadata?.name 
      ? getInitials(user.user_metadata.name)
      : user?.email ? getInitials(user.email) : 'U';
      
    return (
      <div className="relative">
        <button
          onClick={toggleMenu}
          className="flex items-center space-x-2 focus:outline-none"
          aria-expanded={isMenuOpen}
          aria-haspopup="true"
        >
          {user?.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt="Avatar do usuário"
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium">
              {userInitials}
            </div>
          )}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {user?.email && user.email.split('@')[0]}
          </span>
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700">
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.user_metadata?.name || 'Usuário'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
            </div>
            <Link
              href="/perfil"
              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              onClick={() => setIsMenuOpen(false)}
            >
              <FaUser className="mr-2" />
              Perfil
            </Link>
            <button
              onClick={() => {
                signOut();
                setIsMenuOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            >
              <FaSignOutAlt className="mr-2" />
              Sair
            </button>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="flex items-center space-x-2">
      <Link 
        href="/auth/login" 
        className="flex items-center space-x-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded"
      >
        <FaUser className="text-xs" />
        <span>Entrar</span>
      </Link>
      <Link 
        href="/auth/register" 
        className="flex items-center space-x-1 px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium rounded"
      >
        <FaUserPlus className="text-xs" />
        <span>Registrar</span>
      </Link>
    </div>
  );
} 