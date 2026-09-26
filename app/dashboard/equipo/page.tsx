import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function EquipoPage() {
  const supabase = await createClient();

  // 1. Obtener sesión actual
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Obtener el client_id del usuario actual
  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("client_id")
    .eq("id", user.id)
    .single();

  if (!currentUserProfile?.client_id) {
    // Si no tiene empresa, lo mandamos al inicio
    redirect("/dashboard");
  }

  // 3. Buscar a todos los miembros de la misma empresa
  const { data: teamMembers, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .eq("client_id", currentUserProfile.client_id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error cargando equipo:", error);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] border border-white/60 dark:border-gray-700/50 transition-all">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white sm:text-3xl drop-shadow-sm">
            Mi Equipo 👥
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Gestiona los miembros de tu organización y sus roles de acceso.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-blue-600/90 hover:bg-blue-600 shadow-md shadow-blue-500/20 backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-[0.98]">
            <UserPlusIcon className="w-5 h-5 mr-2" />
            Invitar Miembro
          </button>
        </div>
      </div>

      {/* Tabla del Equipo (Liquid Glass) */}
      <div className="overflow-hidden bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-gray-700/50 shadow-sm transition-all">
        <div className="overflow-x-auto custom-scrollbar pb-2">
          <table className="w-full text-left border-collapse text-sm min-w-max">
            <thead>
              <tr className="border-b border-gray-200/50 dark:border-gray-700/50 bg-white/30 dark:bg-gray-800/30 text-gray-700 dark:text-gray-300 font-bold uppercase tracking-wider text-xs">
                <th className="py-4 px-6">Usuario</th>
                <th className="py-4 px-6">Rol en el Sistema</th>
                <th className="py-4 px-6">Fecha de Ingreso</th>
                <th className="py-4 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/40 dark:divide-gray-800/40 text-gray-800 dark:text-gray-200">
              {teamMembers && teamMembers.length > 0 ? (
                teamMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-white/40 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        {/* Avatar autogenerado con la primera letra */}
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center shadow-md">
                          {(member.full_name || member.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {member.full_name || "Usuario sin nombre"}
                            {member.id === user.id && (
                              <span className="ml-2 px-2 py-0.5 text-[10px] uppercase font-black bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/30 rounded-full">
                                Tú
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm ${
                        member.role === 'admin' 
                          ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30'
                          : 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30'
                      }`}>
                        {member.role === 'admin' ? 'Administrador' : 'Técnico / Staff'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-300 text-xs font-semibold">
                      {new Date(member.created_at).toLocaleDateString("es-CL")}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {member.id !== user.id ? (
                        <button className="text-blue-600 hover:text-blue-500 dark:text-blue-400 font-semibold text-xs transition-colors">
                          Editar Rol
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No puedes editarte a ti mismo</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500 dark:text-gray-400 font-medium">
                    No se encontraron miembros.
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

// Icono
function UserPlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.66-1.546" />
    </svg>
  );
}