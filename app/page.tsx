import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col transition-colors duration-300">
      {/* Navbar Simple */}
      <header className="px-6 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="text-xl font-black text-blue-600 dark:text-blue-400">
          Inventario TI
        </div>
        <Link 
          href="/login" 
          className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md"
        >
          Iniciar Sesión
        </Link>
      </header>

      {/* Hero Section (Lo que lee Google) */}
      <main className="grow flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6">
          Gestión Inteligente de <span className="text-blue-600 dark:text-blue-400">Activos Tecnológicos</span>
        </h1>
        
        <p className="max-w-2xl text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-10 leading-relaxed">
          Nuestra plataforma ayuda a las empresas a administrar, rastrear y mantener su infraestructura tecnológica. Controla asignaciones de equipos, registra bitácoras de mantenimiento y gestiona el ciclo de vida de tus activos TI de manera segura y centralizada.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="/login" 
            className="px-8 py-3.5 text-base font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-lg shadow-blue-500/30"
          >
            Acceder al Dashboard
          </Link>
          <a 
            href="#caracteristicas" 
            className="px-8 py-3.5 text-base font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl transition-all shadow-sm"
          >
            Conocer más
          </a>
        </div>
      </main>

      {/* Footer Público (Requisito de Google) */}
      <footer className="py-8 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 text-center">
        <div className="flex justify-center gap-6 mb-4">
          <Link href="/terminos" className="text-sm text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Términos y Condiciones
          </Link>
          <Link href="/politicas" className="text-sm text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Política de Privacidad
          </Link>
        </div>
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} Raccoon Lab. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}