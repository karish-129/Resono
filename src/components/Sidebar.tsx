import { Link, useLocation } from "react-router-dom";
import { Home, Plus, Settings, BarChart3, Bell, LogOut, Archive, UserCircle, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function Sidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { role } = useRole();

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Create", href: "/create", icon: Plus, adminOnly: true },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Archived", href: "/archived", icon: Archive },
    { name: "Users", href: "/users", icon: Users, adminOnly: true },
    { name: "User Profile", href: "/user-profile", icon: UserCircle },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getRoleBadge = () => {
    if (role === 'master') return { text: 'Master', variant: 'default' as const };
    if (role === 'admin') return { text: 'Admin', variant: 'secondary' as const };
    return { text: 'User', variant: 'outline' as const };
  };

  const roleBadge = getRoleBadge();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-sidebar-foreground">Resona</h1>
            <p className="text-xs text-sidebar-foreground/60">Smart AI Assistant</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          // Hide Create link for regular users
          if (item.adminOnly && role === 'user') {
            return null;
          }

          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Link
          to="/profile"
          className="flex items-center gap-3 px-3 py-2 hover:bg-sidebar-accent/50 rounded-lg transition-colors"
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {getInitials(user?.user_metadata?.full_name || user?.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
              </p>
              <Badge variant={roleBadge.variant} className="text-xs">
                {roleBadge.text}
              </Badge>
            </div>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {user?.email}
            </p>
          </div>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-accent-foreground"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
