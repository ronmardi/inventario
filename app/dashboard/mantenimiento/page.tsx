"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

interface MaintenanceLog {
  id: string;
  issue_description: string;
  resolution_notes: string | null;
  cost: number | null;
  started_at: string;
  completed_at: string | null;
  assets: { id: string; name: string; asset_tag: string; status: string } | null;
  profiles: { full_name: string; email: string } | null;
}

interface AssetOption {
  id: string;
  name: string;
  asset_tag: string;
  status: string;
}

export default function MantenimientoPage() {
  const supabase = createClient();

  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Modales y formularios
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedLogForResolve, setSelectedLogForResolve] = useState<MaintenanceLog | null>(null);

  // Formulario Reportar
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulario Resolver
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [finalCost, setFinalCost] = useState("");
  const [returnToStatus, setReturnToStatus] = useState("disponible");

  const loadData = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("client_id")
      .eq("id", user.id)
      .single();

    if (!profile?.client_id) return;
    setClientId(profile.client_id);

    // Cargar historial de mantenimientos y lista de activos de la empresa
    const [{ data: logsData }, { data: assetsData }] = await Promise.all([
      supabase
        .from("maintenance_logs")
        .select(
          `
          id,
          issue_description,
          resolution_notes,
          cost,
          started_at,
          completed_at,
          assets ( id, name, asset_tag, status ),
          profiles:reported_by ( full_name, email )
        `
        )
        .order("started_at", { ascending: false }),
      supabase
        .from("assets")
        .select("id, name, asset_tag, status")
        .order("name"),
    ]);

    if (logsData) setLogs(logsData as unknown as MaintenanceLog[]);
    if (assetsData) setAssets(assetsData);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [supabase]);

  // Handler: Crear nuevo reporte de mantenimiento
  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !issueDescription || !clientId || !currentUserId) return;

    setIsSubmitting(true);

    const { error: logError } = await supabase.from("maintenance_logs").insert({
      client_id: clientId,
      asset_id: selectedAssetId,
      reported_by: currentUserId,
      issue_description: issueDescription,
      cost: estimatedCost ? parseFloat(estimatedCost) : null,
      started_at: new Date().toISOString(),
    });

    if (logError) {
      alert("Error al registrar reporte: " + logError.message);
      setIsSubmitting(false);
      return;
    }

    await supabase
      .from("assets")
      .update({ status: "en_reparacion", updated_at: new Date().toISOString() })
      .eq("id", selectedAssetId);

    setSelectedAssetId("");
    setIssueDescription("");
    setEstimatedCost("");
    setIsReportModalOpen(false);
    setIsSubmitting(false);
    loadData();
  };

  // Handler: Resolver / Finalizar mantenimiento
  const handleResolveMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLogForResolve || !selectedLogForResolve.assets) return;

    setIsSubmitting(true);

    const { error: logError } = await supabase
      .from("maintenance_logs")
      .update({
        resolution_notes: resolutionNotes,
        cost: finalCost ? parseFloat(finalCost) : selectedLogForResolve.cost,
        completed_at: new Date().toISOString(),
      })
      .eq("id", selectedLogForResolve.id);

    if (logError) {
      alert("Error al resolver mantenimiento: " + logError.message);
      setIsSubmitting(false);
      return;
    }

    await supabase
      .from("assets")
      .update({ status: returnToStatus, updated_at: new Date().toISOString() })
      .eq("id", selectedLogForResolve.assets.id);

    setSelectedLogForResolve(null);
    setResolutionNotes("");
    setFinalCost("");
    setIsSubmitting(false);
    loadData();
  };

  const activeLogs = logs.filter((l) => !l.completed_at);
  const completedLogs = logs.filter((l) => l.completed_at);
  const totalCost = logs.reduce((acc, log) => acc + (log.cost || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-gray-700/50 shadow-sm transition-all">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white sm:text-3xl">
            Mantenimiento y Reparaciones 🛠️
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Control de incidencias técnicas, costos de reparación y servicio técnico.
          </p>
        </div>
        <button
          onClick={() => setIsReportModalOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-orange-600/90 hover:bg-orange-600 shadow-md shadow-orange-500/20 backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Reportar Falla
        </button>
      </div>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-gray-700/50 p-5 flex items-center shadow-sm">
          <div className="p-3 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
            <WrenchIcon className="w-7 h-7" />
          </div>
          <div className="ml-5">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              En Reparación
            </p>
            <p className="mt-1 text-3xl font-black text-gray-900 dark:text-white">
              {activeLogs.length}
            </p>
          </div>
        </div>

        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-gray-700/50 p-5 flex items-center shadow-sm">
          <div className="p-3 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
            <CheckCircleIcon className="w-7 h-7" />
          </div>
          <div className="ml-5">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Resueltos
            </p>
            <p className="mt-1 text-3xl font-black text-gray-900 dark:text-white">
              {completedLogs.length}
            </p>
          </div>
        </div>

        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-gray-700/50 p-5 flex items-center shadow-sm">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <CurrencyDollarIcon className="w-7 h-7" />
          </div>
          <div className="ml-5">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Costo Acumulado
            </p>
            <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white">
              ${totalCost.toLocaleString("es-CL")}
            </p>
          </div>
        </div>
      </div>

      {/* Tabla de Logs de Mantenimiento */}
      <div className="overflow-hidden bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-gray-700/50 shadow-sm transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200/50 dark:border-gray-700/50 bg-white/30 dark:bg-gray-800/30 text-gray-700 dark:text-gray-300 font-bold uppercase tracking-wider text-xs">
                <th className="py-4 px-6">Equipo</th>
                <th className="py-4 px-6">Problema Reportado</th>
                <th className="py-4 px-6">Fecha Inicio</th>
                <th className="py-4 px-6">Costo ($)</th>
                <th className="py-4 px-6">Estado</th>
                <th className="py-4 px-6 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/40 dark:divide-gray-800/40 text-gray-800 dark:text-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    Cargando mantenimientos...
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => {
                  const isCompleted = !!log.completed_at;
                  return (
                    <tr key={log.id} className="hover:bg-white/40 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-gray-900 dark:text-white">
                          {log.assets?.name || "Equipo Eliminado"}
                        </div>
                        <div className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">
                          {log.assets?.asset_tag || "N/A"}
                        </div>
                      </td>
                      <td className="py-4 px-6 max-w-xs">
                        <p className="truncate text-gray-800 dark:text-gray-200">{log.issue_description}</p>
                        {log.resolution_notes && (
                          <p className="text-xs text-green-600 dark:text-green-400 truncate">
                            Solución: {log.resolution_notes}
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs font-semibold text-gray-600 dark:text-gray-300">
                        {new Date(log.started_at).toLocaleDateString("es-CL")}
                      </td>
                      <td className="py-4 px-6 font-mono font-bold">
                        {log.cost ? `$${log.cost.toLocaleString("es-CL")}` : "-"}
                      </td>
                      <td className="py-4 px-6">
                        {isCompleted ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-700 dark:text-green-300 border border-green-500/30">
                            Resuelto
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-500/30">
                            En Proceso
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {!isCompleted ? (
                          <button
                            onClick={() => {
                              setSelectedLogForResolve(log);
                              setFinalCost(log.cost ? String(log.cost) : "");
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-600/90 hover:bg-green-600 text-white shadow-sm transition-all"
                          >
                            Finalizar
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium">Finalizado</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    No hay reportes de mantenimiento registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL REDISEÑADO (LIQUID GLASS INTEGRADO) */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 dark:bg-black/60 backdrop-blur-md transition-all animate-fade-in">
          <div className="w-full max-w-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-3xl border border-white/80 dark:border-gray-700/60 p-7 shadow-[0_20px_50px_rgba(0,0,0,0.15)] space-y-5">
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white drop-shadow-sm">
              Reportar Falla / Enviar a Mantenimiento 🛠️
            </h3>
            
            <form onSubmit={handleCreateReport} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                  Seleccionar Equipo *
                </label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-white/70 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/60 text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/50 transition-all shadow-inner"
                >
                  <option value="">Selecciona un equipo del inventario...</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.asset_tag}) • Estado: {a.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                  Descripción del Problema / Falla *
                </label>
                <textarea
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  required
                  rows={3}
                  placeholder="Detalla el fallo (pantalla rota, no enciende, cambio de batería)..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/70 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/60 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-orange-500/50 transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                  Costo Estimado ($ CLP)
                </label>
                <input
                  type="number"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  placeholder="Ej. 45000"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/70 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/60 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-orange-500/50 transition-all shadow-inner"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/60 hover:bg-white dark:hover:bg-gray-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-orange-600/90 hover:bg-orange-600 shadow-md shadow-orange-500/20 backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? "Guardando..." : "Ingresar Mantenimiento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FINALIZAR MANTENIMIENTO REDISEÑADO */}
      {selectedLogForResolve && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 dark:bg-black/60 backdrop-blur-md transition-all animate-fade-in">
          <div className="w-full max-w-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-3xl border border-white/80 dark:border-gray-700/60 p-7 shadow-[0_20px_50px_rgba(0,0,0,0.15)] space-y-5">
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white drop-shadow-sm">
              Finalizar Reparación de {selectedLogForResolve.assets?.name} ✅
            </h3>
            
            <form onSubmit={handleResolveMaintenance} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                  Notas de Solución / Reparación *
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  required
                  rows={3}
                  placeholder="Detalla qué repuesto se cambió o qué trabajo técnico se realizó..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/70 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/60 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500/50 transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                  Costo Final Real ($ CLP)
                </label>
                <input
                  type="number"
                  value={finalCost}
                  onChange={(e) => setFinalCost(e.target.value)}
                  placeholder="Ej. 50000"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/70 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/60 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500/50 transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                  Estado Posterior del Equipo
                </label>
                <select
                  value={returnToStatus}
                  onChange={(e) => setReturnToStatus(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/70 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/60 text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500/50 transition-all shadow-inner"
                >
                  <option value="disponible">Queda Disponible en Bodega</option>
                  <option value="baja">Dar de Baja por Inoperativo</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedLogForResolve(null)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/60 hover:bg-white dark:hover:bg-gray-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-green-600/90 hover:bg-green-600 shadow-md shadow-green-500/20 backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? "Guardando..." : "Confirmar Resolución"}
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
function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function WrenchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.827M15.25 15.25l-2.062-2.062M13 13l-2.062-2.062M10.875 10.875a5.25 5.25 0 11-7.425-7.424 5.25 5.25 0 017.425 7.424z" />
    </svg>
  );
}

function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CurrencyDollarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-9h6a2.25 2.25 0 010 4.5H9a2.25 2.25 0 000 4.5h6" />
    </svg>
  );
}