export default function DashboardLoading() {
  return (
    <div className="flex h-[70vh] items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        {/* Spinner estilizado */}
        <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin shadow-lg"></div>
        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 animate-pulse tracking-wide">
          Cargando datos...
        </p>
      </div>
    </div>
  );
}