import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import PerfilEmpresaPage from "./PerfilClient";

export default async function PerfilServerPage() {
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

  // Bloqueo de seguridad estricto en el servidor (P0.2)
  if (profile?.role === "employee") {
    redirect("/dashboard");
  }

  return <PerfilEmpresaPage />;
}