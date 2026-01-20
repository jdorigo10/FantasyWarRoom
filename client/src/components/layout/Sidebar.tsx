import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Grid3X3, Settings, Trophy, BarChart3, Terminal } from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Analysis Room", href: "/" },
    { icon: Grid3X3, label: "Draft Board", href: "/board" },
    { icon: Users, label: "Roster View", href: "/team" },
    { icon: BarChart3, label: "Market Trends", href: "/analytics" },
    { icon: Settings, label: "App Settings", href: "/settings" },
  ];

  return (
    <div className="w-16 md:w-56 h-screen border-r border-[#333333] bg-[#252526] flex flex-col flex-shrink-0 font-sans">
      <div className="h-14 flex items-center px-4 border-b border-[#333333] bg-[#1e1e1e]">
        <Terminal className="h-5 w-5 text-primary mr-3" />
        <span className="hidden md:inline font-display font-bold text-sm tracking-widest text-white uppercase">
          Draft<span className="text-primary">Alpha</span>
        </span>
      </div>

      <nav className="flex-1 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center px-4 py-2 text-xs transition-all cursor-pointer group",
                  isActive 
                    ? "bg-[#37373d] text-primary border-l-2 border-primary" 
                    : "text-[#969696] hover:bg-[#2a2d2e] hover:text-[#cccccc]"
                )}
              >
                <item.icon className={cn("h-4 w-4 md:mr-3 transition-colors", isActive ? "text-primary" : "group-hover:text-[#cccccc]")} />
                <span className="hidden md:inline font-medium uppercase tracking-tighter">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 bg-[#1e1e1e] border-t border-[#333333] hidden md:block">
        <div className="text-[9px] font-mono text-muted-foreground uppercase mb-1">Local Host</div>
        <div className="text-[10px] text-primary font-bold truncate">win11-analyzer-v2.0</div>
      </div>
    </div>
  );
}
