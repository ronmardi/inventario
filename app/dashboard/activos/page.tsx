import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ExportarButton from "./exportar-button";

export default async function ActivosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const supabase = await createClient();

  // 1. Verificar sesión de usuario
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { q: searchQuery, status: statusFilter } = await searchParams;

  // 2. Consulta a Supabase obteniendo activos con sus relaciones (categoría y ubicación)
  let query = supabase
    .from("assets")
    .select(
      `
      id,
      asset_tag,
      serial_number,
      name,
      model,
      status,
      created_at,
      categories ( name ),
      locations ( name )
    `
    )
    .order("created_at", { ascending: false });

  // Filtro de búsqueda por texto (nombre, etiqueta o número de serie)
  if (searchQuery) {
    query = query.or(
      `name.ilike.%${searchQuery}%,asset_tag.ilike.%${searchQuery}%,serial_number.ilike.%${searchQuery}%`
    );
  }

  // Filtro de estado
  if (statusFilter && statusFilter !== "todos") {
    query = query.eq("status", statusFilter);
  }

  const { data: assets, error } = await query;

  if (error) {
    console.error("Error cargando activos:", error);
  }

  // Mapeo de estilos para badges de estado
  const statusStyles: Record<string, { label: string; class: string }> = {
    disponible: {
      label: "Disponible",
      class:
        "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30",
    },
    asignado: {
      label: "Asignado",
      class:
        "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30",
    },
    en_reparacion: {
      label: "En Reparación",
      class:
        "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30",
    },
    baja: {
      label: "Dado de Baja",
      class:
        "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30",
    },
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] border border-white/60 dark:border-gray-700/50 transition-all">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white sm:text-3xl drop-shadow-sm">
            Inventario de Equipos 💻
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Gestiona los activos tecnológicos, asignaciones y estados de tu empresa.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ExportarButton />
          <Link
            href="/dashboard/activos/nuevo"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-blue-600/90 hover:bg-blue-600 shadow-md shadow-blue-500/20 backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Nuevo Activo
          </Link>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="p-4 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-gray-700/50 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <form method="GET" className="w-full md:w-auto flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              name="q"
              defaultValue={searchQuery || ""}
              placeholder="Buscar por equipo, código o serie..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm transition-all"
            />
          </div>
          <select
            name="status"
            defaultValue={statusFilter || "todos"}
            className="px-4 py-2.5 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          >
            <option value="todos">Todos los Estados</option>
            <option value="disponible">Disponibles</option>
            <option value="asignado">Asignados</option>
            <option value="en_reparacion">En Reparación</option>
            <option value="baja">Dado de Baja</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-gray-200/60 dark:bg-gray-700/60 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-semibold transition-all"
          >
            Filtrar
          </button>
        </form>
      </div>

      {/* Tabla de Activos (Liquid Glass Style) */}
      <div className="overflow-hidden bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-gray-700/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200/50 dark:border-gray-700/50 bg-white/30 dark:bg-gray-800/30 text-gray-700 dark:text-gray-300 font-bold uppercase tracking-wider text-xs">
                <th className="py-4 px-6">Etiqueta ID</th>
                <th className="py-4 px-6">Equipo / Modelo</th>
                <th className="py-4 px-6">Categoría</th>
                <th className="py-4 px-6">Ubicación</th>
                <th className="py-4 px-6">Estado</th>
                <th className="py-4 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/40 dark:divide-gray-800/40 text-gray-800 dark:text-gray-200">
              {assets && assets.length > 0 ? (
                assets.map((asset) => {
                  const statusInfo = statusStyles[asset.status] || {
                    label: asset.status,
                    class: "bg-gray-500/10 text-gray-500 border-gray-500/30",
                  };
                  const categoryName = Array.isArray(asset.categories)
                    ? asset.categories[0]?.name
                    : (asset.categories as unknown as { name?: string })?.name;
                  const locationName = Array.isArray(asset.locations)
                    ? asset.locations[0]?.name
                    : (asset.locations as unknown as { name?: string })?.name;

                  return (
                    <tr
                      key={asset.id}
                      className="hover:bg-white/40 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      <td className="py-4 px-6 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {asset.asset_tag}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-gray-900 dark:text-white">
                          {asset.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {asset.model || "Sin modelo"} {asset.serial_number ? `• S/N: ${asset.serial_number}` : ""}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600 dark:text-gray-300">
                        {categoryName || "General"}
                      </td>
                      <td className="py-4 px-6 text-gray-600 dark:text-gray-300">
                        {locationName || "Oficina Central"}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${statusInfo.class}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <Link
                          href={`/dashboard/activos/${asset.id}`}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 transition-all shadow-sm"
                        >
                          Ver Detalle
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-gray-500 dark:text-gray-400 font-medium"
                  >
                    No se encontraron activos registrados en el inventario.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Iconos SVG
function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  );
}