import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ListOrdered, BrainCircuit, Settings, ShieldAlert } from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { label: "Draft Tool", icon: LayoutDashboard, href: "/" },
    { label: "Player Rankings", icon: ListOrdered, href: "/rankings" },
    { label: "Draft Strategy", icon: BrainCircuit, href: "/strategy" },
    { label: "Settings", icon: Settings, href: "/settings" }
  ];

  return (
    <div className="w-64 bg-[#161b22] border-r border-[#30363d] flex flex-col h-full shadow-2xl z-10">
      <div className="p-8 flex items-center space-x-3">
        <div className="h-10 w-10 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/30">
          <ShieldAlert className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-display font-bold text-white leading-none tracking-tighter italic">WARROOM</h1>
          <p className="text-[10px] text-[#8b949e] font-mono tracking-widest mt-1">v2.0 PRO</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <a className={cn(
                "flex items-center space-x-4 px-4 py-3.5 rounded-xl transition-all duration-200 group relative",
                isActive 
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(46,160,67,0.1)]" 
                  : "text-[#8b949e] hover:text-white hover:bg-[#21262d] border border-transparent"
              )}>
                {isActive && (
                  <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
                )}
                <item.icon className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isActive ? "scale-110" : "group-hover:scale-110"
                )} />
                <span className="text-sm font-medium tracking-tight">{item.label}</span>
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-[#30363d]">
        <div className="bg-[#0d1117] rounded-xl p-4 border border-[#30363d]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-[#8b949e] uppercase">ESPN Sync Status</span>
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          </div>
          <p className="text-[11px] text-[#c9d1d9] font-mono">ENCRYPTED_FEED_LIVE</p>
        </div>
      </div>
    </div>
  );
}
