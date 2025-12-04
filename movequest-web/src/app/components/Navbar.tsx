export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">MoveQuest</h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* TODO: Add navigation items */}
          </div>
        </div>
      </div>
    </nav>
  );
}