"use client";

import { ReactNode } from 'react';
import Sidebar from '../components/Sidebar';
import { StudentProvider } from '@/contexts/StudentContext';
import { useFirebaseData } from '@/hooks/useFirebaseData';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { students, classData, loading, error } = useFirebaseData();

  return (
    <StudentProvider students={students} loading={loading} error={error}>
      <div className="min-h-screen bg-background">
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </StudentProvider>
  );
}