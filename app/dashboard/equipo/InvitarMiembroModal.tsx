"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { invitarMiembro } from "@/app/actions/equipo";

export default function InvitarMiembroModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);
  
  // Estado para saber si estamos en el cliente y poder usar el Portal
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await invitarMiembro(formData);

      if (result?.error) {
        setMessage({ text: result.error, type: "error" });
      } else {
        setMessage({ text: "¡Invitación enviada con éxito!", type: "success" });
        setTimeout(() => {
          setIsOpen(false);
          setMessage(null);
          router.refresh();
        }, 2000);
      }
    } catch (err) {
      console.error("Error al procesar la invitación:", err);
      setMessage({ 
        text: "Error de conexión o fallo en el servidor. Por favor intenta de nuevo.", 
        type: "error" 
      });
    } finally {
      // Garantiza que el botón 'Enviando...' siempre se restablezca
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-blue-600/90 hover:bg-blue-600 shadow-md shadow-blue-500/20 backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.66-1.546" />
        </svg>
        Invitar Miembro
      </button>

      {/* Usamos createPortal para que el modal escape del contenedor con backdrop-blur */}
      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/80 backdrop-blur-md transition-all animate-fade-in">
          <div className="w-full max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-3xl rounded-3xl border border-white/80 dark:border-gray-700/60 p-6 shadow-2xl">
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-4 drop-shadow-sm">
              Invitar al Equipo 🚀
            </h3>
            
            {message && (
              <div className={`p-3 rounded-lg mb-4 text-sm font-bold animate-fade-in ${
                message.type === 'error' 
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-l-4 border-red-500' 
                  : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-l-4 border-green-500'
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="invite-email" className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">
                  Correo Electrónico
                </label>
                <input 
                  id="invite-email"
                  type="email" 
                  name="email" 
                  required 
                  autoComplete="email"
                  placeholder="tecnico@empresa.com" 
                  className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/50 shadow-inner transition-all" 
                />
              </div>
              
              <div>
                <label htmlFor="invite-role" className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">
                  Rol en el Sistema
                </label>
                <select 
                  id="invite-role"
                  name="role" 
                  required 
                  className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 shadow-inner transition-all cursor-pointer"
                >
                  <option value="it_technician">Técnico / Staff</option>
                  <option value="admin">Administrador</option>
                </select>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  El rol de Administrador tiene acceso total a configuraciones y perfiles de la empresa.
                </p>
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsOpen(false);
                    setMessage(null);
                  }} 
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-md"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </span>
                  ) : "Enviar Invitación"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}