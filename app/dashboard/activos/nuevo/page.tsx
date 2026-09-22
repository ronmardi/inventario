import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function NuevoActivoPage() {
  const supabase = await createClient();

  // 1. Verificar sesión de usuario
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Obtener el perfil del usuario para obtener su client_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("client_id")
    .eq("id", user.id)
    .single();

  if (!profile?.client_id) {
    redirect("/login");
  }

  // 3. Cargar Categorías y Ubicaciones asociadas a la empresa
  const [{ data: categories }, { data: locations }] = await Promise.all([
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("locations").select("id, name").order("name"),
  ]);

  // Generar un código/etiqueta aleatorio de activo por defecto (ejemplo: EQ-4829)
  const defaultTag = `EQ-${Math.floor(1000 + Math.random() * 9000)}`;

  // Server Action para procesar el formulario
  async function crearActivo(formData: FormData) {
    "use server";

    const supabaseServer = await createClient();
    const {
      data: { user: currentUser },
    } = await supabaseServer.auth.getUser();

    if (!currentUser) return;

    const { data: userProfile } = await supabaseServer
      .from("profiles")
      .select("client_id")
      .eq("id", currentUser.id)
      .single();

    if (!userProfile?.client_id) return;

    const asset_tag = formData.get("asset_tag") as string;
    const name = formData.get("name") as string;
    const model = formData.get("model") as string;
    const serial_number = formData.get("serial_number") as string;
    const category_id = formData.get("category_id") as string || null;
    const location_id = formData.get("location_id") as string || null;
    const status = formData.get("status") as string || "disponible";
    const purchase_date = formData.get("purchase_date") as string || null;
    const notes = formData.get("notes") as string || null;

    const { error } = await supabaseServer.from("assets").insert({
      client_id: userProfile.client_id,
      asset_tag,
      name,
      model,
      serial_number,
      category_id: category_id || null,
      location_id: location_id || null,
      status,
      purchase_date: purchase_date || null,
      notes,
    });

    if (error) {
      console.error("Error al crear activo:", error);
      return;
    }

    redirect("/dashboard/activos");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Encabezado Principal */}
      <div className="flex items-center justify-between p-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] border border-white/60 dark:border-gray-700/50 transition-all">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white sm:text-3xl drop-shadow-sm">
            Registrar Nuevo Activo 📦
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Ingresa los datos del equipo informático para añadirlo al inventario de la empresa.
          </p>
        </div>
        <Link
          href="/dashboard/activos"
          className="inline-flex items-center px-4 py-2.5 rounded-xl font-bold text-sm text-gray-700 dark:text-gray-200 bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 backdrop-blur-sm transition-all"
        >
          Volver
        </Link>
      </div>

      {/* Formulario Liquid Glass */}
      <div className="p-8 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-gray-700/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-all">
        <form action={crearActivo} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Etiqueta ID (Generada automáticame/Editable) */}
            <div>
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                Etiqueta ID / Código QR <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="asset_tag"
                defaultValue={defaultTag}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 font-mono font-bold text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm transition-all"
                placeholder="Ej. EQ-0001"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Código único impreso en la etiqueta del equipo.
              </p>
            </div>

            {/* Nombre del Activo */}
            <div>
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                Nombre del Equipo / Nombre corto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="Ej. MacBook Pro 16 M3"
                className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm transition-all"
              />
            </div>

            {/* Modelo */}
            <div>
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                Modelo / Marca
              </label>
              <input
                type="text"
                name="model"
                placeholder="Ej. Apple / A2992"
                className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm transition-all"
              />
            </div>

            {/* Número de Serie */}
            <div>
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                Número de Serie (S/N)
              </label>
              <input
                type="text"
                name="serial_number"
                placeholder="Ej. C02G8192MD6R"
                className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white font-mono placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm transition-all"
              />
            </div>

            {/* Selector de Categoría */}
            <div>
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                Categoría
              </label>
              <select
                name="category_id"
                className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm transition-all"
              >
                <option value="">Seleccionar Categoría...</option>
                {categories && categories.length > 0 ? (
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No hay categorías registradas
                  </option>
                )}
              </select>
            </div>

            {/* Selector de Ubicación */}
            <div>
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                Ubicación Física
              </label>
              <select
                name="location_id"
                className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm transition-all"
              >
                <option value="">Seleccionar Ubicación...</option>
                {locations && locations.length > 0 ? (
                  locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No hay ubicaciones registradas
                  </option>
                )}
              </select>
            </div>

            {/* Estado Inicial */}
            <div>
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                Estado Inicial
              </label>
              <select
                name="status"
                defaultValue="disponible"
                className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm transition-all"
              >
                <option value="disponible">Disponible</option>
                <option value="asignado">Asignado</option>
                <option value="en_reparacion">En Reparación</option>
                <option value="baja">Dado de Baja</option>
              </select>
            </div>

            {/* Fecha de Compra */}
            <div>
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                Fecha de Compra
              </label>
              <input
                type="date"
                name="purchase_date"
                className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm transition-all"
              />
            </div>
          </div>

          {/* Notas Adicionales */}
          <div>
            <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
              Observaciones / Notas
            </label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Detalles sobre garantía, accesorios incluidos o condiciones de entrega..."
              className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm transition-all"
            />
          </div>

          {/* Botones de Acción */}
          <div className="pt-4 flex justify-end space-x-4">
            <Link
              href="/dashboard/activos"
              className="px-6 py-3 rounded-xl font-bold text-sm text-gray-700 dark:text-gray-300 bg-gray-200/60 dark:bg-gray-800/60 hover:bg-gray-300 dark:hover:bg-gray-700 transition-all"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              className="px-8 py-3 rounded-xl font-bold text-sm text-white bg-blue-600/90 hover:bg-blue-600 shadow-lg shadow-blue-500/30 backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Guardar Activo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}