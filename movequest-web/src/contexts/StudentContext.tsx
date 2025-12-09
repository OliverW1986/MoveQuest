import { createContext, useContext, ReactNode, useState } from 'react';

interface Student {
  id: string;
  name: string;
  stepsToday: number;
  totalPoints: number;
  level: number;
}

interface StudentContextType {
  students: Student[];
  loading: boolean;
  error: string | null;
  selectedStudent: Student | null;
  setSelectedStudent: (student: Student | null) => void;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export function useStudents() {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudents must be used within StudentProvider');
  }
  return context;
}

interface StudentProviderProps {
  children: ReactNode;
  students: Student[];
  loading: boolean;
  error: string | null;
}

export function StudentProvider({ children, students, loading, error }: StudentProviderProps) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  return (
    <StudentContext.Provider value={{ students, loading, error, selectedStudent, setSelectedStudent }}>
      {children}
    </StudentContext.Provider>
  );
}