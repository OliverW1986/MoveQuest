interface Student {
  id: string;
  name: string;
  email: string;
  lastActive?: string;
  score?: number;
}

interface StudentCardProps {
  student: Student;
}

export default function StudentCard({ student }: StudentCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-gray-900">{student.name}</h4>
        {student.score && (
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {student.score} pts
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-2">{student.email}</p>
      {student.lastActive && (
        <p className="text-xs text-gray-500">
          Last active: {student.lastActive}
        </p>
      )}
    </div>
  );
}