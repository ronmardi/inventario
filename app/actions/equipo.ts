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

    // Validar que el rol recibido coincida con el esquema unificado (employee, it_technician, superadmin)
    const validRoles = ["employee", "it_technician", "superadmin"];
    if (!validRoles.includes(role)) {
      return { error: "El rol seleccionado no es válido." };
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

    // Permitir invitaciones solo a perfiles superadmin o it_technician
    if (
      !currentProfile?.client_id ||
      (currentProfile.role !== "superadmin" && currentProfile.role !== "it_technician")
    ) {
      return { error: "No tienes permisos suficientes para invitar miembros a la empresa." };
    }

    // 2. Validar que las variables de entorno existan en Node.js
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      console.error("❌ Falta NEXT_PUBLIC_SUPABASE_URL en el entorno de Node.js.");
      return { error: "Falta configurar NEXT_PUBLIC_SUPABASE_URL en el servidor (.env.local)." };
    }

    if (!serviceRoleKey) {
      console.error("❌ Falta SUPABASE_SERVICE_ROLE_KEY en el entorno de Node.js.");
      return { error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor (.env.local)." };
    }

    // 3. Inicializar el cliente Admin (bypass de RLS para invitar usuarios)
    const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey);

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
    console.error("Error inesperado en invitarMiembro:", error);
    return { error: "Ocurrió un error inesperado en el servidor." };
  }
}