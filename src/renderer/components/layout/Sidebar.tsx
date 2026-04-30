import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  UserCheck,
  Truck,
  Users,
  LogOut,
  Settings,
  ShoppingCart,
  ArrowDownCircle,
  CreditCard,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Düzeltildi: split kullanımı ('/sales' → 'sales')
  const currentPage = location.pathname.split("/")[1] || "dashboard";

  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains("dark")
  );

  const { username, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const onToggleDark = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.documentElement.classList.toggle("dark", newDarkMode);
  };

  const onNavigate = (path: string) => {
    navigate(`/${path}`);
  };

  // ─── Cariler Grubu (genişletilebilir) ─────────────────────────────────────
  const cariPages = ["customers", "suppliers"];
  const cariActive = cariPages.includes(currentPage);
  const [carilerOpen, setCarilerOpen] = useState(cariActive);

  useEffect(() => {
    if (cariActive) setCarilerOpen(true);
  }, [cariActive]);

  const handleCarilerClick = () => {
    if (collapsed) {
      onNavigate("customers");
      return;
    }
    if (cariActive) {
      setCarilerOpen((o) => !o);
    } else {
      setCarilerOpen(true);
      onNavigate("customers");
    }
  };

  // ─── Tekil menü öğesi render ───────────────────────────────────────────────
  const renderItem = (id: string, label: string, Icon: React.ElementType) => {
    const isActive = currentPage === id;
    return (
      <button
        key={id}
        onClick={() => onNavigate(id)}
        className={`
          w-full flex items-center ${collapsed ? "justify-center" : "gap-3 px-3"} py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group
          ${
            isActive
              ? "bg-primary/10 text-primary dark:bg-primary/20"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }
        `}
      >
        {isActive && !collapsed && (
          <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary" />
        )}
        <Icon className={`shrink-0 transition-all duration-200 ${collapsed ? "w-6 h-6" : "w-5 h-5"} ${isActive && collapsed ? "text-primary" : ""}`} />
        {!collapsed && <span className="truncate">{label}</span>}
        
        {/* Tooltip for collapsed state */}
        {collapsed && (
          <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-popover text-popover-foreground text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap shadow-md z-50 transition-opacity duration-200 border border-border">
            {label}
          </div>
        )}
      </button>
    );
  };

  return (
    <aside
      className="h-screen flex flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out shrink-0 relative z-20"
      style={{ width: collapsed ? 80 : 260 }}
    >
      {/* ── Logo ── */}
      <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3 px-6"} h-20 border-b border-border/50 shrink-0`}>
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm shadow-primary/20">
          <span className="text-primary-foreground text-sm font-bold tracking-wider">Y</span>
        </div>
        {!collapsed && <span className="text-base font-semibold tracking-tight">YemTicaret</span>}
      </div>

      {/* ── Navigasyon ── */}
      <nav className={`flex-1 py-6 space-y-1 ${collapsed ? "px-3" : "px-4"} overflow-y-auto no-scrollbar`}>

        {/* Gösterge Paneli */}
        {renderItem("dashboard", "Gösterge Paneli", LayoutDashboard)}

        {/* Cariler (genişletilebilir grup) */}
        <div className="pt-2 pb-1">
          <button
            onClick={handleCarilerClick}
            className={`
              w-full flex items-center ${collapsed ? "justify-center" : "gap-3 px-3"} py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group
              ${
                cariActive
                  ? "bg-primary/10 text-primary dark:bg-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }
            `}
          >
            {cariActive && !collapsed && (
              <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary" />
            )}
            <Users className={`shrink-0 transition-all duration-200 ${collapsed ? "w-6 h-6" : "w-5 h-5"} ${cariActive && collapsed ? "text-primary" : ""}`} />
            {!collapsed && (
              <>
                <span className="flex-1 text-left truncate">Cariler</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    carilerOpen ? "rotate-180" : ""
                  }`}
                />
              </>
            )}
            {collapsed && (
              <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-popover text-popover-foreground text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap shadow-md z-50 transition-opacity duration-200 border border-border">
                Cariler
              </div>
            )}
          </button>

          {!collapsed && carilerOpen && (
            <div className="mt-1 ml-4 pl-4 border-l-2 border-border/50 space-y-1">
              <button
                onClick={() => onNavigate("customers")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentPage === "customers"
                    ? "text-primary bg-primary/5 dark:bg-primary/10"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <UserCheck className="w-4 h-4 shrink-0" />
                <span>Müşteriler</span>
              </button>
              <button
                onClick={() => onNavigate("suppliers")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentPage === "suppliers"
                    ? "text-primary bg-primary/5 dark:bg-primary/10"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Truck className="w-4 h-4 shrink-0" />
                <span>Tedarikçiler</span>
              </button>
            </div>
          )}
        </div>

        {/* Stok */}
        {renderItem("inventory", "Stok", Package)}

        {/* ✅ YENİ: Satışlar, Alışlar, Ödemeler — tekil öğeler */}
        {renderItem("sales", "Satışlar", ShoppingCart)}
        {renderItem("purchases", "Alışlar", ArrowDownCircle)}
        {renderItem("payments", "Ödemeler", CreditCard)}

        {/* Raporlar */}
        {renderItem("reports", "Raporlar", BarChart3)}
      </nav>

      {/* ── Alt Kontroller ── */}
      <div className={`p-4 border-t border-border/50 space-y-1.5 shrink-0 bg-sidebar/50 backdrop-blur-sm`}>
        {/* Ayarlar */}
        <button
          onClick={() => onNavigate("settings")}
          className={`w-full flex items-center ${collapsed ? "justify-center" : "gap-3 px-3"} py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
            currentPage === "settings"
              ? "bg-primary/10 text-primary dark:bg-primary/20"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Settings className={`shrink-0 transition-all duration-200 ${collapsed ? "w-6 h-6" : "w-5 h-5"} ${currentPage === "settings" && collapsed ? "text-primary" : ""}`} />
          {!collapsed && <span>Ayarlar</span>}
          {collapsed && (
            <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-popover text-popover-foreground text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap shadow-md z-50 border border-border">
              Ayarlar
            </div>
          )}
        </button>

        {/* Koyu/Açık mod */}
        <button
          onClick={onToggleDark}
          className={`w-full flex items-center ${collapsed ? "justify-center" : "gap-3 px-3"} py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 group`}
        >
          {darkMode ? (
            <Sun className={`shrink-0 transition-all duration-200 ${collapsed ? "w-6 h-6" : "w-5 h-5"}`} />
          ) : (
            <Moon className={`shrink-0 transition-all duration-200 ${collapsed ? "w-6 h-6" : "w-5 h-5"}`} />
          )}
          {!collapsed && <span>{darkMode ? "Açık Mod" : "Koyu Mod"}</span>}
          {collapsed && (
            <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-popover text-popover-foreground text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap shadow-md z-50 border border-border">
              {darkMode ? "Açık Mod" : "Koyu Mod"}
            </div>
          )}
        </button>

        {/* Daralt */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center ${collapsed ? "justify-center" : "gap-3 px-3"} py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 group`}
        >
          {collapsed ? (
            <ChevronRight className={`shrink-0 transition-all duration-200 ${collapsed ? "w-6 h-6" : "w-5 h-5"}`} />
          ) : (
            <ChevronLeft className={`shrink-0 transition-all duration-200 ${collapsed ? "w-6 h-6" : "w-5 h-5"}`} />
          )}
          {!collapsed && <span>Daralt</span>}
          {collapsed && (
            <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-popover text-popover-foreground text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap shadow-md z-50 border border-border">
              Genişlet
            </div>
          )}
        </button>

        {/* Çıkış */}
        <div className={`pt-3 mt-3 border-t border-border/50`}>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${collapsed ? "justify-center" : "gap-3 px-3"} py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 transition-all duration-200 group`}
          >
            <LogOut className={`shrink-0 transition-all duration-200 ${collapsed ? "w-6 h-6" : "w-5 h-5"}`} />
            {!collapsed && (
              <span className="flex-1 text-left truncate">
                {username || "Çıkış Yap"}
              </span>
            )}
            {collapsed && (
              <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-popover text-popover-foreground text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap shadow-md z-50 border border-border">
                Çıkış Yap
              </div>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
