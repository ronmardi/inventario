"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";

interface AssetData {
  id: string;
  asset_tag: string;
  name: string;
  model: string | null;
  status: string;
  client_id: string;
}

interface ProfileData {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
}

interface ActiveAssignment {
  id: string;
  assigned_to: string;
  assigned_at: string;
  condition_out: string | null;
  notes: string | null;
  profiles: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
}

interface AlertState {
  title: string;
  message: string;
  type: "error" | "success" | "warning";
}

export default function AsignarActivoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: assetId } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [asset, setAsset] = useState<AssetData | null>(null);
  const [employees, setEmployees] = useState<ProfileData[]>([]);
  const [activeAssignment, setActiveAssignment] = useState<ActiveAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertData, setAlertData] = useState<AlertState | null>(null);

  // Campos de formulario para Asignación
  const [assignedTo, setAssignedTo] = useState("");
  const [assignedAt, setAssignedAt] = useState(new Date().toISOString().split("T")[0]);
  const [conditionOut, setConditionOut] = useState("Excelente");
  const [notesOut, setNotesOut] = useState("");

  // Campos de formulario para Devolución
  const [returnedAt, setReturnedAt] = useState(new Date().toISOString().split("T")[0]);
  const [conditionIn, setConditionIn] = useState("Bueno");
  const [nextStatus, setNextStatus] = useState("disponible");
  const [notesIn, setNotesIn] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("client_id")
        .eq("id", user.id)
        .single();

      if (!profile?.client_id) return;

      const [{ data: assetData }, { data: profilesData }] = await Promise.all([
        supabase
          .from("assets")
          .select("id, asset_tag, name, model, status, client_id")
          .eq("id", assetId)
          .single(),
        supabase
          .from("profiles")
          .select("id, full_name, email, department")
          .eq("client_id", profile.client_id)
          .order("full_name"),
      ]);

      if (assetData) {
        setAsset(assetData);

        if (assetData.status === "asignado") {
          const { data: assignmentData } = await supabase
            .from("asset_assignments")
            .select(`
              id,
              assigned_to,
              assigned_at,
              condition_out,
              notes,
              profiles:assigned_to ( full_name, email )
            `)
            .eq("asset_id", assetId)
            .is("returned_at", null)
            .maybeSingle();

          if (assignmentData) {
            setActiveAssignment(assignmentData as unknown as ActiveAssignment);
          }
        }
      }

      if (profilesData) {
        setEmployees(profilesData);
      }

      setLoading(false);
    }

    loadData();
  }, [assetId, supabase, router]);

  // Procesar Nueva Asignación Atómica (RPC)
  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset || !assignedTo) return;

    setIsSubmitting(true);

    const { error: rpcError } = await supabase.rpc("procesar_asignacion_atomica", {
      p_asset_id: asset.id,
      p_assigned_to_name: assignedTo, // Pasamos el ID (la tabla relacional usa UUID)
      p_action: "asignar",
      p_notes: `[Entrega: ${conditionOut}] ${notesOut}`,
    });

    if (rpcError) {
      setAlertData({
        title: "Error de Asignación",
        message: rpcError.message,
        type: "error",
      });
      setIsSubmitting(false);
      return;
    }

    router.push(`/dashboard/activos/${asset.id}`);
    router.refresh();
  };

  // Procesar Devolución (Sin RPC porque hay que actualizar registro existente, no insertar)
  // Como 'procesar_asignacion_atomica' inserta, para la devolución actualizamos la bitácora abierta
  // y actualizamos el estado del activo.
  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset || !activeAssignment) return;

    setIsSubmitting(true);

    // 1. Finalizar el registro en asset_assignments
    const { error: returnError } = await supabase
      .from("asset_assignments")
      .update({
        returned_at: new Date(returnedAt).toISOString(),
        condition_in: conditionIn,
        notes: notesIn ? `[Devolución - ${conditionIn}]: ${notesIn}` : `[Devolución - ${conditionIn}]`,
      })
      .eq("id", activeAssignment.id);

    if (returnError) {
      setAlertData({
        title: "Error al registrar la devolución",
        message: returnError.message,
        type: "error",
      });
      setIsSubmitting(false);
      return;
    }

    // 2. Actualizar el estado del activo (disponible o en_reparacion)
    const { error: assetError } = await supabase
      .from("assets")
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", asset.id);

    if (assetError) {
      setAlertData({
        title: "Error de Sincronización",
        message: "La devolución se registró, pero no se pudo cambiar el estado del equipo.",
        type: "error",
      });
      setIsSubmitting(false);
      return;
    }

    router.push(`/dashboard/activos/${asset.id}`);
    router.refresh();
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Cargando datos del activo...</p>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="max-w-3xl mx-auto p-8 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-3xl border text-center">
        <p className="text-gray-700 dark:text-gray-300 font-bold">Equipo no encontrado.</p>
        <Link href="/dashboard/activos" className="mt-4 inline-block text-sm text-blue-600 font-bold">
          Volver a Activos
        </Link>
      </div>
    );
  }

  const assignedProfile = activeAssignment?.profiles
    ? Array.isArray(activeAssignment.profiles)
      ? activeAssignment.profiles[0]
      : activeAssignment.profiles
    : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* MODAL DE ALERTA PERSONALIZADO */}
      {alertData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/30 dark:bg-black/70 backdrop-blur-md transition-all animate-fade-in">
          <div className="w-full max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-3xl border border-white/80 dark:border-gray-700/60 p-6 shadow-2xl space-y-4 text-center">
            
            <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border shadow-sm ${
              alertData.type === "error" 
                ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400" 
                : alertData.type === "success"
                ? "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400"
                : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
            }`}>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                {alertData.title}
              </h3>
              <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed">
                {alertData.message}
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setAlertData(null)}
                className="w-full py-3 rounded-xl font-bold text-sm text-white bg-blue-600/90 hover:bg-blue-600 shadow-md shadow-blue-500/20 backdrop-blur-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-gray-700/50 shadow-sm transition-all">
        <div>
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
            {asset.asset_tag}
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white sm:text-3xl">
            {asset.status === "asignado" ? "Devolución de Equipo 🔄" : "Asignar Equipo 📋"}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {asset.name} {asset.model ? `• ${asset.model}` : ""}
          </p>
        </div>
        <Link
          href={`/dashboard/activos/${asset.id}`}
          className="px-4 py-2.5 rounded-xl font-bold text-sm text-gray-700 dark:text-gray-200 bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 backdrop-blur-sm transition-all"
        >
          Cancelar
        </Link>
      </div>

      {/* CASO A: EL EQUIPO ESTÁ ASIGNADO -> REGISTRAR DEVOLUCIÓN */}
      {asset.status === "asignado" ? (
        <form onSubmit={handleReturn} className="space-y-6">
          <GlassCard>
            {/* Ficha de Asignación Actual */}
            <div className="p-5 bg-purple-500/10 border border-purple-500/30 rounded-2xl space-y-2 mb-6">
              <p className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                Asignación Activa
              </p>
              <p className="text-lg font-extrabold text-gray-900 dark:text-white">
                {assignedProfile?.full_name || "Empleado Asignado"}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Correo: {assignedProfile?.email || "Sin correo"} • Entregado el:{" "}
                {activeAssignment?.assigned_at
                  ? new Date(activeAssignment.assigned_at).toLocaleDateString("es-CL")
                  : "Fecha no registrada"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fecha de Devolución */}
              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                  Fecha de Devolución *
                </label>
                <input
                  type="date"
                  value={returnedAt}
                  onChange={(e) => setReturnedAt(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white text-sm outline-none transition-all shadow-inner focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              {/* Condición de Recepción */}
              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                  Condición al Recibir *
                </label>
                <select
                  value={conditionIn}
                  onChange={(e) => setConditionIn(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white text-sm outline-none transition-all shadow-inner focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="Excelente">Excelente (Como nuevo)</option>
                  <option value="Bueno">Bueno (Uso normal)</option>
                  <option value="Con Detalles">Con Detalles (Rayones, marcas)</option>
                  <option value="Dañado">Dañado / Con falla</option>
                </select>
              </div>

              {/* Nuevo Estado del Activo */}
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                  Estado Posterior del Equipo *
                </label>
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white text-sm outline-none transition-all shadow-inner focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="disponible">Queda Disponible en Bodega</option>
                  <option value="en_reparacion">Enviar a Reparación / Mantenimiento</option>
                  <option value="baja">Dar de Baja Definitiva</option>
                </select>
              </div>
            </div>

            {/* Observaciones */}
            <div className="mt-6">
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                Observaciones de Recepción
              </label>
              <textarea
                value={notesIn}
                onChange={(e) => setNotesIn(e.target.value)}
                rows={3}
                placeholder="Detalla si falta algún accesorio, cargador o la razón del cambio..."
                className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white text-sm outline-none transition-all shadow-inner focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </GlassCard>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-purple-600/90 hover:bg-purple-600 shadow-lg shadow-purple-500/30 backdrop-blur-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            {isSubmitting ? "Registrando Devolución..." : "Confirmar Devolución"}
          </button>
        </form>
      ) : (
        /* CASO B: EL EQUIPO ESTÁ DISPONIBLE -> REGISTRAR ASIGNACIÓN */
        <form onSubmit={handleAssign} className="space-y-6">
          <GlassCard>
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                Seleccionar Empleado *
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white text-sm outline-none transition-all shadow-inner focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="">Selecciona quién recibirá el equipo...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name} ({emp.email}) {emp.department ? `• ${emp.department}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fecha de Asignación */}
              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                  Fecha de Entrega *
                </label>
                <input
                  type="date"
                  value={assignedAt}
                  onChange={(e) => setAssignedAt(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white text-sm outline-none transition-all shadow-inner focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              {/* Condición de Entrega */}
              <div>
                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                  Estado de Entrega *
                </label>
                <select
                  value={conditionOut}
                  onChange={(e) => setConditionOut(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white text-sm outline-none transition-all shadow-inner focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="Excelente">Excelente (Nuevo / Impecable)</option>
                  <option value="Bueno">Bueno (Reacondicionado en buen estado)</option>
                  <option value="Con Detalles">Con Detalles Estéticos</option>
                </select>
              </div>
            </div>

            {/* Observaciones */}
            <div className="mt-6">
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                Observaciones / Accesorios Incluidos
              </label>
              <textarea
                value={notesOut}
                onChange={(e) => setNotesOut(e.target.value)}
                rows={3}
                placeholder="Ej. Se entrega con cargador original de 65W, mochila y adaptador USB-C."
                className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white text-sm outline-none transition-all shadow-inner focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </GlassCard>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-blue-600/90 hover:bg-blue-600 shadow-lg shadow-blue-500/30 backdrop-blur-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            {isSubmitting ? "Registrando Asignación..." : "Confirmar Asignación"}
          </button>
        </form>
      )}

    </div>
  );
}