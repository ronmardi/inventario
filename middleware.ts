import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

// Configuración para determinar en qué rutas se ejecuta el middleware
export const config = {
  matcher: [
    /*
     * Intercepta todas las rutas excepto:
     * - _next/static (archivos estáticos de Next.js)
     * - _next/image (imágenes optimizadas)
     * - favicon.ico (ícono del sitio)
     * - auth (Permite el flujo de Google OAuth y sus callbacks sin bloqueos)
     * - La página de inicio (raíz exacta mediante |$)
     * - terminos y politicas (páginas legales públicas)
     * - Imágenes estáticas (.svg, .png, .jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth|terminos|politicas|$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}