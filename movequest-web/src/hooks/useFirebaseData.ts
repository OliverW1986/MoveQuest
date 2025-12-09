import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { Student, ClassData } from '@/types/student';

export function useFirebaseData() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classData, setClassData] = useState<ClassData>({
    totalSteps: 0,
    currentChallenge: "",
    stepLeader: ""
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
              ...doc.data()
            } as Student);
          });

          setStudents(studentsData);

          const totalSteps = studentsData.reduce((sum, student) => sum + (student.stepsToday || 0), 0);

          setClassData({
            totalSteps: totalSteps,
            currentChallenge: "March Step Challenge",
            stepLeader: studentsData[0]?.name || "N/A"
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