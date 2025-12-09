"use client";

import { useStudents } from "@/contexts/StudentContext";

export default function Sidebar() {
  const { students, loading, selectedStudent, setSelectedStudent } = useStudents();

  return (
    <aside className="bg-background w-64 min-h-screen border-r-2 border-color-b">
      <div className="p-4 flex flex-col h-full">
        <h2 className="text-lg font-semibold mb-4">Current Class:</h2>
        <select className="mb-6 p-2 border border-border rounded-lg bg-surface text-foreground">
          <option>Biology 101</option>
          <option>Chemistry 201</option>
          <option>Physics 301</option>
        </select>
        <div className="flex-1">
          <h2 className="text-lg font-semibold mb-4">
            Students: {!loading && `(${students.length})`}
          </h2>
          <div className="space-y-2 overflow-y-auto max-h-[60vh]">
            {loading ? (
              <div className="text-muted text-sm">Loading students...</div>
            ) : students.length === 0 ? (
              <div className="text-muted text-sm">No students found.</div>
            ) : (
              students.map((student) => (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`p-2 rounded-lg shadow-sm cursor-pointer transition-colors ${selectedStudent?.id === student.id ? 'bg-accent text-white' : 'bg-surface hover:bg-accent/10'}`}
                >
                  <div className="font-medium">{student.name}</div>
                  <div className="text-xs opacity-75">{student.stepsToday?.toLocaleString() || 0} steps</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}