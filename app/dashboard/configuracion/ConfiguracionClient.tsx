"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
  description: string | null;
}

interface Location {
  id: string;
  name: string;
  address: string | null;
}

interface AlertState {
  title: string;
  message: string;
  type: "error" | "success" | "warning";
}

export default function ConfiguracionPage() {
  const supabase = createClient();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados para creación
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newLocName, setNewLocName] = useState("");
  const [newLocAddress, setNewLocAddress] = useState("");

  // Estados para edición (Modales)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  // P1.11 / P3.22: Estados para Modales de Alerta y Confirmación (reemplazan alert() y confirm())
  const [alertData, setAlertData] = useState<AlertState | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string; type: "category" | "location" } | null>(null);

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push("/login");
      return;
    }

    // 🔴 SEGURIDAD: Obtener también el rol del usuario
    const { data: profile } = await supabase
      .from("profiles")
      .select("client_id, role") // <-- Agregar role
      .eq("id", user.id)
      .single();

    // 🔴 SEGURIDAD: Redirigir si no es admin o técnico
    if (!profile?.client_id || (profile.role !== "superadmin" && profile.role !== "it_technician")) {
      router.push("/dashboard");
      return;
    }
    
    setClientId(profile.client_id);

    const [{ data: cats }, { data: locs }] = await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase.from("locations").select("*").order("name"),
    ]);

    if (cats) setCategories(cats);
    if (locs) setLocations(locs);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, router]);

  // CATEGORÍAS: Crear, Editar
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !clientId) return;

    const { error } = await supabase.from("categories").insert({
      client_id: clientId,
      name: newCatName,
      description: newCatDesc || null,
    });

    if (error) {
      setAlertData({ title: "Error", message: "No se pudo crear la categoría.", type: "error" });
      return;
    }

    setNewCatName("");
    setNewCatDesc("");
    setAlertData({ title: "Éxito", message: "Categoría creada correctamente.", type: "success" });
    loadData();
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    const { error } = await supabase
      .from("categories")
      .update({
        name: editingCategory.name,
        description: editingCategory.description,
      })
      .eq("id", editingCategory.id);

    if (error) {
      setAlertData({ title: "Error", message: "No se pudo actualizar la categoría.", type: "error" });
      return;
    }

    setEditingCategory(null);
    setAlertData({ title: "Actualizado", message: "Categoría guardada correctamente.", type: "success" });
    loadData();
  };

  // UBICACIONES: Crear, Editar
  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName || !clientId) return;

    const { error } = await supabase.from("locations").insert({
      client_id: clientId,
      name: newLocName,
      address: newLocAddress || null,
    });

    if (error) {
      setAlertData({ title: "Error", message: "No se pudo crear la ubicación.", type: "error" });
      return;
    }

    setNewLocName("");
    setNewLocAddress("");
    setAlertData({ title: "Éxito", message: "Ubicación creada correctamente.", type: "success" });
    loadData();
  };

  const handleUpdateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocation) return;

    const { error } = await supabase
      .from("locations")
      .update({
        name: editingLocation.name,
        address: editingLocation.address,
      })
      .eq("id", editingLocation.id);

    if (error) {
      setAlertData({ title: "Error", message: "No se pudo actualizar la ubicación.", type: "error" });
      return;
    }

    setEditingLocation(null);
    setAlertData({ title: "Actualizado", message: "Ubicación guardada correctamente.", type: "success" });
    loadData();
  };

  // P1.11: ELIMINACIÓN UNIFICADA (Reemplaza los confirm() y alert())
  const executeDelete = async () => {
    if (!confirmDelete) return;

    const table = confirmDelete.type === "category" ? "categories" : "locations";
    const { error } = await supabase.from(table).delete().eq("id", confirmDelete.id);

    if (error) {
      setAlertData({
        title: "No se puede eliminar",
        message: `Hay equipos asociados a esta ${confirmDelete.type === "category" ? "categoría" : "ubicación"}. Reasígnalos primero.`,
        type: "warning",
      });
    } else {
      setAlertData({
        title: "Eliminado",
        message: `La ${confirmDelete.type === "category" ? "categoría" : "ubicación"} ha sido eliminada.`,
        type: "success",
      });
      loadData();
    }
    
    setConfirmDelete(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* MODAL DE ALERTA PERSONALIZADO */}
      {alertData && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/30 dark:bg-black/70 backdrop-blur-md transition-all animate-fade-in">
          <div className="w-full max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-3xl border border-white/80 dark:border-gray-700/60 p-6 shadow-2xl space-y-4 text-center">
            <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border shadow-sm ${
              alertData.type === "error" ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400" :
              alertData.type === "warning" ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400" :
              "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400"
            }`}>
              {alertData.type === "success" ? <CheckCircleIcon className="w-7 h-7" /> : <ExclamationTriangleIcon className="w-7 h-7" />}
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">{alertData.title}</h3>
              <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed">{alertData.message}</p>
            </div>
            <div className="pt-2">
              <button onClick={() => setAlertData(null)} className="w-full py-3 rounded-xl font-bold text-sm text-white bg-blue-600/90 hover:bg-blue-600 shadow-md shadow-blue-500/20 backdrop-blur-sm transition-all">
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {confirmDelete && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/80 backdrop-blur-md transition-all animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl border border-red-200 dark:border-red-900/50 p-6 shadow-2xl space-y-5 text-center">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
              <TrashIcon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white">¿Eliminar registro?</h3>
              <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed">
                Estás a punto de eliminar <strong>{confirmDelete.name}</strong>. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-4">
              <button onClick={() => setConfirmDelete(null)} className="py-3 rounded-xl font-bold text-sm text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                Cancelar
              </button>
              <button onClick={executeDelete} className="py-3 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-500/20 transition-all active:scale-[0.98]">
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Encabezado */}
      <div className="p-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] border border-white/60 dark:border-gray-700/50 transition-all">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white sm:text-3xl drop-shadow-sm">
          Configuración del Sistema ⚙️
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Administra, edita o elimina las categorías y ubicaciones de tu inventario.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PANEL DE CATEGORÍAS */}
        <div className="flex flex-col gap-6">
          {/* Crear Categoría */}
          <div className="p-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-gray-700/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] transition-all">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Nueva Categoría</h2>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                  Nombre (Ej. Periféricos, Monitores) *
                </label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                  Descripción (Opcional)
                </label>
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Ej. Teclados, mouses, audífonos..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl font-bold text-white bg-blue-600/90 hover:bg-blue-600 shadow-lg shadow-blue-500/30 backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-[0.98]">
                Guardar Categoría
              </button>
            </form>
          </div>

          {/* Lista de Categorías con Acciones */}
          <div className="p-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-gray-700/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] transition-all flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Categorías Registradas</h3>
            <ul className="space-y-2">
              {loading ? (
                <li className="text-sm text-gray-500 text-center py-4">Cargando...</li>
              ) : categories.length > 0 ? (
                categories.map((cat) => (
                  <li key={cat.id} className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-white/40 dark:border-gray-600/40 flex justify-between items-center transition-all hover:bg-white/60 dark:hover:bg-gray-700/50">
                    <div>
                      <span className="font-semibold text-gray-800 dark:text-gray-200 block">{cat.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block">{cat.description || "Sin descripción"}</span>
                    </div>
                    <div className="flex space-x-1 shrink-0">
                      <button
                        onClick={() => setEditingCategory(cat)}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/40 transition-colors"
                        title="Editar"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ id: cat.id, name: cat.name, type: "category" })}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors"
                        title="Eliminar"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-sm text-gray-500 text-center py-4">No hay categorías. Crea la primera arriba.</li>
              )}
            </ul>
          </div>
        </div>

        {/* PANEL DE UBICACIONES */}
        <div className="flex flex-col gap-6">
          {/* Crear Ubicación */}
          <div className="p-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-gray-700/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] transition-all">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Nueva Ubicación</h2>
            <form onSubmit={handleCreateLocation} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                  Nombre (Ej. Bodega Central, Oficina Sur) *
                </label>
                <input
                  type="text"
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                  Dirección o Detalle (Opcional)
                </label>
                <input
                  type="text"
                  value={newLocAddress}
                  onChange={(e) => setNewLocAddress(e.target.value)}
                  placeholder="Ej. Piso 4, Sector A..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl font-bold text-white bg-purple-600/90 hover:bg-purple-600 shadow-lg shadow-purple-500/30 backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-[0.98]">
                Guardar Ubicación
              </button>
            </form>
          </div>

          {/* Lista de Ubicaciones con Acciones */}
          <div className="p-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-gray-700/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] transition-all flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Ubicaciones Registradas</h3>
            <ul className="space-y-2">
              {loading ? (
                <li className="text-sm text-gray-500 text-center py-4">Cargando...</li>
              ) : locations.length > 0 ? (
                locations.map((loc) => (
                  <li key={loc.id} className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-white/40 dark:border-gray-600/40 flex justify-between items-center transition-all hover:bg-white/60 dark:hover:bg-gray-700/50">
                    <div>
                      <span className="font-semibold text-gray-800 dark:text-gray-200 block">{loc.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block">{loc.address || "Sin dirección"}</span>
                    </div>
                    <div className="flex space-x-1 shrink-0">
                      <button
                        onClick={() => setEditingLocation(loc)}
                        className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-900/40 transition-colors"
                        title="Editar"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ id: loc.id, name: loc.name, type: "location" })}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors"
                        title="Eliminar"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-sm text-gray-500 text-center py-4">No hay ubicaciones. Crea la primera arriba.</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* MODAL EDICIÓN CATEGORÍA */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 dark:bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-3xl border border-white/80 dark:border-gray-700/60 p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Editar Categoría</h3>
            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">Descripción</label>
                <input
                  type="text"
                  value={editingCategory.description || ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-200/80 dark:bg-gray-800/80 hover:bg-gray-300 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600/90 hover:bg-blue-600 shadow-md"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDICIÓN UBICACIÓN */}
      {editingLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 dark:bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-3xl border border-white/80 dark:border-gray-700/60 p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Editar Ubicación</h3>
            <form onSubmit={handleUpdateLocation} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={editingLocation.name}
                  onChange={(e) => setEditingLocation({ ...editingLocation, name: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">Dirección / Detalle</label>
                <input
                  type="text"
                  value={editingLocation.address || ""}
                  onChange={(e) => setEditingLocation({ ...editingLocation, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingLocation(null)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-200/80 dark:bg-gray-800/80 hover:bg-gray-300 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-purple-600/90 hover:bg-purple-600 shadow-md"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Iconos SVG
function PencilIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  );
}

function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}

function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ExclamationTriangleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2.25m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}