"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function ActualizarPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsLoading(true);

    // Actualiza la contraseña en Supabase
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      setError("Hubo un error al actualizar la contraseña. El enlace puede haber expirado.");
      setIsLoading(false);
    } else {
      // Éxito, redirigir al dashboard
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-500">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Nueva Contraseña 🔒
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
          Ingresa tu nueva clave de acceso
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl py-8 px-4 shadow-xl sm:rounded-3xl sm:px-10 border border-white/60 dark:border-gray-700/50">
          <form className="space-y-6" onSubmit={handleUpdate}>
            
            {error && (
              <div className="bg-red-50/80 dark:bg-red-900/40 border-l-4 border-red-500 p-4 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">Nueva Contraseña</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full px-4 py-3 border border-white/50 dark:border-gray-600/50 rounded-xl shadow-inner text-gray-900 dark:text-white bg-white/60 dark:bg-gray-800/60 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">Confirmar Contraseña</label>
              <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 block w-full px-4 py-3 border border-white/50 dark:border-gray-600/50 rounded-xl shadow-inner text-gray-900 dark:text-white bg-white/60 dark:bg-gray-800/60 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••" />
            </div>

            <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-70 transition-all">
              {isLoading ? "Guardando..." : "Actualizar Contraseña"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}