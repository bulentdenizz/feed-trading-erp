import React, { useState } from "react";
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
  LogOut,
  Settings,
  ShoppingCart,
  CreditCard
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";

export type Page =
  | 'dashboard'
  | 'customers'
  | 'suppliers'
  | 'inventory'
  | 'sales'
  | 'purchases'
  | 'payments'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  // Dark mode state (can be moved to a store later, for now local)
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains("dark"));
  
  const { username, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const onToggleDark = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.documentElement.classList.toggle("dark", newDarkMode);
  };

  // Cariler Group
  const cariPages = ["customers", "suppliers"];
  const cariActive = cariPages.includes(currentPage);
  const [carilerOpen, setCarilerOpen] = useState(cariActive);

  // İşlemler Group
  const islemPages = ["sales", "purchases", "payments"];
  const islemActive = islemPages.includes(currentPage);
  const [islemlerOpen, setIslemlerOpen] = useState(islemActive);

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

  const handleIslemlerClick = () => {
    if (collapsed) {
      onNavigate("sales");
      return;
    }
    if (islemActive) {
      setIslemlerOpen((o) => !o);
    } else {
      setIslemlerOpen(true);
      onNavigate("sales");
    }
  };

  const renderItem = (id: Page, label: string, Icon: React.ElementType) => {
    const isActive = currentPage === id;
    return (
      <button
        key={id}
        onClick={() => onNavigate(id)}
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
        {!collapsed && <span>{label}</span>}
      </button>
    );
  };

  return (
    <aside
      className="h-screen flex flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-200 shrink-0"
      style={{ width: collapsed ? 56 : 224 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-14 border-b border-border shrink-0">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground text-xs" style={{ fontWeight: 700 }}>Y</span>
        </div>
        {!collapsed && <span className="text-sm font-medium">YemTicaret</span>}
      </div>

      {/* Menu */}
      <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
        
        {/* Ana Menü */}
        {renderItem("dashboard", "Gösterge Paneli", LayoutDashboard)}

        {/* Cariler (expandable) */}
        <div className="pt-1">
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

          {!collapsed && carilerOpen && (
            <div className="mt-0.5 ml-3 pl-4 border-l border-border space-y-0.5">
              <button
                onClick={() => onNavigate("customers")}
                className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors ${
                  currentPage === "customers" ? "text-primary bg-accent" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Müşteriler</span>
              </button>
              <button
                onClick={() => onNavigate("suppliers")}
                className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors ${
                  currentPage === "suppliers" ? "text-primary bg-accent" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Truck className="w-3.5 h-3.5 shrink-0" />
                <span>Tedarikçiler</span>
              </button>
            </div>
          )}
        </div>

        {/* Stok */}
        <div className="pt-1">
          {renderItem("inventory", "Stok Yönetimi", Package)}
        </div>

        {/* İşlemler (expandable) */}
        <div className="pt-1">
          <button
            onClick={handleIslemlerClick}
            className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors relative
              ${islemActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }
            `}
          >
            {islemActive && (
              <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary" />
            )}
            <FileText className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">İşlemler</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${islemlerOpen ? "rotate-180" : ""}`}
                />
              </>
            )}
          </button>

          {!collapsed && islemlerOpen && (
            <div className="mt-0.5 ml-3 pl-4 border-l border-border space-y-0.5">
              <button
                onClick={() => onNavigate("sales")}
                className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors ${
                  currentPage === "sales" ? "text-primary bg-accent" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                <span>Satışlar</span>
              </button>
              <button
                onClick={() => onNavigate("purchases")}
                className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors ${
                  currentPage === "purchases" ? "text-primary bg-accent" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                <span>Alışlar</span>
              </button>
              <button
                onClick={() => onNavigate("payments")}
                className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors ${
                  currentPage === "payments" ? "text-primary bg-accent" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 shrink-0" />
                <span>Ödemeler</span>
              </button>
            </div>
          )}
        </div>

        {/* Raporlar */}
        <div className="pt-1">
          {renderItem("reports", "Raporlar", BarChart3)}
        </div>
      </nav>

      {/* Bottom controls */}
      <div className="p-2 border-t border-border space-y-1 shrink-0">
        <button
          onClick={() => onNavigate("settings")}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            currentPage === "settings" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Ayarlar</span>}
        </button>

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

        <div className="pt-2 mt-2 border-t border-border/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="flex-1 text-left truncate">{username || "Çıkış Yap"}</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
