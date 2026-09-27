import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import QRSection from "./qr-section";

export default async function DetalleActivoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id || id === "undefined") {
    redirect("/dashboard/activos");
  }

  const supabase = await createClient();

  // 1. Verificar sesión
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Obtener el nombre de la empresa
  let companyName = "INVENTARIO TI";
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("client_id")
    .eq("id", user.id)
    .maybeSingle();

  if (userProfile?.client_id) {
    const { data: clientData } = await supabase
      .from("clients")
      .select("company_name")
      .eq("id", userProfile.client_id)
      .maybeSingle();

    if (clientData?.company_name) {
      companyName = clientData.company_name;
    }
  }

  // 3. Cargar datos del activo
  const { data: asset, error: assetError } = await supabase
    .from("assets")
    .select(`
      id,
      asset_tag,
      serial_number,
      name,
      model,
      status,
      purchase_date,
      notes,
      created_at,
      categories ( name ),
      locations ( name )
    `)
    .eq("id", id)
    .maybeSingle();

  if (assetError || !asset) {
    console.error("Error cargando activo:", assetError);
    redirect("/dashboard/activos");
  }

  // 4. Cargar mantenimientos
  const { data: maintenanceLogs } = await supabase
    .from("maintenance_logs")
    .select("id, issue_description, cost, started_at, completed_at")
    .eq("asset_id", id)
    .order("started_at", { ascending: false });

  // 5. Cargar asignaciones
  const { data: assignments } = await supabase
    .from("asset_assignments")
    .select(`
      id,
      assigned_at,
      returned_at,
      notes,
      profiles ( full_name, email )
    `)
    .eq("asset_id", id)
    .order("assigned_at", { ascending: false });

  const categoryName = Array.isArray(asset.categories)
    ? asset.categories[0]?.name
    : (asset.categories as unknown as { name?: string })?.name;

  const locationName = Array.isArray(asset.locations)
    ? asset.locations[0]?.name
    : (asset.locations as unknown as { name?: string })?.name;

  const statusStyles: Record<string, { label: string; class: string }> = {
    disponible: {
      label: "Disponible",
      class: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30",
    },
    asignado: {
      label: "Asignado",
      class: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30",
    },
    en_reparacion: {
      label: "En Reparación",
      class: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30",
    },
    baja: {
      label: "Dado de Baja",
      class: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30",
    },
  };

  const statusInfo = statusStyles[asset.status] || {
    label: asset.status,
    class: "bg-gray-500/10 text-gray-500 border-gray-500/30",
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Estilos de impresión */}
      <style>{`
        @media print {
          aside, header, nav, .pointer-events-none {
            display: none !important;
          }
          body, main {
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }
        }
      `}</style>

      {/* Encabezado */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-gray-700/50 shadow-sm transition-all">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/activos"
            className="p-2.5 rounded-xl bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 transition-all"
            title="Volver a Activos"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white sm:text-3xl">
                {asset.name}
              </h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm ${statusInfo.class}`}>
                {statusInfo.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Etiqueta ID: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{asset.asset_tag}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/dashboard/activos/${asset.id}/editar`}
            className="inline-flex items-center px-4 py-2.5 rounded-xl font-bold text-sm text-gray-700 dark:text-gray-200 bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-all shadow-sm"
          >
            <PencilIcon className="w-4 h-4 mr-2" />
            Editar
          </Link>
          
          <Link
            href={`/dashboard/activos/${asset.id}/asignar`}
            className={`inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02] active:scale-[0.98] ${
              asset.status === "asignado"
                ? "bg-purple-600/90 hover:bg-purple-600 shadow-md shadow-purple-500/20"
                : "bg-green-600/90 hover:bg-green-600 shadow-md shadow-green-500/20"
            }`}
          >
            {asset.status === "asignado" ? "Devolver Equipo 🔄" : "Asignar Equipo 📋"}
          </Link>
        </div>
      </div>

      {/* Grid QR + Ficha Técnica */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <QRSection
          assetTag={asset.asset_tag}
          assetName={asset.name}
          serialNumber={asset.serial_number}
          companyName={companyName}
        />

        <div className="lg:col-span-2 p-8 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-gray-700/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] space-y-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200/50 dark:border-gray-700/50 pb-3">
            Ficha Técnica del Equipo
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Marca / Modelo</p>
              <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">{asset.model || "No especificado"}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Número de Serie (S/N)</p>
              <p className="mt-1 text-base font-mono font-semibold text-gray-900 dark:text-white">{asset.serial_number || "Sin número de serie"}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categoría</p>
              <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">{categoryName || "Sin Categoría"}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ubicación Asignada</p>
              <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">{locationName || "Sin Ubicación"}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha de Compra</p>
              <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                {asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString("es-CL") : "No registrada"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha de Registro</p>
              <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                {new Date(asset.created_at).toLocaleDateString("es-CL")}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Observaciones / Garantía</p>
            <div className="p-4 rounded-2xl bg-white/50 dark:bg-gray-800/50 border border-white/40 dark:border-gray-600/40 text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
              {asset.notes || "Sin observaciones adicionales."}
            </div>
          </div>
        </div>
      </div>

      {/* Historial de Asignaciones */}
      <div className="print:hidden p-8 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-gray-700/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)]">
        <div className="flex items-center justify-between border-b border-gray-200/50 dark:border-gray-700/50 pb-4 mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
            <UserIcon className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
            Historial de Asignaciones
          </h2>
          <Link
            href={`/dashboard/activos/${asset.id}/asignar`}
            className="px-4 py-2 rounded-xl text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-100/50 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-colors border border-purple-200 dark:border-purple-800"
          >
            + Nueva Asignación
          </Link>
        </div>

        <div className="overflow-x-auto custom-scrollbar pb-2">
          <table className="w-full text-left border-collapse text-sm min-w-max">
            <thead>
              <tr className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200/50 dark:border-gray-700/50">
                <th className="py-3 px-4 font-bold">Asignado a</th>
                <th className="py-3 px-4 font-bold">Fecha Asignación</th>
                <th className="py-3 px-4 font-bold">Estado / Devolución</th>
                <th className="py-3 px-4 font-bold text-right">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/40 dark:divide-gray-800/40">
              {assignments && assignments.length > 0 ? (
                assignments.map((item) => {
                  const isReturned = !!item.returned_at;
                  const profileData = Array.isArray(item.profiles)
                    ? item.profiles[0]
                    : item.profiles;
                  const userName = profileData?.full_name || profileData?.email || "Usuario no especificado";

                  return (
                    <tr key={item.id} className="hover:bg-white/40 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="py-4 px-4 font-semibold text-gray-900 dark:text-white">{userName}</td>
                      <td className="py-4 px-4 font-mono text-gray-700 dark:text-gray-300">
                        {new Date(item.assigned_at).toLocaleDateString("es-CL")}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border backdrop-blur-sm ${
                          isReturned
                            ? "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30"
                            : "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 animate-pulse"
                        }`}>
                          {isReturned ? `Devuelto: ${new Date(item.returned_at!).toLocaleDateString("es-CL")}` : "Actualmente Asignado"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right text-xs text-gray-500 dark:text-gray-400">{item.notes || "—"}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500 dark:text-gray-400 font-medium bg-gray-50/30 dark:bg-gray-800/20 rounded-xl">
                    No hay registro de asignaciones previas para este equipo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bitácora de Mantenimiento */}
      <div className="print:hidden p-8 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-gray-700/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)]">
        <div className="flex items-center justify-between border-b border-gray-200/50 dark:border-gray-700/50 pb-4 mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
            <ToolIcon className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            Bitácora de Mantenimiento
          </h2>
          <Link
            href={`/dashboard/activos/${asset.id}/mantenimiento`}
            className="px-4 py-2 rounded-xl text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-100/50 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors border border-blue-200 dark:border-blue-800"
          >
            + Registrar Incidencia
          </Link>
        </div>

        <div className="overflow-x-auto custom-scrollbar pb-2">
          <table className="w-full text-left border-collapse text-sm min-w-max">
            <thead>
              <tr className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200/50 dark:border-gray-700/50">
                <th className="py-3 px-4 font-bold">Fecha / Estado</th>
                <th className="py-3 px-4 font-bold">Descripción del Trabajo</th>
                <th className="py-3 px-4 font-bold text-right">Costo Estimado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/40 dark:divide-gray-800/40">
              {maintenanceLogs && maintenanceLogs.length > 0 ? (
                maintenanceLogs.map((log) => {
                  const isCompleted = !!log.completed_at;
                  const badgeClass = isCompleted 
                    ? "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30" 
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 animate-pulse";
                  const badgeText = isCompleted ? "Completado" : "En Proceso / Registrado";

                  return (
                    <tr key={log.id} className="hover:bg-white/40 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="py-4 px-4 align-top">
                        <div className="font-mono text-gray-900 dark:text-gray-200 font-medium">
                          {new Date(log.started_at).toLocaleDateString("es-CL")}
                        </div>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border backdrop-blur-sm ${badgeClass}`}>
                            {badgeText}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {log.issue_description}
                        </p>
                      </td>
                      <td className="py-4 px-4 text-right align-top">
                        <span className="font-bold text-gray-900 dark:text-white">
                          {log.cost != null && log.cost > 0 
                            ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(log.cost) 
                            : "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-500 dark:text-gray-400 font-medium bg-gray-50/30 dark:bg-gray-800/20 rounded-xl">
                    No hay mantenimientos ni incidencias registradas para este equipo.
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

function ArrowLeftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  );
}

function PencilIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  );
}

function ToolIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.83M11.42 15.17l-4.95-4.95a1.875 1.875 0 010-2.652L8.5 5.5m2.92 9.67L9.5 17.5M8.5 5.5l1.65-1.65a1.875 1.875 0 012.652 0L15.17 6.22m-6.67-.72L6.13 7.87a1.875 1.875 0 000 2.652l4.95 4.95m-9.58 6.08l4.41-4.41" />
    </svg>
  );
}

function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}