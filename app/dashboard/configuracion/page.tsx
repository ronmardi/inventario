// app/dashboard/configuracion/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ConfiguracionPage from "./ConfiguracionClient";

export default async function ConfiguracionServerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Bloqueo de seguridad en el servidor (P0.2)
  if (profile?.role === "employee") {
    redirect("/dashboard");
  }

  return <ConfiguracionPage />;
}