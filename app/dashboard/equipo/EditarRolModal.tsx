"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface EditarRolModalProps {
  memberId: string;
  memberName: string;
  currentRole: string;
}

export default function EditarRolModal({ memberId, memberName, currentRole }: EditarRolModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState(currentRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => {
    setIsOpen(false);
    setError(null);
    setRole(currentRole);
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === currentRole) {
      handleClose();
      return;
    }

    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", memberId);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      setLoading(false);
      setIsOpen(false);
      router.refresh(); // Refresca la vista principal (Server Component) para mostrar el nuevo rol
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="text-blue-600 hover:text-blue-500 dark:text-blue-400 font-semibold text-xs transition-colors"
      >
        Editar Rol
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Editar Rol de Usuario
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Cambia el nivel de acceso para <span className="font-bold text-gray-700 dark:text-gray-300">{memberName}</span>.
              </p>

              <form onSubmit={handleUpdateRole} className="mt-6 space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Rol en el Sistema
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    disabled={loading}
                  >
                    <option value="employee">Empleado (Solo ver sus asignaciones)</option>
                    <option value="it_technician">Técnico / Staff (Gestionar inventario)</option>
                    <option value="superadmin">Administrador (Acceso total)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800 mt-6">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 transition-all flex items-center"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Guardando...
                      </>
                    ) : (
                      "Guardar Cambios"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}