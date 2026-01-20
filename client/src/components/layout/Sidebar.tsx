import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Grid3X3, Settings, Trophy, BarChart3 } from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Draft Room", href: "/" },
    { icon: Users, label: "My Team", href: "/team" },
    { icon: Grid3X3, label: "Draft Board", href: "/board" },
    { icon: BarChart3, label: "Analytics", href: "/analytics" },
    { icon: Trophy, label: "League", href: "/league" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <div className="w-16 md:w-64 h-screen border-r border-border bg-sidebar flex flex-col flex-shrink-0">
      <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-border">
        <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold font-display mr-0 md:mr-3">
          DA
        </div>
        <span className="hidden md:inline font-display font-bold text-lg tracking-wider text-foreground">
          DRAFT<span className="text-primary">ALPHA</span>
        </span>
      </div>

      <nav className="flex-1 py-6 space-y-1 px-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center px-2 md:px-4 py-3 rounded-md transition-all cursor-pointer group",
                  isActive 
                    ? "bg-sidebar-accent text-primary border-l-2 border-primary" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5 md:mr-3 transition-colors", isActive ? "text-primary" : "group-hover:text-foreground")} />
                <span className="hidden md:inline font-medium text-sm">{item.label}</span>
                {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary hidden md:block shadow-[0_0_8px_hsl(var(--primary))]" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border hidden md:block">
        <div className="bg-gradient-to-br from-primary/20 to-transparent rounded-lg p-4 border border-primary/20">
            <h4 className="text-xs font-bold text-primary mb-1">PRO STATUS</h4>
            <p className="text-[10px] text-muted-foreground mb-3">Upgrade for AI-powered trade analyzer.</p>
            <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-primary" />
            </div>
        </div>
      </div>
    </div>
  );
}
