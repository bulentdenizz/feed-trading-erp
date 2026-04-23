import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  BarChart3,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  UserCheck,
  Truck,
} from "lucide-react";

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

export function Sidebar({ activePage, onNavigate, darkMode, onToggleDark }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [carilerOpen, setCarilerOpen] = useState(
    activePage === "musteriler" || activePage === "tedarikcilar"
  );

  const cariPages = ["musteriler", "tedarikcilar"];
  const cariActive = cariPages.includes(activePage);

  const handleCarilerClick = () => {
    if (collapsed) {
      // Collapsed modda direkt müşterilere git
      onNavigate("musteriler");
      return;
    }
    if (cariActive) {
      setCarilerOpen((o) => !o);
    } else {
      setCarilerOpen(true);
      onNavigate("musteriler");
    }
  };

  const mainItems = [
    { id: "dashboard", label: "Gösterge Paneli", icon: LayoutDashboard },
    { id: "stok", label: "Stok", icon: Package },
    { id: "faturalar", label: "Faturalar", icon: FileText },
    { id: "raporlar", label: "Raporlar", icon: BarChart3 },
  ];

  return (
    <aside
      className="h-screen flex flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-200"
      style={{ width: collapsed ? 56 : 220, minWidth: collapsed ? 56 : 220 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-14 border-b border-border shrink-0">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground text-xs" style={{ fontWeight: 700 }}>Y</span>
        </div>
        {!collapsed && <span className="text-sm" style={{ fontWeight: 500 }}>YemTicaret</span>}
      </div>

      {/* Menu */}
      <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-hidden">

        {/* Dashboard */}
        {mainItems.slice(0, 1).map((item) => {
          const isActive = activePage === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors relative
                ${isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }
              `}
            >
              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary" />
              )}
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}

        {/* Cariler (expandable) */}
        <div>
          <button
            onClick={handleCarilerClick}
            className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors relative
              ${cariActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }
            `}
          >
            {cariActive && (
              <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary" />
            )}
            <Users className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Cariler</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${carilerOpen ? "rotate-180" : ""}`}
                />
              </>
            )}
          </button>

          {/* Sub-items */}
          {!collapsed && carilerOpen && (
            <div className="mt-0.5 ml-3 pl-4 border-l border-border space-y-0.5">
              {[
                { id: "musteriler", label: "Müşteriler", icon: UserCheck },
                { id: "tedarikcilar", label: "Tedarikçiler", icon: Truck },
              ].map((sub) => {
                const isActive = activePage === sub.id;
                const Icon = sub.icon;
                return (
                  <button
                    key={sub.id}
                    onClick={() => onNavigate(sub.id)}
                    className={`
                      w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors relative
                      ${isActive
                        ? "text-primary bg-accent"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }
                    `}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{sub.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Remaining items */}
        {mainItems.slice(1).map((item) => {
          const isActive = activePage === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors relative
                ${isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }
              `}
            >
              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary" />
              )}
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom controls */}
      <div className="p-2 border-t border-border space-y-1 shrink-0">
        <button
          onClick={onToggleDark}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {darkMode ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
          {!collapsed && <span>{darkMode ? "Açık Mod" : "Koyu Mod"}</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4 shrink-0" /> : <ChevronLeft className="w-4 h-4 shrink-0" />}
          {!collapsed && <span>Daralt</span>}
        </button>
      </div>
    </aside>
  );
}
