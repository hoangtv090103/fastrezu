"use client";

import { User } from "@supabase/supabase-js";
import LogoutButton from "@/components/auth/LogoutButton";
import Link from "next/link";

interface AuthenticatedHeaderProps {
  user: User;
}

export default function AuthenticatedHeader({ user }: AuthenticatedHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <span className="heading-feature text-xl text-gray-900">FastRezu</span>
            </Link>
            
            <nav className="hidden md:flex space-x-6">
              <Link 
                href="/dashboard" 
                className="text-gray-600 hover:text-gray-900 small-text transition-colors duration-200"
              >
                Dashboard
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="small-text text-gray-600">
                {user.email}
              </p>
              <p className="text-xs text-gray-500">
                Beta Free
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
