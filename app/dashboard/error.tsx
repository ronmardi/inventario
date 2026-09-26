"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Aquí podrías enviar el error a un servicio de monitoreo como Sentry
    console.error("Dashboard Boundary Error:", error);
  }, [error]);

  return (
    <div className="flex h-[70vh] items-center justify-center p-4 animate-fade-in">
      <div className="max-w-md w-full bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl p-8 rounded-3xl border border-red-200/50 dark:border-red-900/30 shadow-2xl text-center space-y-5">
        
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white">¡Ups! Algo salió mal</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            Ocurrió un error inesperado al intentar cargar esta sección.
          </p>
        </div>

        <div className="flex gap-3 justify-center pt-4">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-md active:scale-95"
          >
            Reintentar
          </button>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-bold rounded-xl transition-all hover:bg-gray-300 dark:hover:bg-gray-700 active:scale-95"
          >
            Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}