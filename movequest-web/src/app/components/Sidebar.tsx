export default function Sidebar() {
  return (
    <aside className="bg-gray-50 w-64 min-h-screen border-r">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Navigation</h2>
        <nav className="space-y-2">
          <a href="/dashboard/student" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">
            Student Dashboard
          </a>
          <a href="/dashboard/teacher" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">
            Teacher Dashboard
          </a>
          {/* TODO: Add more navigation items */}
        </nav>
      </div>
    </aside>
  );
}