import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Calculator,
  TrendingUp,
  Settings,
  Menu,
  X,
  Boxes,
  FileSpreadsheet,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { href: '/materials', label: 'Bahan Baku', icon: <Boxes className="w-5 h-5" /> },
  { href: '/products', label: 'Produk', icon: <Package className="w-5 h-5" /> },
  { href: '/sales', label: 'Penjualan', icon: <ShoppingCart className="w-5 h-5" /> },
  { href: '/calculator', label: 'Kalkulator HPP', icon: <Calculator className="w-5 h-5" /> },
  { href: '/forecast', label: 'Rekomendasi', icon: <TrendingUp className="w-5 h-5" /> },
  { href: '/reports', label: 'Laporan', icon: <FileSpreadsheet className="w-5 h-5" /> },
  { href: '/settings', label: 'Pengaturan', icon: <Settings className="w-5 h-5" /> },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-sidebar border-b border-sidebar-border flex items-center px-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 text-sidebar-foreground hover:bg-sidebar-accent rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="ml-4 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-sidebar-primary" />
          <span className="font-bold text-sidebar-foreground">HPPCalc</span>
        </div>
      </header>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-foreground/50 z-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-screen w-64 bg-sidebar z-50 transition-transform duration-300 flex flex-col',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
              <Calculator className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-sidebar-foreground">HPPCalc</h1>
              <p className="text-xs text-sidebar-foreground/60">Kalkulator HPP</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-sidebar-foreground hover:bg-sidebar-accent rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'nav-item',
                  isActive && 'nav-item-active'
                )
              }
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="px-3 py-2 rounded-lg bg-sidebar-accent/50">
            <p className="text-xs text-sidebar-foreground/70">
              HPPCalc v1.0
            </p>
            <p className="text-xs text-sidebar-foreground/50 mt-1">
              Kelola biaya produksi Anda
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
