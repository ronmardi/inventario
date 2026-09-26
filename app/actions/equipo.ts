"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

export async function invitarMiembro(formData: FormData) {
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

  // 2. Inicializar el cliente Admin (bypass de RLS para invitar usuarios)
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 3. Enviar el correo de invitación mediante la Admin API de Supabase Auth
  const { data: inviteData, error: inviteError } =
    await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        client_id: currentProfile.client_id,
        role: role,
      },
    });

  if (inviteError) {
    return { error: "Error al enviar la invitación: " + inviteError.message };
  }

  // 4. Vincular el client_id y el rol directamente en la tabla 'profiles'
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
}