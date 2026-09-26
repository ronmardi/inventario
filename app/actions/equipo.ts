"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

export async function invitarMiembro(formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const role = formData.get("role") as string;

    if (!email || !role) {
      return { error: "Faltan datos obligatorios." };
    }

    // 1. Verificar la sesión y rol del usuario que realiza la petición
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "No autorizado. Por favor inicia sesión." };
    }

    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("client_id, role")
      .eq("id", user.id)
      .single();

    if (
      !currentProfile?.client_id ||
      (currentProfile.role !== "admin" && currentProfile.role !== "superadmin")
    ) {
      return { error: "No tienes permisos suficientes para invitar miembros a la empresa." };
    }

    // 2. Validar que las variables de entorno existan para que no explote
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("❌ Faltan las variables de entorno de Supabase.");
      return { error: "Error de configuración del servidor. Faltan llaves de Supabase." };
    }

    // 3. Inicializar el cliente Admin (bypass de RLS para invitar usuarios)
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 4. Enviar el correo de invitación mediante la Admin API de Supabase Auth
    const { data: inviteData, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
          client_id: currentProfile.client_id,
          role: role,
        },
      });

    if (inviteError) {
      return { error: "Error de Supabase al enviar invitación: " + inviteError.message };
    }

    // 5. Vincular el client_id y el rol directamente en la tabla 'profiles'
    if (inviteData?.user?.id) {
      await supabaseAdmin
        .from("profiles")
        .update({
          client_id: currentProfile.client_id,
          role: role,
        })
        .eq("id", inviteData.user.id);
    }

    return { success: true };

  } catch (error: any) {
    // Si algo catastrófico ocurre, lo atrapamos aquí
    console.error("Error inesperado en invitarMiembro:", error);
    return { error: "Ocurrió un error inesperado en el servidor." };
  }
}