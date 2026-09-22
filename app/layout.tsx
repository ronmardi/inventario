import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers"; // <-- Importamos el Provider de temas
import { Toaster } from "sonner"; // <-- 1. Importamos Toaster de sonner

// Configuración de fuentes locales autohospedadas (cero dependencias externas)
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Inventario TI", // <-- Nombre de tu app
  description: "Sistema de gestión de inventario de equipos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es" // <-- Cambiado a español
      suppressHydrationWarning // <-- CRÍTICO: Evita errores visuales al cargar next-themes
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <Providers>
          {children}
          {/* 2. Añadimos el Toaster configurado con soporte para temas y diseño Liquid */}
          <Toaster 
            position="top-right" 
            richColors 
            theme="system" 
            toastOptions={{
              className: 'backdrop-blur-xl border border-white/40 dark:border-gray-700/50 shadow-xl',
            }}
          />
        </Providers>
      </body>
    </html>
  );
}