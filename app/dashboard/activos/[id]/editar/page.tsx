"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { sanitizeInput } from "@/utils/sanitize";

interface Category {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
}

interface AlertState {
  title: string;
  message: string;
  type: "error" | "success" | "warning";
}

export default function EditarActivoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // En Next.js 15 params es una promesa, usamos `use()` para desenvolverla
  const { id: assetId } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);

  // Estados del formulario pre-cargados
  const [assetTag, setAssetTag] = useState("");
  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [status, setStatus] = useState("disponible");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [notes, setNotes] = useState("");

  // Estados para imagen
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null); // Previa local o actual
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [alertData, setAlertData] = useState<AlertState | null>(null);

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // 1. Obtener perfil para validación de tenant
      const { data: profile } = await supabase
        .from("profiles")
        .select("client_id")
        .eq("id", user.id)
        .single();

      if (!profile?.client_id) {
        setAlertData({
          title: "Acceso Denegado",
          message: "No se detectó la empresa asociada a este usuario.",
          type: "error",
        });
        return;
      }
      setClientId(profile.client_id);

      // 2. Cargar catálogos y datos del activo en paralelo
      const [
        { data: cats },
        { data: locs },
        { data: assetData, error: assetError },
      ] = await Promise.all([
        supabase.from("categories").select("id, name").order("name"),
        supabase.from("locations").select("id, name").order("name"),
        supabase.from("assets").select("*").eq("id", assetId).single(),
      ]);

      if (cats) setCategories(cats);
      if (locs) setLocations(locs);

      // 3. Validar y cargar datos en el estado
      if (assetError || !assetData) {
        setAlertData({
          title: "Activo no encontrado",
          message: "El equipo que intentas editar no existe o no tienes permiso.",
          type: "error",
        });
      } else if (assetData.client_id !== profile.client_id) {
        setAlertData({
          title: "Acceso Prohibido",
          message: "Este equipo pertenece a otra organización.",
          type: "error",
        });
      } else {
        setAssetTag(assetData.asset_tag || "");
        setName(assetData.name || "");
        setModel(assetData.model || "");
        setSerialNumber(assetData.serial_number || "");
        setCategoryId(assetData.category_id || "");
        setLocationId(assetData.location_id || "");
        setStatus(assetData.status || "disponible");
        setPurchaseDate(assetData.purchase_date || "");
        setNotes(assetData.notes || "");

        if (assetData.image_url) {
          setExistingImageUrl(assetData.image_url);
          setImagePreview(assetData.image_url); // Mostrar foto actual
        }
      }

      setLoading(false);
    }
    loadData();
  }, [supabase, router, assetId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId) {
      setAlertData({
        title: "Error crítico",
        message: "Falta el ID del cliente. Recarga la página.",
        type: "error",
      });
      // P1.8 FIX: Aseguramos desactivar el estado de carga antes del return temprano
      setIsSaving(false);
      return;
    }

    setIsSaving(true);

    try {
      let finalImageUrl = existingImageUrl;

      // 1. Si hay una nueva imagen, subirla a Supabase Storage
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${clientId}/${Date.now()}-edit.${fileExt}`; // Separamos por cliente

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("assets") // Asegúrate de que el bucket 'assets' exista y sea público en Supabase
          .upload(fileName, imageFile, { upsert: true });

        if (uploadError) throw uploadError;

        if (uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from("assets")
            .getPublicUrl(fileName);
          finalImageUrl = publicUrlData.publicUrl;
        }
      }

      // 2. Actualizar el registro en la base de datos (P3.18: Sanitización de inputs aplicada)
      const { error: updateError } = await supabase
        .from("assets")
        .update({
          asset_tag: sanitizeInput(assetTag),
          name: sanitizeInput(name),
          model: sanitizeInput(model) || null,
          serial_number: sanitizeInput(serialNumber) || null,
          category_id: categoryId || null,
          location_id: locationId || null,
          status,
          purchase_date: purchaseDate || null,
          notes: sanitizeInput(notes) || null,
          image_url: finalImageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", assetId);

      if (updateError) throw updateError;

      router.push(`/dashboard/activos/${assetId}`);
      router.refresh();
      
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Error inesperado al guardar.";
      setAlertData({
        title: "Error al actualizar",
        message: errorMessage,
        type: "error",
      });
      // P1.8 FIX: Reactivar el botón solo si hubo error. Si fue exitoso, dejamos "Guardando..." hasta que cambie de ruta.
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Modal de Alerta */}
      {alertData && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/30 dark:bg-black/70 backdrop-blur-md transition-all animate-fade-in">
          <div className="w-full max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-3xl border border-white/80 dark:border-gray-700/60 p-6 shadow-2xl space-y-4 text-center">
            <div
              className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border shadow-sm ${
                alertData.type === "error"
                  ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
              }`}
            >
              <ExclamationTriangleIcon className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                {alertData.title}
              </h3>
              <p className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-300 leading-relaxed">
                {alertData.message}
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => {
                  setAlertData(null);
                  if (alertData.title === "Activo no encontrado" || alertData.title === "Acceso Prohibido") {
                    router.push("/dashboard/activos");
                  }
                }}
                className="w-full py-3 rounded-xl font-bold text-sm text-white bg-blue-600/90 hover:bg-blue-600 shadow-md shadow-blue-500/20 backdrop-blur-sm transition-all"
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
            Editar Activo ✏️
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Modificando el equipo: <span className="font-bold text-blue-600 dark:text-blue-400">{assetTag}</span>
          </p>
        </div>
        <Link
          href={`/dashboard/activos/${assetId}`}
          className="px-4 py-2.5 rounded-xl font-bold text-sm text-gray-700 dark:text-gray-200 bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 backdrop-blur-sm transition-all"
        >
          Cancelar
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Fotografía del Equipo */}
        <GlassCard title="Fotografía del Producto">
          <div className="flex items-center space-x-6">
            <div className="relative h-28 w-28 rounded-2xl bg-white/60 dark:bg-gray-800/60 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden shadow-inner backdrop-blur-md">
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <CameraIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              )}
            </div>
            <div className="space-y-2">
              <label 
                htmlFor="imageUpload"
                className="cursor-pointer inline-block px-4 py-2.5 rounded-xl bg-blue-600/90 border border-blue-500/60 text-sm font-bold text-white shadow-sm hover:bg-blue-600 transition-all"
              >
                Cambiar Foto
                <input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
              {existingImageUrl && !imageFile && (
                <p className="text-xs text-green-600 dark:text-green-400 font-medium block">
                  Manteniendo foto original.
                </p>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Datos Principales */}
        <GlassCard>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Categoría */}
            <div>
              <label htmlFor="categoryId" className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                Categoría
              </label>
              <select
                id="categoryId"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 text-sm outline-none transition-all shadow-inner"
              >
                <option value="">Seleccionar Categoría...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Etiqueta ID */}
            <div>
              <label htmlFor="assetTag" className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                Etiqueta ID / Código *
              </label>
              <input
                id="assetTag"
                type="text"
                value={assetTag}
                onChange={(e) => setAssetTag(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 font-mono font-bold text-blue-600 dark:text-blue-400 text-sm outline-none transition-all shadow-inner focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            {/* Nombre */}
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                Nombre Corto *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white text-sm outline-none transition-all shadow-inner focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            {/* Modelo */}
            <div>
              <label htmlFor="model" className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                Marca / Modelo
              </label>
              <input
                id="model"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white text-sm outline-none transition-all shadow-inner focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            {/* Número de Serie */}
            <div>
              <label htmlFor="serialNumber" className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                Número de Serie (S/N)
              </label>
              <input
                id="serialNumber"
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white font-mono text-sm outline-none transition-all shadow-inner focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            {/* Ubicación */}
            <div>
              <label htmlFor="locationId" className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                Ubicación Física
              </label>
              <select
                id="locationId"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white text-sm outline-none transition-all shadow-inner focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="">Seleccionar Ubicación...</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Estado */}
            <div>
              <label htmlFor="status" className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                Estado Actual
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white text-sm outline-none transition-all shadow-inner focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="disponible">Disponible</option>
                <option value="asignado">Asignado</option>
                <option value="en_reparacion">En Reparación</option>
                <option value="baja">Dado de Baja</option>
              </select>
            </div>

            {/* Fecha de compra */}
            <div>
              <label htmlFor="purchaseDate" className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                Fecha de Compra
              </label>
              <input
                id="purchaseDate"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white text-sm outline-none transition-all shadow-inner focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          {/* Notas */}
          <div className="mt-6">
            <label htmlFor="notes" className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
              Observaciones / Notas
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white text-sm outline-none transition-all shadow-inner focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </GlassCard>

        {/* Botones de acción */}
        <div className="pt-4 flex justify-end space-x-4">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 rounded-xl font-bold text-sm text-white bg-blue-600/90 hover:bg-blue-600 shadow-lg shadow-blue-500/30 backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {isSaving ? "Actualizando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}

// Iconos SVG
function CameraIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574v9.176A2.25 2.25 0 004.5 21h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
    </svg>
  );
}

function ExclamationTriangleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}