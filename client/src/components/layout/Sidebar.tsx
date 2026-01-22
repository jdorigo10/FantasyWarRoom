import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ListOrdered, BrainCircuit, Settings, Footprints } from "lucide-react";
import { useDraftStore } from "@/lib/draftStore";

export function Sidebar() {
  const [location] = useLocation();
  const { settings } = useDraftStore();

  const navItems = [
    { label: "Draft Tool", icon: LayoutDashboard, href: "/" },
    { label: "Player Rankings", icon: ListOrdered, href: "/rankings" },
    { label: "Draft Strategy", icon: BrainCircuit, href: "/strategy" },
    { label: "Settings", icon: Settings, href: "/settings" }
  ];

  return (
    <div className={cn("w-64 border-r flex flex-col h-full shadow-2xl z-10 transition-colors duration-500",
      settings.theme === 'dark' ? "bg-[#161b22] border-[#30363d]" : "bg-white border-gray-200")}>
      <div className="p-8 flex flex-col space-y-6">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/30">
            <Footprints className="h-6 w-6 text-primary rotate-[135deg]" fill="currentColor" />
          </div>
          <div>
            <h1 className={cn("text-lg font-display font-bold leading-none tracking-tighter italic transition-colors",
              settings.theme === 'dark' ? "text-white" : "text-gray-900")}>
              FANTASY<br />WARROOM
            </h1>
          </div>
        </div>
        <div className={cn("h-px w-full", settings.theme === 'dark' ? "bg-[#30363d]" : "bg-gray-200")} />
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <a className={cn(
                "flex items-center space-x-4 px-4 py-3.5 rounded-xl transition-all duration-200 group relative",
                isActive 
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(46,160,67,0.1)]" 
                  : cn("text-[#8b949e] border border-transparent hover:text-white", 
                      settings.theme === 'dark' ? "hover:bg-[#21262d]" : "hover:bg-gray-100")
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
        <div className={cn("rounded-xl p-4 border transition-colors duration-500",
          settings.theme === 'dark' ? "bg-[#0d1117] border-[#30363d]" : "bg-gray-50 border-gray-200")}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-[#8b949e] uppercase tracking-widest">v2.0</span>
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          </div>
          <p className={cn("text-[11px] font-mono transition-colors",
            settings.theme === 'dark' ? "text-[#c9d1d9]" : "text-gray-900")}>LOCAL_SYNC_ACTIVE</p>
        </div>
      </div>
    </div>
  );
}
