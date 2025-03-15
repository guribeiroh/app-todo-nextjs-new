'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaUserCircle, FaSignOutAlt, FaUserCog } from 'react-icons/fa';

export default function UserProfile() {
  const { user, signOut, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!isAuthenticated || !user) {
    return null;
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const userInitials = user.user_metadata?.name 
    ? getInitials(user.user_metadata.name)
    : getInitials(user.email || '');

  return (
    <div className="relative">
      <button
        onClick={toggleMenu}
        className="flex items-center space-x-2 focus:outline-none"
        aria-expanded={isMenuOpen}
        aria-haspopup="true"
      >
        {user.user_metadata?.avatar_url ? (
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
        <span className="hidden md:block text-sm font-medium">
          {user.user_metadata?.name || user.email}
        </span>
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700">
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user.user_metadata?.name || 'Usuário'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
          </div>
          <a
            href="/perfil"
            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            onClick={() => setIsMenuOpen(false)}
          >
            <FaUserCog className="mr-2" />
            Perfil
          </a>
          <button
            onClick={handleSignOut}
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