"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { sanitizeInput } from "@/utils/sanitize";

// Reutilizamos el estilo de GlassCard o creamos uno integrado si no tienes el componente a mano
function GlassCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-8 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-gray-700/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)]">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200/50 dark:border-gray-700/50 pb-3 mb-6">
        {title}
      </h2>
      {children}
    </div>
  );
}

interface AlertState {
  title: string;
  message: string;
  type: "error" | "success" | "warning";
}

export default function PerfilPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [alertData, setAlertData] = useState<AlertState | null>(null);

  // Estados del perfil
  const [userId, setUserId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserId(user.id);
        setEmail(user.email || "");

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", user.id)
          .single();

        if (profile) {
          setFullName(profile.full_name || "");
          setRole(profile.role || "usuario");
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // P3.18: Sanitizamos el nombre antes de guardarlo
    const safeFullName = sanitizeInput(fullName);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: safeFullName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      setAlertData({
        title: "Error al actualizar",
        message: "No se pudo actualizar tu perfil. Intenta de nuevo.",
        type: "error",
      });
    } else {
      setFullName(safeFullName); // Actualizamos el estado local con la versión limpia
      setAlertData({
        title: "Perfil Actualizado",
        message: "Tus datos personales se han guardado exitosamente.",
        type: "success",
      });
    }
    
    setIsSaving(false);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Generar iniciales para el avatar
  const initials = fullName 
    ? fullName.substring(0, 2).toUpperCase() 
    : email.substring(0, 2).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      
      {/* MODAL DE ALERTA */}
      {alertData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 dark:bg-black/70 backdrop-blur-md transition-all">
          <div className="w-full max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-3xl border border-white/80 dark:border-gray-700/60 p-6 shadow-2xl space-y-4 text-center">
            <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border shadow-sm ${
              alertData.type === "error" 
                ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400" 
                : "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400"
            }`}>
              {alertData.type === "error" ? (
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-7 h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : (
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-7 h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                {alertData.title}
              </h3>
              <p className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-300 leading-relaxed">
                {alertData.message}
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setAlertData(null)}
                className="w-full py-3 rounded-xl font-bold text-sm text-white bg-blue-600/90 hover:bg-blue-600 shadow-md shadow-blue-500/20 backdrop-blur-sm transition-all"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] border border-white/60 dark:border-gray-700/50 transition-all">
        <div className="flex items-center space-x-5">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 text-white font-bold text-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white sm:text-3xl drop-shadow-sm">
              Mi Perfil 👤
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Gestiona tu información personal y preferencias de cuenta.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <GlassCard title="Información Personal">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Nombre Completo */}
            <div className="md:col-span-2">
              <label htmlFor="fullName" className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                Nombre Completo
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white text-sm outline-none transition-all shadow-inner focus:ring-2 focus:ring-blue-500/50"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Este nombre será visible para otros miembros de tu equipo.
              </p>
            </div>

            {/* Correo Electrónico (Solo Lectura) */}
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-3 rounded-xl bg-gray-100/50 dark:bg-gray-800/30 border border-transparent text-gray-500 dark:text-gray-400 text-sm outline-none cursor-not-allowed"
              />
            </div>

            {/* Rol en el Sistema (Solo Lectura) */}
            <div>
              <label htmlFor="role" className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                Rol en el Sistema
              </label>
              <div className="w-full px-4 py-3 rounded-xl bg-gray-100/50 dark:bg-gray-800/30 border border-transparent flex items-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm ${
                  role === 'admin' 
                    ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30'
                    : 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30'
                }`}>
                  {role === 'admin' ? 'Administrador' : 'Técnico / Staff'}
                </span>
              </div>
            </div>

          </div>
        </GlassCard>

        {/* Botones de acción */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 rounded-xl font-bold text-sm text-white bg-blue-600/90 hover:bg-blue-600 shadow-lg shadow-blue-500/30 backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}