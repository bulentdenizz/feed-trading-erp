
# Yem Dükkanı ERP

Yem ticareti işletmeleri için profesyonel muhasebe ve stok yönetimi sistemi.

## Teknoloji Yığını

- **Desktop**: Electron
- **UI**: React + TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand + React Query
- **Database**: SQLite (better-sqlite3)
- **Build**: Electron Vite

## Kurulum

```bash
npm install
npm run dev
```

## Mimarı

- **Frontend**: `src/renderer/`
- **Backend**: `src/main/`
- **Database**: SQLite (userData/erp.db)
- **IPC**: contextBridge aracılığıyla guvenli iletişim

## Geliştirme Yol Haritası

Bkz. `ERP_Roadmap_UI_Updated.md`

## Lisans

