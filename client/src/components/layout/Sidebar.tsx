import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Grid3X3, Settings, ShieldAlert } from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { icon: Grid3X3, label: "Draft Board", href: "/board" },
    { icon: LayoutDashboard, label: "Mock Draft", href: "/" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <div className="w-16 md:w-56 h-screen border-r border-[#30363d] bg-[#161b22] flex flex-col flex-shrink-0 font-sans">
      <div className="h-14 flex items-center px-4 border-b border-[#30363d] bg-[#0d1117]">
        <ShieldAlert className="h-5 w-5 text-primary mr-3" />
        <span className="hidden md:inline font-display font-bold text-sm tracking-widest text-white uppercase">
          Fantasy <span className="text-primary">WarRoom</span>
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
                    ? "bg-[#21262d] text-primary border-l-2 border-primary" 
                    : "text-[#8b949e] hover:bg-[#1c2128] hover:text-[#c9d1d9]"
                )}
              >
                <item.icon className={cn("h-4 w-4 md:mr-3 transition-colors", isActive ? "text-primary" : "group-hover:text-[#c9d1d9]")} />
                <span className="hidden md:inline font-medium uppercase tracking-tighter">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
