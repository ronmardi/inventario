import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function ConfiguracionPage() {
  const supabase = await createClient();

  // 1. Verificación de sesión y permisos
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("client_id")
    .eq("id", user.id)
    .single();

  if (!profile?.client_id) redirect("/login");

  // 2. Obtener datos actuales
  const [{ data: categories }, { data: locations }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("locations").select("*").order("name"),
  ]);

  // 3. Server Action: Agregar Categoría
  async function agregarCategoria(formData: FormData) {
    "use server";
    const supabaseServer = await createClient();
    
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (!name) return;

    await supabaseServer.from("categories").insert({
      client_id: profile!.client_id, // Usamos el ID de la empresa del usuario
      name,
      description,
    });

    // Actualizamos esta vista y la vista de "Nuevo Activo"
    revalidatePath("/dashboard/configuracion");
    revalidatePath("/dashboard/activos/nuevo");
  }

  // 4. Server Action: Agregar Ubicación
  async function agregarUbicacion(formData: FormData) {
    "use server";
    const supabaseServer = await createClient();
    
    const name = formData.get("name") as string;
    const address = formData.get("address") as string;

    if (!name) return;

    await supabaseServer.from("locations").insert({
      client_id: profile!.client_id,
      name,
      address,
    });

    revalidatePath("/dashboard/configuracion");
    revalidatePath("/dashboard/activos/nuevo");
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Encabezado */}
      <div className="p-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] border border-white/60 dark:border-gray-700/50 transition-all">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white sm:text-3xl drop-shadow-sm">
          Configuración del Sistema ⚙️
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Administra los catálogos base de tu inventario. Los cambios se reflejarán en todos los formularios.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PANEL DE CATEGORÍAS */}
        <div className="flex flex-col gap-6">
          <div className="p-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-gray-700/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] transition-all">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Nueva Categoría</h2>
            <form action={agregarCategoria} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                  Nombre (Ej. Periféricos, Monitores) *
                </label>
                <input
                  type="text"
                  name="name"
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
                  name="description"
                  placeholder="Ej. Teclados, mouses, audífonos..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl font-bold text-white bg-blue-600/90 hover:bg-blue-600 shadow-lg shadow-blue-500/30 backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-[0.98]">
                Guardar Categoría
              </button>
            </form>
          </div>

          {/* Lista de Categorías */}
          <div className="p-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-gray-700/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] transition-all flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Categorías Registradas</h3>
            <ul className="space-y-2">
              {categories && categories.length > 0 ? (
                categories.map((cat) => (
                  <li key={cat.id} className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-white/40 dark:border-gray-600/40 flex justify-between items-center">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{cat.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{cat.description || "Sin descripción"}</span>
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
          <div className="p-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-gray-700/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] transition-all">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Nueva Ubicación</h2>
            <form action={agregarUbicacion} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                  Nombre (Ej. Bodega Central, Oficina Sur) *
                </label>
                <input
                  type="text"
                  name="name"
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
                  name="address"
                  placeholder="Ej. Piso 4, Sector A..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl font-bold text-white bg-purple-600/90 hover:bg-purple-600 shadow-lg shadow-purple-500/30 backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-[0.98]">
                Guardar Ubicación
              </button>
            </form>
          </div>

          {/* Lista de Ubicaciones */}
          <div className="p-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-gray-700/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] transition-all flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Ubicaciones Registradas</h3>
            <ul className="space-y-2">
              {locations && locations.length > 0 ? (
                locations.map((loc) => (
                  <li key={loc.id} className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-white/40 dark:border-gray-600/40 flex justify-between items-center">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{loc.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{loc.address || "Sin dirección"}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-gray-500 text-center py-4">No hay ubicaciones. Crea la primera arriba.</li>
              )}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}