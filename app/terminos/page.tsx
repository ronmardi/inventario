import Link from "next/link";

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-8 sm:p-12">
          <Link 
            href="/login" 
            className="inline-flex items-center text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 mb-8 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </Link>

          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
            Términos y Condiciones
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Última actualización: {new Date().toLocaleDateString('es-CL')}
          </p>

          <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-6">
            <p>
              Bienvenido a <strong>Inventario TI</strong>. Al acceder y utilizar nuestra plataforma, aceptas estar sujeto a los siguientes Términos y Condiciones. Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar el Servicio.
            </p>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-3">1. Descripción del Servicio</h3>
            <p>
              La Plataforma es una herramienta SaaS diseñada para uso corporativo, permitiendo a las organizaciones gestionar su inventario de activos tecnológicos, historiales de asignación de usuarios y bitácoras de mantenimiento mediante códigos QR y roles.
            </p>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-3">2. Cuentas y Responsabilidades</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Veracidad:</strong> Eres responsable de mantener actualizada la información de tu cuenta.</li>
              <li><strong>Seguridad:</strong> Eres responsable de salvaguardar tu contraseña y de cualquier actividad en tu cuenta.</li>
              <li><strong>Roles:</strong> El mal uso de los privilegios de &quot;Superadmin&quot; o &quot;Técnico&quot; es responsabilidad exclusiva de la organización que gestiona el entorno.</li>
            </ul>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-3">3. Uso Aceptable</h3>
            <p>Te comprometes a utilizar el Servicio de forma lícita y ética. Está estrictamente prohibido:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Intentar vulnerar la seguridad o realizar ingeniería inversa de la Plataforma.</li>
              <li>Registrar información falsa o maliciosa en los campos de activos o mantenimientos.</li>
            </ul>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-3">4. Limitación de Responsabilidad</h3>
            <p>
              El Servicio se proporciona &quot;tal cual&quot; y &quot;según disponibilidad&quot;. No garantizamos que el servicio será ininterrumpido o libre de errores al 100%. No seremos responsables por pérdidas de datos derivadas del uso de la Plataforma.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}