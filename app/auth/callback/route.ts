import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    
    // 1. Intercambiar el código por una sesión válida
    const { error: sessionError, data: sessionData } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!sessionError && sessionData.user) {
      const user = sessionData.user;
      
      // 2. Verificar si el usuario ya tiene un perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, client_id')
        .eq('id', user.id)
        .maybeSingle()

      // 3. Si no tiene perfil (Usuario nuevo de Google), crear empresa y perfil por defecto
      if (!profile) {
        const defaultCompanyName = user.user_metadata?.full_name 
          ? `Empresa de ${user.user_metadata.full_name}` 
          : "Mi Empresa (Google)";

        // Usamos la misma función RPC que tienes para registros con email
        const { error: rpcError } = await supabase.rpc("registrar_empresa_inicial", {
          p_company_name: defaultCompanyName
        });

        if (rpcError) {
          console.error("Error creando perfil OAuth:", rpcError);
          return NextResponse.redirect(`${origin}/login?error=No_se_pudo_crear_el_perfil`);
        }
      }

      // 4. Redirigir al dashboard con sesión confirmada
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Fallback si no hay código o hubo un error
  return NextResponse.redirect(`${origin}/login?error=Fallo_autenticacion_google`)
}