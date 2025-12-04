import StudentCard from './StudentCard';

interface Student {
  id: string;
  name: string;
  email: string;
  lastActive?: string;
  score?: number;
}

interface StudentListProps {
  students?: Student[];
}

export default function StudentList({ students = [] }: StudentListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Students</h3>
        <span className="text-sm text-gray-600">{students.length} students</span>
      </div>
      {students.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No students found</p>
          <p className="text-sm text-gray-400 mt-1">Add students to get started</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      )}
    </div>
  );
}