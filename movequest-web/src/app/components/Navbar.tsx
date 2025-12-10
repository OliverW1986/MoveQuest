"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useState } from "react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-background shadow-sm border-b border-color-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/icons/movequest-icon.svg"
                alt="MoveQuest Logo"
                width={32}
                height={32}
              />
              {/* <span className="font-bold text-lg text-foreground">MoveQuest</span> */}
              <h1 className="text-xl font-bold text-foreground hidden sm:block">MoveQuest</h1>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/about">About</NavLink>
            <NavLink href="/features">Features</NavLink>
            <NavLink href="/pricing">Pricing</NavLink>
            <NavLink href="/dashboard">Dashboard</NavLink>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/sign-in"
              className="px-4 py-2 text-foreground hover:text-accent transition-colors">
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium transition-colors">
              Sign Up
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2">
            <span className={`w-6 h-0.5 bg-foreground transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`w-6 h-0.5 bg-foreground transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`w-6 h-0.5 bg-foreground transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-color-b">
            <div className="flex flex-col space-y-2 pt-4">
              <MobileNavLink href="/">Home</MobileNavLink>
              <MobileNavLink href="/about">About</MobileNavLink>
              <MobileNavLink href="/features">Features</MobileNavLink>
              <MobileNavLink href="/pricing">Pricing</MobileNavLink>
              <MobileNavLink href="/dashboard">Dashboard</MobileNavLink>
              <hr className="border-color my-2" />
              <Link
                href="/sign-in"
                className="px-4 py-2 text-foreground hover:text-accent transition-colors block">
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium transition-colors block text-center">
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 text-foreground hover:text-accent transition-colors rounded-md">
      {children}
    </Link>
  );
}

function MobileNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-4 py-2 text-foreground hover:text-accent transition-colors block">
      {children}
    </Link>
  );
}