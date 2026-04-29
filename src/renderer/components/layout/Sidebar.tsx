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
          w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors relative
          ${
            isActive
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }
        `}
      >
        {isActive && (
          <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary" />
        )}
        <Icon className="w-4 h-4 shrink-0" />
        {!collapsed && <span>{label}</span>}
      </button>
    );
  };

  return (
    <aside
      className="h-screen flex flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-200 shrink-0"
      style={{ width: collapsed ? 56 : 220 }}
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-2 px-4 h-14 border-b border-border shrink-0">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground text-xs font-bold">Y</span>
        </div>
        {!collapsed && <span className="text-sm font-medium">YemTicaret</span>}
      </div>

      {/* ── Navigasyon ── */}
      <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">

        {/* Gösterge Paneli */}
        {renderItem("dashboard", "Gösterge Paneli", LayoutDashboard)}

        {/* Cariler (genişletilebilir grup) */}
        <div className="pt-1">
          <button
            onClick={handleCarilerClick}
            className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors relative
              ${
                cariActive
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
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${
                    carilerOpen ? "rotate-180" : ""
                  }`}
                />
              </>
            )}
          </button>

          {!collapsed && carilerOpen && (
            <div className="mt-0.5 ml-3 pl-4 border-l border-border space-y-0.5">
              <button
                onClick={() => onNavigate("customers")}
                className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors ${
                  currentPage === "customers"
                    ? "text-primary bg-accent"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Müşteriler</span>
              </button>
              <button
                onClick={() => onNavigate("suppliers")}
                className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors ${
                  currentPage === "suppliers"
                    ? "text-primary bg-accent"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Truck className="w-3.5 h-3.5 shrink-0" />
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
      <div className="p-2 border-t border-border space-y-1 shrink-0">
        {/* ✅ YENİ: Ayarlar */}
        <button
          onClick={() => onNavigate("settings")}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            currentPage === "settings"
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Ayarlar</span>}
        </button>

        {/* Koyu/Açık mod */}
        <button
          onClick={onToggleDark}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {darkMode ? (
            <Sun className="w-4 h-4 shrink-0" />
          ) : (
            <Moon className="w-4 h-4 shrink-0" />
          )}
          {!collapsed && <span>{darkMode ? "Açık Mod" : "Koyu Mod"}</span>}
        </button>

        {/* Daralt */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 shrink-0" />
          ) : (
            <ChevronLeft className="w-4 h-4 shrink-0" />
          )}
          {!collapsed && <span>Daralt</span>}
        </button>

        {/* Çıkış */}
        <div className="pt-2 mt-2 border-t border-border/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <span className="flex-1 text-left truncate">
                {username || "Çıkış Yap"}
              </span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
