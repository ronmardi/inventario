"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, use } from "react";

// Agregamos la interfaz para la bitácora de mantenimiento
interface MaintenanceLog {
  id: string;
  issue_description: string;
  cost: number | null;
  started_at: string;
  completed_at?: string | null;
}

interface AssetDetail {
  id: string;
  asset_tag: string;
  serial_number: string | null;
  name: string;
  model: string | null;
  status: string;
  purchase_date: string | null;
  notes: string | null;
  created_at: string;
  categories: { id: string; name: string } | { id: string; name: string }[] | null;
  locations: { id: string; name: string; address: string | null } | { id: string; name: string; address: string | null }[] | null;
  maintenance_logs?: MaintenanceLog[]; // Añadimos la relación
}

export default function DetalleActivoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAsset() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // P3.19: Actualizamos la consulta para incluir los logs de mantenimiento
      const { data, error } = await supabase
        .from("assets")
        .select(
          `
          id,
          asset_tag,
          serial_number,
          name,
          model,
          status,
          purchase_date,
          notes,
          created_at,
          categories ( id, name ),
          locations ( id, name, address ),
          maintenance_logs ( id, issue_description, cost, started_at, completed_at )
        `
        )
        .eq("id", id)
        .single();

      if (error || !data) {
        router.push("/dashboard/activos");
      } else {
        // Ordenamos los mantenimientos del más reciente al más antiguo
        if (data.maintenance_logs && Array.isArray(data.maintenance_logs)) {
          data.maintenance_logs.sort((a, b) => 
            new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
          );
        }
        setAsset(data as unknown as AssetDetail);
      }
      setLoading(false);
    }
    loadAsset();
  }, [id, supabase, router]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!asset) return null;

  // Mapeo de nombres para categorías y ubicaciones
  const categoryName = Array.isArray(asset.categories)
    ? asset.categories[0]?.name
    : (asset.categories as unknown as { name?: string })?.name;

  const locationName = Array.isArray(asset.locations)
    ? asset.locations[0]?.name
    : (asset.locations as unknown as { name?: string })?.name;

  const locationAddress = Array.isArray(asset.locations)
    ? asset.locations[0]?.address
    : (asset.locations as unknown as { address?: string })?.address;

  // Estilos de estado para el equipo
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

  // URL generadora para el código QR con el Asset Tag
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    asset.asset_tag
  )}`;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      
      {/* Encabezado Ocultable al Imprimir */}
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

        {/* Acciones principales */}
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
          <PrintButton />
        </div>
      </div>

      {/* ETIQUETA IMPRIMIBLE */}
      <div className="hidden print:block print:p-8 print:bg-white text-black font-sans text-center max-w-xs mx-auto border-2 border-black rounded-xl p-4">
        <p className="font-extrabold text-lg uppercase tracking-wider">INVENTARIO TI</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrUrl} alt="Código QR" className="w-48 h-48 mx-auto my-2" />
        <p className="font-mono font-black text-2xl text-black">{asset.asset_tag}</p>
        <p className="text-xs font-bold text-gray-700 mt-1">{asset.name}</p>
        {asset.serial_number && (
          <p className="text-[10px] font-mono text-gray-500">S/N: {asset.serial_number}</p>
        )}
      </div>

      {/* CONTENIDO PRINCIPAL DE LA VISTA */}
      <div className="print:hidden grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Tarjeta del QR */}
        <div className="p-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-gray-700/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] flex flex-col items-center text-center h-fit">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Código QR de Activo
          </h2>
          
          <div className="p-4 bg-white rounded-2xl shadow-inner border border-gray-200/80 mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="Código QR" className="w-48 h-48 object-contain" />
          </div>

          <p className="font-mono font-black text-2xl text-blue-600 dark:text-blue-400 mb-1">
            {asset.asset_tag}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
            Escanea esta etiqueta para consultar auditoría o historial.
          </p>

          <PrintButton fullWidth />
        </div>

        {/* Columna Derecha: Especificaciones */}
        <div className="lg:col-span-2 p-8 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-gray-700/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] space-y-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200/50 dark:border-gray-700/50 pb-3">
            Ficha Técnica del Equipo
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Marca / Modelo
              </p>
              <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                {asset.model || "No especificado"}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Número de Serie (S/N)
              </p>
              <p className="mt-1 text-base font-mono font-semibold text-gray-900 dark:text-white">
                {asset.serial_number || "Sin número de serie"}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Categoría
              </p>
              <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                {categoryName || "Sin Categoría"}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ubicación Asignada
              </p>
              <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                {locationName || "Sin Ubicación"}
              </p>
              {locationAddress && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{locationAddress}</p>
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Fecha de Compra
              </p>
              <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                {asset.purchase_date
                  ? new Date(asset.purchase_date).toLocaleDateString("es-CL")
                  : "No registrada"}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Fecha de Registro
              </p>
              <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                {new Date(asset.created_at).toLocaleDateString("es-CL")}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Observaciones / Garantía
            </p>
            <div className="p-4 rounded-2xl bg-white/50 dark:bg-gray-800/50 border border-white/40 dark:border-gray-600/40 text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
              {asset.notes || "Sin observaciones adicionales."}
            </div>
          </div>
        </div>
      </div>

      {/* BITÁCORA DE MANTENIMIENTO (P3.19) */}
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
              {asset.maintenance_logs && asset.maintenance_logs.length > 0 ? (
                asset.maintenance_logs.map((log) => {
                  // Lógica visual del Badge
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

// Botón de Impresión de Cliente
function PrintButton({ fullWidth }: { fullWidth?: boolean }) {
  return (
    <button
      onClick={() => {
        if (typeof window !== "undefined") {
          window.print();
        }
      }}
      className={`inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-blue-600/90 hover:bg-blue-600 shadow-md shadow-blue-500/20 backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-[0.98] ${
        fullWidth ? "w-full" : ""
      }`}
    >
      <PrinterIcon className="w-5 h-5 mr-2" />
      Imprimir Etiqueta
    </button>
  );
}

// Iconos SVG
function ArrowLeftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  );
}

function PrinterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m11.318-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231a1.125 1.125 0 01-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-19.126 0C1.008 7.441.25 8.375.25 9.456v6.294A2.25 2.25 0 002.5 18h1.091" />
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