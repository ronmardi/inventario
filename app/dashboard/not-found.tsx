import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="flex h-[70vh] items-center justify-center p-4 animate-fade-in">
      <div className="max-w-md w-full bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl p-8 rounded-3xl border border-white/60 dark:border-gray-700/50 shadow-xl text-center space-y-4">
        
        <div className="text-7xl font-black text-gray-300 dark:text-gray-700 drop-shadow-sm">
          404
        </div>
        
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Elemento no encontrado</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            No pudimos encontrar el recurso que estás buscando. Puede que haya sido eliminado o la URL sea incorrecta.
          </p>
        </div>

        <div className="pt-4">
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-md active:scale-95"
          >
            Volver al Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}