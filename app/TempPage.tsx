"use client";

import React, { useState } from 'react';
import { TaskProvider } from './context/TaskContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';
import { useOffline } from './hooks/useOffline';

export default function TempPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const isOffline = useOffline();
  const isOnline = !isOffline;

  return (
    <TaskProvider>
      <div className={`app-container ${darkMode ? 'dark' : ''}`}>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
          <Header 
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
            onEnterFocusMode={() => {}}
            onShowDashboard={() => {}}
            onShowCalendar={() => {}}
            onOpenSearch={() => {}} 
            onOpenThemeSelector={() => {}}
            onOpenTagsManager={() => {}}
            onOpenWalkthrough={() => {}}
            onOpenNotificationSettings={() => {}}
            onShowOverview={() => {}}
            pendingNotificationCount={0}
          />
          
          <div className="flex h-[calc(100vh-4rem)]">
            <Sidebar 
              isOpen={sidebarOpen} 
              onClose={() => setSidebarOpen(false)}
              onEnterFocusMode={() => {}}
              onShowCalendar={() => {}}
              onOpenSearch={() => {}}
              onOpenTagsManager={() => {}}
              onShowPomodoroTimer={() => {}}
              onShowHabitsTracker={() => {}}
              onShowGoalPlanner={() => {}}
              onShowWorkflowAutomation={() => {}}
            />
            
            <div className={`flex-grow p-6 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
              <TaskForm />
              <TaskList />
            </div>
          </div>
          
          {/* Status de conexão */}
          <div className="fixed bottom-4 right-4">
            <div className={`px-3 py-2 rounded-lg ${isOnline ? 'bg-green-500' : 'bg-red-500'} text-white`}>
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
      </div>
    </TaskProvider>
  );
} 