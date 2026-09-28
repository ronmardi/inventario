import Link from "next/link";

export default function PrivacidadPage() {
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
            Política de Privacidad
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Última actualización: {new Date().toLocaleDateString('es-CL')}
          </p>

          <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-6">
            <p>
              En <strong>Inventario TI</strong> (en adelante, "nosotros", "la Plataforma" o "el Servicio"), valoramos y respetamos tu privacidad. Esta Política describe cómo recopilamos, utilizamos, almacenamos y protegemos tu información personal al utilizar nuestra aplicación web de gestión de activos.
            </p>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-3">1. Información que recopilamos</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Datos de Registro y Perfil:</strong> Al crear una cuenta, recopilamos tu nombre, dirección de correo electrónico, rol dentro del sistema y contraseña cifrada.</li>
              <li><strong>Autenticación de Terceros (Google SSO):</strong> Si decides iniciar sesión mediante Google, recibiremos tu nombre completo, dirección de correo electrónico y foto de perfil vinculada a esa cuenta, según lo permita tu configuración de privacidad en dicho servicio.</li>
              <li><strong>Datos de Uso de la Plataforma:</strong> Registramos las acciones realizadas dentro del sistema, como la asignación de equipos, creación de bitácoras de mantenimiento y actualizaciones de estado de los activos (auditoría interna).</li>
            </ul>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-3">2. Cómo usamos tu información</h3>
            <p>Utilizamos la información recopilada exclusivamente para:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Proveer, operar y mantener la funcionalidad de la Plataforma.</li>
              <li>Gestionar el control de acceso basado en roles (Superadmin, Técnico, Empleado).</li>
              <li>Mantener un historial de trazabilidad transparente sobre quién posee o repara cada activo tecnológico de la empresa.</li>
              <li>Enviar notificaciones transaccionales.</li>
            </ul>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-3">3. Almacenamiento y Protección de Datos</h3>
            <p>
              Tu información se almacena en infraestructuras de bases de datos seguras en la nube. Implementamos políticas de seguridad a nivel de fila (RLS) y encriptación estándar de la industria para evitar accesos no autorizados. No vendemos, alquilamos ni compartimos tus datos personales con terceros para fines publicitarios.
            </p>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-3">4. Contacto</h3>
            <p>
              Si tienes dudas sobre esta Política de Privacidad, puedes contactar al administrador de tu organización.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}