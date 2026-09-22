"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useTheme } from "next-themes";

// Emojis animados para el fondo del dashboard
const FLOATING_ITEMS = [
  { emoji: "📦", left: "5%", delay: "0s", duration: "18s", size: "text-4xl" },
  { emoji: "💻", left: "20%", delay: "-5s", duration: "22s", size: "text-5xl" },
  { emoji: "🖥️", left: "40%", delay: "-2s", duration: "20s", size: "text-3xl" },
  { emoji: "⌨️", left: "60%", delay: "-10s", duration: "25s", size: "text-4xl" },
  { emoji: "🖱️", left: "80%", delay: "-1s", duration: "18s", size: "text-3xl" },
  { emoji: "📱", left: "95%", delay: "-7s", duration: "21s", size: "text-4xl" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Estado para colapsar barra
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const navigation = [
    { name: "Inicio", href: "/dashboard", icon: HomeIcon },
    { name: "Inventario", href: "/dashboard/activos", icon: ArchiveIcon },
    { name: "Escanear Equipo", href: "/dashboard/escaner", icon: QrCodeIcon },
    { name: "Mantenimiento", href: "/dashboard/mantenimiento", icon: WrenchIcon },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      
      {/* Sidebar para Escritorio (Animada y Colapsable) */}
      <aside 
        className={`hidden md:flex md:flex-col bg-slate-900 relative transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-center px-4 bg-slate-950 transition-all">
          {isSidebarCollapsed ? (
            <span className="text-xl font-bold text-blue-500">TI</span>
          ) : (
            <span className="text-xl font-bold text-white tracking-tight truncate">Inventario TI</span>
          )}
        </div>
        
        {/* Botón para colapsar/expandir */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-20 bg-blue-600 hover:bg-blue-500 text-white p-1 rounded-full shadow-lg z-50 transition-colors"
        >
          <ChevronIcon className={`h-4 w-4 transition-transform duration-300 ${isSidebarCollapsed ? "rotate-180" : ""}`} />
        </button>

        <div className="flex flex-1 flex-col overflow-y-auto">
          <nav className="flex-1 space-y-2 px-3 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={isSidebarCollapsed ? item.name : ""}
                  className={`group flex items-center py-2.5 rounded-lg transition-colors ${
                    isSidebarCollapsed ? "justify-center px-0" : "px-3"
                  } ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <item.icon className={`h-5 w-5 shrink-0 ${isSidebarCollapsed ? "" : "mr-3"} ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
                  {!isSidebarCollapsed && <span className="text-sm font-medium whitespace-nowrap">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Menú Móvil (Overlay) - Sin cambios */}
      {isMobileMenuOpen && (
        <div className="relative z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="fixed inset-0 z-40 flex">
            <div className="relative flex w-full max-w-xs flex-1 flex-col bg-slate-900 pt-5 pb-4">
              <div className="flex items-center px-4 mb-4">
                <span className="text-xl font-bold text-white">Inventario TI</span>
                <button type="button" className="ml-auto flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white" onClick={() => setIsMobileMenuOpen(false)}>
                  <XIcon className="h-6 w-6 text-white" />
                </button>
              </div>
              <nav className="mt-5 space-y-1 px-2">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className={`group flex items-center px-3 py-2 text-base font-medium rounded-md ${isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}>
                      <item.icon className="mr-4 h-6 w-6 shrink-0" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Contenido Principal con Fondo Animado */}
      <div className="flex flex-1 flex-col overflow-hidden relative bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
        
        {/* Emojis Flotantes del Dashboard */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-30 dark:opacity-10">
          {FLOATING_ITEMS.map((item, i) => (
            <div
              key={i}
              className={`absolute bottom-[-10%] ${item.size} animate-float-up drop-shadow-md`}
              style={{ left: item.left, animationDelay: item.delay, animationDuration: item.duration }}
            >
              {item.emoji}
            </div>
          ))}
        </div>

        {/* Header Superior (Efecto Glass) */}
        <header className="relative z-20 flex h-16 shrink-0 items-center justify-between border-b border-white/40 dark:border-gray-700/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md px-4 md:px-6 shadow-sm transition-colors duration-300">
          <button type="button" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white md:hidden focus:outline-none" onClick={() => setIsMobileMenuOpen(true)}>
            <MenuIcon className="h-6 w-6" />
          </button>
          
          <div className="flex flex-1 justify-end items-center space-x-4">
            {mounted && (
              <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 rounded-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/50 dark:border-gray-600/50 text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 transition-all shadow-sm">
                {theme === "dark" ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
              </button>
            )}
            <button onClick={handleLogout} className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/50 dark:border-gray-600/50 rounded-lg hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-gray-800 transition-all shadow-sm">
              <LogoutIcon className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </header>

        {/* Área donde se renderizan las páginas */}
        <main className="relative z-10 flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

// Iconos SVG 
function ChevronIcon(props: React.SVGProps<SVGSVGElement>) { return <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>; }
function HomeIcon(props: React.SVGProps<SVGSVGElement>) { return <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>; }
function ArchiveIcon(props: React.SVGProps<SVGSVGElement>) { return <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>; }
function QrCodeIcon(props: React.SVGProps<SVGSVGElement>) { return <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5zM16.5 16.5h.008v.008h-.008v-.008zM16.5 19.5h.008v.008h-.008v-.008zM19.5 16.5h.008v.008h-.008v-.008zM19.5 19.5h.008v.008h-.008v-.008zM13.5 16.5h.008v.008h-.008v-.008zM13.5 19.5h.008v.008h-.008v-.008z" /></svg>; }
function WrenchIcon(props: React.SVGProps<SVGSVGElement>) { return <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.827M15.25 15.25l-2.062-2.062M13 13l-2.062-2.062M10.875 10.875a5.25 5.25 0 11-7.425-7.424 5.25 5.25 0 017.425 7.424z" /></svg>; }
function MenuIcon(props: React.SVGProps<SVGSVGElement>) { return <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>; }
function XIcon(props: React.SVGProps<SVGSVGElement>) { return <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>; }
function LogoutIcon(props: React.SVGProps<SVGSVGElement>) { return <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>; }