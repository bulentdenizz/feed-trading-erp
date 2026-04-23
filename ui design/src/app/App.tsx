import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { Musteriler } from "./components/Musteriler";
import { Tedarikcilar } from "./components/Tedarikcilar";
import { Stok } from "./components/Stok";
import { Faturalar } from "./components/Faturalar";

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <div className="flex h-screen font-['Inter',sans-serif] bg-background text-foreground overflow-hidden">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(!darkMode)}
      />
      <main className="flex-1 overflow-hidden flex">
        {activePage === "dashboard" && <Dashboard />}
        {activePage === "musteriler" && <Musteriler />}
        {activePage === "tedarikcilar" && <Tedarikcilar />}
        {activePage === "stok" && <Stok />}
        {activePage === "faturalar" && <Faturalar />}
        {activePage === "raporlar" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="w-12 h-12 rounded-xl border border-border flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-sm">Raporlar sayfası yakında eklenecek.</p>
          </div>
        )}
      </main>
    </div>
  );
}
