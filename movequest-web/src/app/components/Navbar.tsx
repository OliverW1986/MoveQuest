import Link from "next/link";
// import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  // const { user, logout, isLoading } = useAuth();

  return (
    <nav className="bg-background shadow-sm border-b border-color-b">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center pl-16">
            <Link href="/">
              <h1 className="text-xl font-semibold text-foreground">MoveQuest</h1>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/about">About</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/sign-in">Sign in</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}