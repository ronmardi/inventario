"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { GlassCard } from "@/components/ui/GlassCard";

interface AlertState {
  title: string;
  message: string;
  type?: "success" | "error" | "warning";
}

export default function PerfilEmpresaPage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);

  // Estados del formulario
  const [companyName, setCompanyName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState("CLP");

  // Manejo del Logo
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Estado del Modal Personalizado
  const [alertData, setAlertData] = useState<AlertState | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("client_id, role")
        .eq("id", user.id)
        .single();

      if (
        !profile?.client_id ||
        (profile.role !== "superadmin" && profile.role !== "it_technician")
      ) {
        router.push("/dashboard");
        return;
      }

      setClientId(profile.client_id);

      const { data: clientData } = await supabase
        .from("clients")
        .select("*")
        .eq("id", profile.client_id)
        .single();

      if (clientData) {
        setCompanyName(clientData.name || "");
        setContactEmail(clientData.contact_email || "");
        setPhone(clientData.phone || "");
        setCurrency(clientData.currency || "CLP");
        if (clientData.logo_url) setLogoPreview(clientData.logo_url);
      }

      setLoading(false);
    }
    loadProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, router]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    setIsSaving(true);

    try {
      let finalLogoUrl = logoPreview;

      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop();
        const fileName = `${clientId}-${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("logos")
          .upload(fileName, logoFile, { upsert: true });

        if (!uploadError && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from("logos")
            .getPublicUrl(fileName);
          finalLogoUrl = publicUrlData.publicUrl;
        }
      }

      const { error } = await supabase
        .from("clients")
        .update({
          name: companyName,
          contact_email: contactEmail,
          phone: phone,
          currency: currency,
          logo_url: finalLogoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", clientId);

      if (error) throw error;

      // 🟢 Modal de Éxito
      setAlertData({
        title: "¡Cambios Guardados!",
        message: "El perfil de la empresa y su identidad visual se han actualizado correctamente.",
        type: "success",
      });
      router.refresh();

    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Ocurrió un error inesperado";
      
      // 🔴 Modal de Error
      setAlertData({
        title: "Error al guardar",
        message: errorMessage,
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      
      {/* MODAL DE ALERTA PERSONALIZADO (LIQUID GLASS) */}
      {alertData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/70 backdrop-blur-md transition-all animate-fade-in">
          <div className="w-full max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-3xl border border-white/80 dark:border-gray-700/60 p-6 shadow-2xl space-y-4 text-center">
            
            <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border shadow-sm ${
              alertData.type === "error" 
                ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400" 
                : "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400"
            }`}>
              {alertData.type === "error" ? (
                <ExclamationTriangleIcon className="w-7 h-7" />
              ) : (
                <CheckCircleIcon className="w-7 h-7" />
              )}
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                {alertData.title}
              </h3>
              <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed">
                {alertData.message}
              </p>
            </div>

            <div className="pt-4">
              <button
                onClick={() => setAlertData(null)}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-blue-600/90 hover:bg-blue-600 shadow-md shadow-blue-500/20 backdrop-blur-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex items-center justify-between p-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-gray-700/50 shadow-sm transition-all">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white sm:text-3xl">
            Perfil de la Empresa 🏢
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Personaliza el entorno visual y configura los parámetros base de tu organización.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="px-4 py-2.5 rounded-xl font-bold text-sm text-gray-700 dark:text-gray-200 bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 backdrop-blur-sm transition-all"
        >
          Volver
        </Link>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Sección de Logo */}
        <GlassCard title="Identidad Visual">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative h-32 w-32 shrink-0 rounded-2xl bg-white/60 dark:bg-gray-800/60 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden shadow-inner backdrop-blur-md">
              {logoPreview ? (
                <Image
                  src={logoPreview}
                  alt="Logo Empresa"
                  fill
                  className="object-contain p-2"
                  unoptimized
                />
              ) : (
                <BuildingIcon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
              )}
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <label className="cursor-pointer inline-flex items-center px-5 py-2.5 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                <UploadIcon className="w-4 h-4 mr-2" />
                Subir Nuevo Logo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Recomendado: PNG o SVG transparente, mínimo 400x400px.
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Sección de Datos Generales */}
        <GlassCard title="Información de la Organización">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                Nombre de la Empresa *
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                placeholder="Ej. TechCorp Solutions SpA"
                className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/60 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                Correo Electrónico de Contacto
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="soporte@empresa.com"
                className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/60 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                Teléfono Principal
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+56 9 1234 5678"
                className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/60 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                Moneda del Sistema
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/60 text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
              >
                <option value="CLP">Peso Chileno (CLP)</option>
                <option value="USD">Dólar Estadounidense (USD)</option>
                <option value="MXN">Peso Mexicano (MXN)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Se usará para los reportes de costos de mantenimiento.
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Botón Guardar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-blue-600/90 hover:bg-blue-600 shadow-lg shadow-blue-500/30 backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center"
          >
            {isSaving ? "Guardando Cambios..." : "Guardar Configuración"}
          </button>
        </div>
      </form>
    </div>
  );
}

// Iconos SVG
function BuildingIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12.25" /></svg>;
}
function UploadIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>;
}
function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function ExclamationTriangleIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2.25m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>;
}