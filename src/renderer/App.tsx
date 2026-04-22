import { useState } from 'react'

export default function App() {
  const [page, setPage] = useState('dashboard')

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar - Şimdilik basit */}
      <aside className="w-56 bg-card border-r border-border p-4">
        <div className="text-xl font-bold text-primary mb-8">YemTicaret</div>
        <nav className="space-y-2">
          <button 
            onClick={() => setPage('dashboard')}
            className={`w-full text-left px-4 py-2 rounded-lg transition ${
              page === 'dashboard' ? 'bg-primary text-white' : 'hover:bg-muted'
            }`}
          >
            Gösterge Paneli
          </button>
          <button 
            onClick={() => setPage('customers')}
            className={`w-full text-left px-4 py-2 rounded-lg transition ${
              page === 'customers' ? 'bg-primary text-white' : 'hover:bg-muted'
            }`}
          >
            Müşteriler
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8">
        <h1 className="text-3xl font-bold mb-4">
          {page === 'dashboard' ? 'Gösterge Paneli' : 'Müşteriler'}
        </h1>
        <p className="text-muted-foreground">
          Sayfa içeriği yakında eklenecek...
        </p>
      </main>
    </div>
  )
}