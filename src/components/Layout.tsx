import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Calendar, Upload, Settings } from 'lucide-react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import OfflineIndicator from './OfflineIndicator';
import PwaUpdater from './PwaUpdater';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Layout() {
  const navItems = [
    { to: '/', icon: Calendar, label: '课表' },
    { to: '/import', icon: Upload, label: '导入' },
    { to: '/settings', icon: Settings, label: '设置' },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] overflow-hidden text-slate-900 font-sans relative">
      <OfflineIndicator />
      
      <main className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto pb-16 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 safe-area-pb z-40">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                  isActive ? "text-[#2D5A27]" : "text-slate-400 hover:text-slate-600"
                )
              }
            >
              <item.icon size={24} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
      
      <PwaUpdater />
    </div>
  );
}
