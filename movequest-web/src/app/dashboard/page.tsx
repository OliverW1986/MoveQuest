"use client";

import { db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { Student } from '@/types/student';
import { useFirebaseData } from '@/hooks/useFirebaseData';

export default function Dashboard() {
  const { students, classData, loading, error } = useFirebaseData();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-center h-64'>
          <div className='text-center'>
            <p className='text-red-500 mb-2'>Error loading dashboard data</p>
            <p className='text-muted text-sm'>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted">Welcome back! Here&apos;s what&apos;s happening in your class today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Total Steps"
          value={classData.totalSteps.toString()}
          icon="👟"
          color="bg-accent"
        />
        <StatsCard
          title="Current Challenge"
          value={classData.currentChallenge}
          icon="🏃‍♂️"
          color="bg-green-600"
        />
        <StatsCard
          title="Step Leader"
          value={classData.stepLeader}
          icon="🥇"
          color="bg-orange-600"
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Nate Cooley&apos;s Data</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <StatsCard
            title="Steps Today"
            value="8,542"
            icon="👟"
            color="bg-accent"
          />
          <StatsCard
            title="Total Points"
            value="1,250"
            icon="⭐"
            color="bg-yellow-600"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-surface rounded-lg p-6 border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionButton icon="📊" label="View Reports" />
          <QuickActionButton icon="🏆" label="Create Challenge" />
          <QuickActionButton icon="👤" label="Add Student" />
          <QuickActionButton icon="⚙️" label="Settings" />
        </div>
      </div>
    </div>
  );
}

// Component: Stats Card
interface StatsCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
}

function StatsCard({ title, value, icon, color }: StatsCardProps) {
  return (
    <div className="bg-surface rounded-lg p-6 border border-border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted text-sm">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Component: Activity Item
interface ActivityItemProps {
  user: string;
  action: string;
  time: string;
  points: string;
}

function ActivityItem({ user, action, time, points }: ActivityItemProps) {
  return (
    <div className="flex items-start space-x-3 p-3 bg-background rounded-md">
      <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-sm font-bold text-white">
        {user[0]}
      </div>
      <div className="flex-1">
        <p className="text-foreground text-sm">
          <span className="font-medium">{user}</span> {action}
        </p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-muted text-xs">{time}</p>
          {points && <p className="text-accent text-xs font-medium">{points}</p>}
        </div>
      </div>
    </div>
  );
}

// Component: Quick Action Button
interface QuickActionButtonProps {
  icon: string;
  label: string;
}

function QuickActionButton({ icon, label }: QuickActionButtonProps) {
  return (
    <button className="flex flex-col items-center justify-center p-4 bg-background hover:bg-accent/10 rounded-lg border border-border transition-colors">
      <span className="text-2xl mb-2">{icon}</span>
      <span className="text-foreground text-sm font-medium">{label}</span>
    </button>
  );
}