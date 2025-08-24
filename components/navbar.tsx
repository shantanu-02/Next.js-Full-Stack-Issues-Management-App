'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Plus } from 'lucide-react';

interface NavbarProps {
  user: {
    id: number;
    email: string;
    role: string;
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  if (!user) return null;

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">Issues Tracker</h1>
            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
              {user.role}
            </Badge>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">{user.email}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/issues/new')}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Issue
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}