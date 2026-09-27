import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

// Tipado interno para unificar el historial
interface ActivityItem {
  id: string;
  type: "assignment" | "return" | "maintenance_start" | "maintenance_end";
  date: Date;
  title: string;
  description: string;
  icon: React.ReactNode;
  badgeClass: string;
}

export default async function DashboardHomePage() {
  const supabase = await createClient();

  // 1. Verificar sesión
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Obtener empresa del usuario
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("client_id, full_name")
    .eq("id", user.id)
    .maybeSingle();

  // 3. Obtener todos los estados de los activos para los KPIs rápidos
  const { data: assets } = await supabase
    .from("assets")
    .select("status");

  const totalAssets = assets?.length || 0;
  const availableAssets = assets?.filter((a) => a.status === "disponible").length || 0;
  const assignedAssets = assets?.filter((a) => a.status === "asignado").length || 0;
  const repairAssets = assets?.filter((a) => a.status === "en_reparacion").length || 0;

  // 4. Obtener las últimas 15 asignaciones y mantenimientos
  const [ { data: assignments }, { data: maintenance } ] = await Promise.all([
    supabase
      .from("asset_assignments")
      .select("id, assigned_at, returned_at, profiles(full_name, email), assets(name, asset_tag)")
      .order("assigned_at", { ascending: false })
      .limit(15),
    supabase
      .from("maintenance_logs")
      .select("id, started_at, completed_at, issue_description, assets(name, asset_tag)")
      .order("started_at", { ascending: false })
      .limit(15)
  ]);

  // 5. Unificar y procesar el Feed de Actividad Reciente
  const activities: ActivityItem[] = [];

  assignments?.forEach((a) => {
    const profile = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles;
    const assetObj = Array.isArray(a.assets) ? a.assets[0] : a.assets;
    const userName = profile?.full_name || profile?.email || "Un usuario";
    const assetName = assetObj?.name || "Equipo";
    const assetTag = assetObj?.asset_tag || "";

    // Evento de Asignación
    activities.push({
      id: `assign-${a.id}`,
      type: "assignment",
      date: new Date(a.assigned_at),
      title: "Equipo Asignado",
      description: `Se entregó el equipo ${assetName} (${assetTag}) a ${userName}.`,
      icon: <UserPlusIcon className="w-5 h-5" />,
      badgeClass: "bg-purple-100 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
    });

    // Evento de Devolución (si existe)
    if (a.returned_at) {
      activities.push({
        id: `return-${a.id}`,
        type: "return",
        date: new Date(a.returned_at),
        title: "Equipo Devuelto",
        description: `${userName} devolvió el equipo ${assetName} (${assetTag}).`,
        icon: <ArrowReturnIcon className="w-5 h-5" />,
        badgeClass: "bg-green-100 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
      });
    }
  });

  maintenance?.forEach((m) => {
    const assetObj = Array.isArray(m.assets) ? m.assets[0] : m.assets;
    const assetName = assetObj?.name || "Equipo";
    const assetTag = assetObj?.asset_tag || "";

    // Evento de Inicio de Mantenimiento
    activities.push({
      id: `maint-start-${m.id}`,
      type: "maintenance_start",
      date: new Date(m.started_at),
      title: "En Reparación",
      description: `${assetName} (${assetTag}) ingresó a mantenimiento: ${m.issue_description}`,
      icon: <WrenchIcon className="w-5 h-5" />,
      badgeClass: "bg-orange-100 text-orange-600 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
    });

    // Evento de Fin de Mantenimiento (si existe)
    if (m.completed_at) {
      activities.push({
        id: `maint-end-${m.id}`,
        type: "maintenance_end",
        date: new Date(m.completed_at),
        title: "Reparación Completada",
        description: `Se finalizó el mantenimiento de ${assetName} (${assetTag}).`,
        icon: <CheckBadgeIcon className="w-5 h-5" />,
        badgeClass: "bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
      });
    }
  });

  // Ordenar cronológicamente (más reciente primero) y tomar los top 10
  activities.sort((a, b) => b.date.getTime() - a.date.getTime());
  const recentActivities = activities.slice(0, 10);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      
      {/* Saludo */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white drop-shadow-sm">
          Hola, {userProfile?.full_name?.split(" ")[0] || "de vuelta"} 👋
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-300">
          Aquí tienes el resumen actual de tu infraestructura tecnológica.
        </p>
      </div>

      {/* Grid de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Activos" value={totalItemsFormat(totalAssets)} color="blue" />
        <KPICard title="Disponibles" value={totalItemsFormat(availableAssets)} color="green" />
        <KPICard title="Asignados" value={totalItemsFormat(assignedAssets)} color="purple" />
        <KPICard title="En Reparación" value={totalItemsFormat(repairAssets)} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Accesos Rápidos */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-gray-700/50 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200/50 dark:border-gray-700/50 pb-3 mb-4">
              Accesos Rápidos
            </h2>
            <div className="space-y-3">
              <QuickLink href="/dashboard/activos/nuevo" icon={<PlusCircleIcon />} text="Registrar Nuevo Equipo" />
              <QuickLink href="/dashboard/escaner" icon={<CameraIcon />} text="Escanear Código QR" />
              <QuickLink href="/dashboard/equipo" icon={<UsersIcon />} text="Gestionar Mi Equipo" />
            </div>
          </div>
        </div>

        {/* FEED DE ACTIVIDAD RECIENTE */}
        <div className="lg:col-span-2 p-6 sm:p-8 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-gray-700/50 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200/50 dark:border-gray-700/50 pb-4 mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
              <BoltIcon className="w-5 h-5 mr-2 text-blue-500" />
              Actividad Reciente
            </h2>
            <Link href="/dashboard/activos" className="text-xs font-bold text-blue-600 hover:text-blue-500 dark:text-blue-400">
              Ver Inventario →
            </Link>
          </div>

          {recentActivities.length > 0 ? (
            <div className="relative border-l-2 border-gray-200/60 dark:border-gray-700/60 ml-3.5 space-y-8 pb-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="relative pl-8">
                  {/* Círculo del Icono */}
                  <div className={`absolute -left-4 top-0.5 flex h-8 w-8 items-center justify-center rounded-full border shadow-sm ${activity.badgeClass} backdrop-blur-md`}>
                    {activity.icon}
                  </div>
                  
                  {/* Contenido */}
                  <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-2xl border border-white/40 dark:border-gray-700/40 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 mb-1">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        {activity.title}
                      </h3>
                      <time className="text-[11px] font-mono font-medium text-gray-500 dark:text-gray-400">
                        {activity.date.toLocaleDateString("es-CL", { 
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
                        })}
                      </time>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {activity.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              <div className="w-16 h-16 mx-auto mb-4 opacity-30 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <BoltIcon className="w-8 h-8" />
              </div>
              <p className="font-medium text-sm">Aún no hay actividad registrada.</p>
              <p className="text-xs mt-1">Los movimientos de equipos aparecerán aquí.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// --- Componentes Auxiliares UI ---

function KPICard({ title, value, color }: { title: string; value: string; color: "blue" | "green" | "purple" | "orange" }) {
  const colorMap = {
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400",
    green: "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400",
    purple: "bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-400",
    orange: "bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-400",
  };

  return (
    <div className={`p-6 rounded-3xl border shadow-sm backdrop-blur-xl ${colorMap[color]}`}>
      <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-2">{title}</p>
      <p className="text-4xl font-black">{value}</p>
    </div>
  );
}

function QuickLink({ href, icon, text }: { href: string; icon: React.ReactNode; text: string }) {
  return (
    <Link
      href={href}
      className="flex items-center p-3 rounded-xl hover:bg-white/60 dark:hover:bg-gray-800/60 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all text-sm font-semibold text-gray-700 dark:text-gray-300 group"
    >
      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors mr-3">
        {icon}
      </span>
      {text}
    </Link>
  );
}

function totalItemsFormat(num: number) {
  return num.toString().padStart(2, "0");
}

// --- Iconos SVG ---
function UserPlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.66-1.548c0 .356-.16.697-.433.905A8.966 8.966 0 0112 21a8.966 8.966 0 01-7.567-4.17c-.273-.208-.433-.549-.433-.905z" />
    </svg>
  );
}

function ArrowReturnIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
    </svg>
  );
}

function WrenchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.83M11.42 15.17l-4.95-4.95a1.875 1.875 0 010-2.652L8.5 5.5m2.92 9.67L9.5 17.5M8.5 5.5l1.65-1.65a1.875 1.875 0 012.652 0L15.17 6.22m-6.67-.72L6.13 7.87a1.875 1.875 0 000 2.652l4.95 4.95m-9.58 6.08l4.41-4.41" />
    </svg>
  );
}

function CheckBadgeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
    </svg>
  );
}

function BoltIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

function PlusCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CameraIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
    </svg>
  );
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}