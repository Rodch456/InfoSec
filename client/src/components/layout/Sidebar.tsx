import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/authContext';
import {
  LayoutDashboard,
  FileText,
  ScrollText,
  Users,
  BarChart3,
  ClipboardList,
  LogOut,
  Shield,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function Sidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const residentLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/reports', label: 'My Reports', icon: FileText },
    { href: '/reports/new', label: 'Submit Report', icon: ClipboardList },
    { href: '/memos', label: 'Memos & Ordinances', icon: ScrollText },
  ];

  const officialLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/reports', label: 'All Reports', icon: FileText },
    { href: '/memos', label: 'Memos & Ordinances', icon: ScrollText },
  ];

  const adminLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/reports', label: 'All Reports', icon: FileText },
    { href: '/memos', label: 'Memos & Ordinances', icon: ScrollText },
    { href: '/users', label: 'User Management', icon: Users },
    { href: '/logs', label: 'System Logs', icon: ClipboardList },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const links = user.role === 'admin' ? adminLinks : user.role === 'official' ? officialLinks : residentLinks;

  const roleLabel = user.role === 'admin' ? 'Administrator' : user.role === 'official' ? 'Barangay Official' : 'Resident';
  const RoleIcon = user.role === 'admin' ? Shield : user.role === 'official' ? Building2 : Users;

  return (
    <aside className="w-64 bg-card border-r border-border h-screen flex flex-col" data-testid="sidebar">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Barangay</h1>
            <p className="text-xs text-muted-foreground">Report System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href || (link.href !== '/dashboard' && location.startsWith(link.href));
          return (
            <Link key={link.href} href={link.href}>
              <a
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
                data-testid={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-3">
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <RoleIcon className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground">{roleLabel}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={logout}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
