"use client";

import { db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useState, useEffect } from 'react';

// Sample data - replace with Firebase data later
interface Student {
  id: string;
  name: string;
  stepsToday: number;
  totalPoints: number;
  level: number;
}

interface ClassData {
  totalStudents: number;
  averageSteps: number;
  activeToday: number;
  totalPoints: number;
}

export function useFirebaseData() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classData, setClassData] = useState<ClassData>({
    totalStudents: 0,
    averageSteps: 0,
    activeToday: 0,
    totalPoints: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const studentsRef = collection(db, 'students');
    const q = query(studentsRef, orderBy('totalPoints', 'desc'));

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        try {
          const studentsData: Student[] = [];

          snapshot.forEach((doc) => {
            studentsData.push({
              id: doc.id,
              ...doc.data()} as Student)
            });

            setStudents(studentsData);

            const totalSteps = studentsData.reduce((sum, student) => sum + (student.stepsToday || 0), 0);
            const activeStudents = studentsData.filter(s => (s.stepsToday || 0) > 5000);

            setClassData({
              totalStudents: studentsData.length,
              averageSteps: studentsData.length > 0 ? Math.round(totalSteps / studentsData.length) : 0,
              activeToday: activeStudents.length,
              totalPoints: studentsData.reduce((sum, student) => sum + (student.totalPoints || 0), 0)
            });

            setLoading(false);
        } catch (error) {
          console.error("Error processing student data: ", error);
          setError("Error processing student data.");
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error fetching student data: ", error);
        setError("Error fetching student data.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { students, classData, loading, error };
}

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
        <p>Total step count: {/*{classData.totalPoints.toLocaleString()}*/}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Students"
          value={classData.totalStudents.toString()}
          icon="👥"
          color="bg-accent"
        />
        <StatsCard
          title="Average Steps"
          value={classData.averageSteps.toLocaleString()}
          icon="👟"
          color="bg-green-600"
        />
        <StatsCard
          title="Active Today"
          value={classData.activeToday.toString()}
          icon="🏃‍♂️"
          color="bg-orange-600"
        />
        <StatsCard
          title="Total Points"
          value={classData.totalPoints.toLocaleString()}
          icon="⭐"
          color="bg-purple-600"
        />
      </div>

      {/* Recent Activity & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-lg p-6 border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">Today&apos;s Step Leaders</h2>
          <div className="space-y-3">
            {students
              .sort((a, b) => (b.stepsToday || 0) - (a.stepsToday || 0))
              .slice(0, 5)
              .map((student, index) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-background rounded-md">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-400 text-black' :
                      index === 2 ? 'bg-orange-600 text-white' :
                      'bg-muted text-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-foreground font-medium">{student.name}</p>
                      <p className="text-muted text-sm">Level {student.level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-foreground font-semibold">{student.stepsToday.toLocaleString()}</p>
                    <p className="text-muted text-sm">steps</p>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-surface rounded-lg p-6 border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <ActivityItem
              user="Alice Johnson"
              action="completed a fitness challenge"
              time="5 minutes ago"
              points="+50 points"
            />
            <ActivityItem
              user="Bob Smith"
              action="reached 10,000 steps"
              time="12 minutes ago"
              points="+100 points"
            />
            <ActivityItem
              user="Diana Prince"
              action="leveled up to Level 5"
              time="1 hour ago"
              points="+200 points"
            />
            <ActivityItem
              user="Charlie Brown"
              action="joined a new challenge"
              time="2 hours ago"
              points=""
            />
          </div>
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