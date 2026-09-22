import { redirect } from "next/navigation";

export default function HomePage() {
  // Redirigir a cualquier visitante directamente a la pantalla de inicio de sesión
  redirect("/login");
}