"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useTheme } from "next-themes";

const FLOATING_ITEMS = [
  { emoji: "📦", left: "10%", delay: "-2s", duration: "15s", size: "text-4xl" },
  { emoji: "💻", left: "25%", delay: "-8s", duration: "20s", size: "text-5xl" },
  { emoji: "🖥️", left: "45%", delay: "-4s", duration: "18s", size: "text-3xl" },
  { emoji: "⌨️", left: "65%", delay: "-12s", duration: "22s", size: "text-4xl" },
  { emoji: "🖱️", left: "80%", delay: "-1s", duration: "16s", size: "text-3xl" },
  { emoji: "📱", left: "90%", delay: "-9s", duration: "19s", size: "text-4xl" },
  { emoji: "📦", left: "35%", delay: "-15s", duration: "17s", size: "text-5xl" },
  { emoji: "🔧", left: "55%", delay: "-6s", duration: "21s", size: "text-3xl" },
  { emoji: "🔋", left: "15%", delay: "-11s", duration: "24s", size: "text-4xl" },
  { emoji: "🖨️", left: "75%", delay: "-3s", duration: "18s", size: "text-5xl" },
];

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Nuevo estado para alternar entre Login y Registro
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (isSignUp) {
      // Flujo de Registro
      const { error: signUpError } = await supabase.auth.signUp({ 
        email, 
        password 
      });

      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }
    } else {
      // Flujo de Inicio de Sesión
      const { error: signInError } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (signInError) {
        setError("Credenciales incorrectas o usuario no encontrado.");
        setIsLoading(false);
        return;
      }
    }

    // Si todo sale bien, redirigir al panel
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex flex-col justify-center py-12 sm:px-6 lg:px-8 overflow-hidden transition-colors duration-500">
      
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-40 dark:opacity-20">
        {FLOATING_ITEMS.map((item, i) => (
          <div
            key={i}
            className={`absolute bottom-[-10%] ${item.size} animate-float-up drop-shadow-md`}
            style={{
              left: item.left,
              animationDelay: item.delay,
              animationDuration: item.duration,
            }}
          >
            {item.emoji}
          </div>
        ))}
      </div>

      <div className="absolute top-4 right-4 z-20">
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2.5 rounded-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-md shadow-sm border border-white/60 dark:border-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all"
            aria-label="Alternar modo oscuro"
          >
            {theme === "dark" ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        )}
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="h-14 w-14 bg-blue-600/90 backdrop-blur-sm rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30 border border-blue-400/30">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white drop-shadow-sm">
          Inventario TI
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
          {isSignUp ? "Crea una cuenta nueva" : "Ingresa tus credenciales para continuar"}
        </p>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl py-8 px-4 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] sm:rounded-3xl sm:px-10 border border-white/60 dark:border-gray-700/50 transition-all duration-300">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {error && (
              <div className="bg-red-50/80 dark:bg-red-900/40 backdrop-blur-md border-l-4 border-red-500 p-4 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                Correo electrónico
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-white/50 dark:border-gray-600/50 rounded-xl shadow-inner placeholder-gray-400 text-gray-900 dark:text-white bg-white/60 dark:bg-gray-800/60 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent sm:text-sm transition-all"
                  placeholder="ejemplo@empresa.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                Contraseña
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-white/50 dark:border-gray-600/50 rounded-xl shadow-inner placeholder-gray-400 text-gray-900 dark:text-white bg-white/60 dark:bg-gray-800/60 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent sm:text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>
              {isSignUp && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  La contraseña debe tener al menos 6 caracteres.
                </p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-blue-600/90 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 disabled:opacity-70 disabled:cursor-not-allowed transition-all backdrop-blur-sm"
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  isSignUp ? "Crear Cuenta" : "Iniciar Sesión"
                )}
              </button>
            </div>
          </form>

          {/* Botón para alternar modos */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setPassword(""); // Limpiar contraseña por seguridad al cambiar
              }}
              className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              {isSignUp 
                ? "¿Ya tienes cuenta? Inicia sesión aquí" 
                : "¿No tienes cuenta? Regístrate gratis"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}