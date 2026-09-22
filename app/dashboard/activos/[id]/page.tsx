import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function DetalleActivoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Verificar sesión de usuario
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Consultar activo por ID asegurando pertenencia al cliente/tenant
  const { data: asset, error } = await supabase
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
      locations ( id, name, address )
    `
    )
    .eq("id", id)
    .single();

  if (error || !asset) {
    notFound();
  }

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

  // Estilos de estado
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
    <div className="max-w-5xl mx-auto space-y-6">
      
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
        <div className="flex items-center space-x-3">
          <PrintButton />
        </div>
      </div>

      {/* ETIOUETA IMPRIMIBLE (Solo visible o adaptada al imprimir) */}
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

      {/* CONTENIDO PRINCIPAL DE LA VISTA (Oculto al imprimir) */}
      <div className="print:hidden grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Tarjeta del QR e Imprimible */}
        <div className="p-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-gray-700/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] flex flex-col items-center text-center">
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

        {/* Columna Derecha: Especificaciones y Ficha Técnica */}
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
                Fecha de Registro en Sistema
              </p>
              <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                {new Date(asset.created_at).toLocaleDateString("es-CL")}
              </p>
            </div>
          </div>

          {/* Observaciones / Notas */}
          <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Observaciones / Garantía
            </p>
            <div className="p-4 rounded-2xl bg-white/50 dark:bg-gray-800/50 border border-white/40 dark:border-gray-600/40 text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
              {asset.notes || "Sin observaciones adicionales."}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Botón de Impresión de Cliente (Embedded)
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
      Imprimir Etiqueta QR
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