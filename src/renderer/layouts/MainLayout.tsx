import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';

export default function MainLayout() {
  return (
    <div className="flex h-screen bg-background overflow-hidden text-slate-900">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-background relative">
        <Outlet />
      </main>
    </div>
  );
}
