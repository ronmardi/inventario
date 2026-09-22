import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const [
    { count: totalAssets },
    { count: availableAssets },
    { count: assignedAssets },
    { count: inRepairAssets },
  ] = await Promise.all([
    supabase.from("assets").select("*", { count: "exact", head: true }),
    supabase.from("assets").select("*", { count: "exact", head: true }).eq("status", "disponible"),
    supabase.from("assets").select("*", { count: "exact", head: true }).eq("status", "asignado"),
    supabase.from("assets").select("*", { count: "exact", head: true }).eq("status", "en_reparacion"),
  ]);

  const roleDisplay = {
    superadmin: "Super Administrador",
    it_technician: "Técnico IT",
    employee: "Empleado",
  }[profile?.role as string] || "Usuario";

  return (
    <div className="max-w-7xl mx-auto">
      
      {/* Encabezado de Bienvenida (Estilo Glass) */}
      <div className="mb-8 p-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] border border-white/60 dark:border-gray-700/50 transition-all">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white sm:text-3xl drop-shadow-sm">
          Hola, {profile?.full_name || "Usuario"} 👋
        </h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          Has iniciado sesión como <span className="font-bold text-blue-700 dark:text-blue-300 bg-blue-100/50 dark:bg-blue-900/50 backdrop-blur-sm px-3 py-1 rounded-full border border-blue-200/50 dark:border-blue-700/50">{roleDisplay}</span>. Aquí tienes el resumen de tu inventario.
        </p>
      </div>

      {/* Grid de Tarjetas de Resumen (Liquid Glass 3D) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Tarjeta: Total Equipos */}
        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl overflow-hidden rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border border-white/60 dark:border-gray-700/50 p-5 flex items-center hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div className="p-3 rounded-xl bg-blue-500/10 dark:bg-blue-400/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 backdrop-blur-md">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          </div>
          <div className="ml-5">
            <p className="text-sm font-bold text-gray-600 dark:text-gray-400 truncate tracking-wide">TOTAL EQUIPOS</p>
            <p className="mt-1 text-3xl font-black text-gray-900 dark:text-white drop-shadow-sm">{totalAssets || 0}</p>
          </div>
        </div>

        {/* Tarjeta: Disponibles */}
        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl overflow-hidden rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border border-white/60 dark:border-gray-700/50 p-5 flex items-center hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div className="p-3 rounded-xl bg-green-500/10 dark:bg-green-400/10 border border-green-500/20 text-green-600 dark:text-green-400 backdrop-blur-md">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div className="ml-5">
            <p className="text-sm font-bold text-gray-600 dark:text-gray-400 truncate tracking-wide">DISPONIBLES</p>
            <p className="mt-1 text-3xl font-black text-gray-900 dark:text-white drop-shadow-sm">{availableAssets || 0}</p>
          </div>
        </div>

        {/* Tarjeta: Asignados */}
        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl overflow-hidden rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border border-white/60 dark:border-gray-700/50 p-5 flex items-center hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div className="p-3 rounded-xl bg-purple-500/10 dark:bg-purple-400/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 backdrop-blur-md">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <div className="ml-5">
            <p className="text-sm font-bold text-gray-600 dark:text-gray-400 truncate tracking-wide">ASIGNADOS</p>
            <p className="mt-1 text-3xl font-black text-gray-900 dark:text-white drop-shadow-sm">{assignedAssets || 0}</p>
          </div>
        </div>

        {/* Tarjeta: En Reparación */}
        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl overflow-hidden rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border border-white/60 dark:border-gray-700/50 p-5 flex items-center hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div className="p-3 rounded-xl bg-orange-500/10 dark:bg-orange-400/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 backdrop-blur-md">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <div className="ml-5">
            <p className="text-sm font-bold text-gray-600 dark:text-gray-400 truncate tracking-wide">EN REPARACIÓN</p>
            <p className="mt-1 text-3xl font-black text-gray-900 dark:text-white drop-shadow-sm">{inRepairAssets || 0}</p>
          </div>
        </div>
      </div>

      {/* Sección de Actividad Reciente (Glassmorphism) */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 drop-shadow-sm pl-2">Actividad Reciente</h2>
        <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] rounded-2xl border border-white/60 dark:border-gray-700/50 p-10 text-center text-gray-600 dark:text-gray-400 font-medium transition-all">
          Aún no hay actividad registrada en el inventario.
        </div>
      </div>
    </div>
  );
}