import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. Obtener el usuario de la sesión actual
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Obtener el perfil del usuario
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  // 3. Obtener contadores de inventario en paralelo usando RLS
  // Gracias al RLS, si es un empleado solo contará los equipos que tiene asignados.
  // Si es un técnico/admin, contará todos los equipos de la empresa.
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

  // Formatear el rol para mostrarlo bonito
  const roleDisplay = {
    superadmin: "Super Administrador",
    it_technician: "Técnico IT",
    employee: "Empleado",
  }[profile?.role as string] || "Usuario";

  return (
    <div className="max-w-7xl mx-auto">
      {/* Encabezado de Bienvenida */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Hola, {profile?.full_name || "Usuario"} 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Has iniciado sesión como <span className="font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{roleDisplay}</span>. Aquí tienes el resumen de tu inventario.
        </p>
      </div>

      {/* Grid de Tarjetas de Resumen */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Tarjeta: Total Equipos */}
        <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100 p-5 flex items-center">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div className="ml-5">
            <p className="text-sm font-medium text-gray-500 truncate">Total Equipos</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{totalAssets || 0}</p>
          </div>
        </div>

        {/* Tarjeta: Disponibles */}
        <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100 p-5 flex items-center">
          <div className="p-3 rounded-lg bg-green-50 text-green-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-5">
            <p className="text-sm font-medium text-gray-500 truncate">Disponibles</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{availableAssets || 0}</p>
          </div>
        </div>

        {/* Tarjeta: Asignados */}
        <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100 p-5 flex items-center">
          <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="ml-5">
            <p className="text-sm font-medium text-gray-500 truncate">Asignados</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{assignedAssets || 0}</p>
          </div>
        </div>

        {/* Tarjeta: En Reparación */}
        <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100 p-5 flex items-center">
          <div className="p-3 rounded-lg bg-orange-50 text-orange-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="ml-5">
            <p className="text-sm font-medium text-gray-500 truncate">En Reparación</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{inRepairAssets || 0}</p>
          </div>
        </div>
      </div>

      {/* Sección de Actividad Reciente (Placeholder para expandir luego) */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Actividad Reciente</h2>
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6 text-center text-gray-500">
          Aún no hay actividad registrada en el inventario.
        </div>
      </div>
    </div>
  );
}