"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface AssetResult {
  id: string;
  asset_tag: string;
  serial_number: string | null;
  name: string;
  model: string | null;
  status: string;
  notes: string | null;
  categories: { name: string } | { name: string }[] | null;
  locations: { name: string } | { name: string }[] | null;
}

export default function EscanerPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isScanning, setIsScanning] = useState(true);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [loadingAsset, setLoadingAsset] = useState(false);
  const [foundAsset, setFoundAsset] = useState<AssetResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Función para consultar el equipo en Supabase por código o número de serie
  const lookupAsset = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    setLoadingAsset(true);
    setError(null);
    setFoundAsset(null);

    const { data, error: dbError } = await supabase
      .from("assets")
      .select(`
        id,
        asset_tag,
        serial_number,
        name,
        model,
        status,
        notes,
        categories ( name ),
        locations ( name )
      `)
      .or(`asset_tag.eq.${trimmed},serial_number.eq.${trimmed}`)
      .maybeSingle();

    if (dbError) {
      console.error("Error al buscar activo:", dbError);
      setError("Ocurrió un problema al consultar la base de datos.");
    } else if (!data) {
      setError(`No se encontró ningún equipo con el código o serie "${trimmed}".`);
    } else {
      setFoundAsset(data as unknown as AssetResult);
    }

    setLoadingAsset(false);
  };

  // Inicialización de la cámara y el lector automático
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let scanInterval: NodeJS.Timeout | null = null;

    async function startCamera() {
      if (!isScanning) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        activeStream = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Detección automática con BarcodeDetector si el navegador lo soporta
        if ("BarcodeDetector" in window) {
          // @ts-ignore
          const barcodeDetector = new window.BarcodeDetector({
            formats: ["qr_code", "code_128", "code_39", "ean_13", "data_matrix"],
          });

          scanInterval = setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState === 4) {
              try {
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes.length > 0) {
                  const detected = barcodes[0].rawValue;
                  setScannedCode(detected);
                  setIsScanning(false);
                  lookupAsset(detected);
                }
              } catch (e) {
                // Continuar intentando fotograma a fotograma
              }
            }
          }, 400);
        }
      } catch (err) {
        setError("No se pudo iniciar la cámara. Verifica los permisos del navegador o usa la búsqueda manual.");
        setIsScanning(false);
      }
    }

    startCamera();

    return () => {
      if (scanInterval) clearInterval(scanInterval);
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isScanning]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    setIsScanning(false);
    setScannedCode(manualCode);
    lookupAsset(manualCode);
  };

  const resetScanner = () => {
    setFoundAsset(null);
    setError(null);
    setScannedCode(null);
    setManualCode("");
    setIsScanning(true);
  };

  // Mapeo de estilos para badges
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Encabezado Principal */}
      <div className="flex items-center justify-between p-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-gray-700/50 shadow-sm transition-all">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white sm:text-3xl">
            Escáner y Auditoría 📷
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Escanea el código QR o código de barras de cualquier activo para consultar su estado al instante.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="px-4 py-2.5 rounded-xl font-bold text-sm text-gray-700 dark:text-gray-200 bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 backdrop-blur-sm transition-all"
        >
          Volver
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PANEL IZQUIERDO: Visor de Cámara y Búsqueda Manual */}
        <div className="space-y-6">
          
          {/* Contenedor del Visor */}
          <div className="relative p-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-gray-700/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] overflow-hidden text-center">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Cámara en Vivo
            </h2>

            {isScanning ? (
              <div className="relative w-full h-72 bg-gray-950 rounded-2xl overflow-hidden border border-gray-800 shadow-inner flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                
                {/* Cuadro de enfoque táctico */}
                <div className="absolute inset-0 border-2 border-blue-500/40 rounded-2xl pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-dashed border-blue-400 rounded-xl animate-pulse bg-blue-500/5" />
                </div>
              </div>
            ) : (
              <div className="w-full h-72 bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center p-6 space-y-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {scannedCode ? `Código capturado: ${scannedCode}` : "El visor de cámara está pausado."}
                </p>
                <button
                  onClick={resetScanner}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-blue-600/90 hover:bg-blue-600 shadow-md shadow-blue-500/20 backdrop-blur-sm transition-all"
                >
                  Activar Cámara Nuevamente
                </button>
              </div>
            )}
          </div>

          {/* Buscador Manual de Respaldo */}
          <div className="p-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-gray-700/50 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">
              ¿Problemas con la cámara? Ingresa el código manualmente:
            </h3>
            <form onSubmit={handleManualSearch} className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ej. EQ-6092 o C02G8192MD6R"
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 transition-all"
              >
                Buscar
              </button>
            </form>
          </div>

        </div>

        {/* PANEL DERECHO: Tarjeta de Resultado en Cristal */}
        <div className="p-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-gray-700/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200/50 dark:border-gray-700/50 pb-3 mb-4">
              Resultado de Auditoría
            </h2>

            {loadingAsset && (
              <div className="py-16 text-center space-y-3">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Buscando datos del equipo en Supabase...
                </p>
              </div>
            )}

            {error && !loadingAsset && (
              <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl text-center space-y-3">
                <p className="text-sm font-bold text-red-700 dark:text-red-300">{error}</p>
                <button
                  onClick={resetScanner}
                  className="px-4 py-2 text-xs font-bold text-red-700 dark:text-red-300 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-all"
                >
                  Intentar con otro código
                </button>
              </div>
            )}

            {!loadingAsset && !error && !foundAsset && (
              <div className="py-16 text-center space-y-2 text-gray-500 dark:text-gray-400">
                <ScanIllustration className="w-16 h-16 mx-auto text-gray-400 opacity-60" />
                <p className="text-sm font-medium">Apunta al código QR con la cámara o ingresa el código manual para inspeccionar el activo.</p>
              </div>
            )}

            {foundAsset && !loadingAsset && (
              <div className="space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                      {foundAsset.asset_tag}
                    </span>
                    <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mt-1">
                      {foundAsset.name}
                    </h3>
                  </div>
                  {statusStyles[foundAsset.status] && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm ${statusStyles[foundAsset.status].class}`}>
                      {statusStyles[foundAsset.status].label}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm bg-white/50 dark:bg-gray-800/50 p-4 rounded-2xl border border-white/40 dark:border-gray-700/40">
                  <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Marca / Modelo</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                      {foundAsset.model || "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Número de Serie</p>
                    <p className="font-mono font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                      {foundAsset.serial_number || "Sin S/N"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Categoría</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                      {Array.isArray(foundAsset.categories)
                        ? foundAsset.categories[0]?.name
                        : (foundAsset.categories as unknown as { name?: string })?.name || "Sin Categoría"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Ubicación</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                      {Array.isArray(foundAsset.locations)
                        ? foundAsset.locations[0]?.name
                        : (foundAsset.locations as unknown as { name?: string })?.name || "Sin Ubicación"}
                    </p>
                  </div>
                </div>

                {foundAsset.notes && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Notas</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300 p-3 bg-white/40 dark:bg-gray-800/40 rounded-xl border border-white/40 dark:border-gray-700/40">
                      {foundAsset.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {foundAsset && (
            <div className="pt-6 border-t border-gray-200/50 dark:border-gray-700/50 flex flex-col sm:flex-row gap-3">
              <Link
                href={`/dashboard/activos/${foundAsset.id}`}
                className="flex-1 py-3 px-4 text-center rounded-xl font-bold text-sm text-white bg-blue-600/90 hover:bg-blue-600 shadow-md transition-all"
              >
                Ver Ficha Completa
              </Link>
              <button
                onClick={resetScanner}
                className="py-3 px-4 rounded-xl font-bold text-sm text-gray-700 dark:text-gray-200 bg-gray-200/60 dark:bg-gray-800/60 hover:bg-gray-300 dark:hover:bg-gray-700 transition-all"
              >
                Escanear Otro
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// SVG Ilustración
function ScanIllustration(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5zM16.5 16.5h.008v.008h-.008v-.008zM16.5 19.5h.008v.008h-.008v-.008zM19.5 16.5h.008v.008h-.008v-.008zM19.5 19.5h.008v.008h-.008v-.008zM13.5 16.5h.008v.008h-.008v-.008zM13.5 19.5h.008v.008h-.008v-.008z" />
    </svg>
  );
}