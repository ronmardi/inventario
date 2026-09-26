"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Html5Qrcode } from "html5-qrcode";
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
  type?: "warning" | "error" | "info";
}

export default function NuevoActivoPage() {
  const router = useRouter();
  const supabase = createClient();

  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  
  const [assetTag, setAssetTag] = useState("");
  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [status, setStatus] = useState("disponible");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [notes, setNotes] = useState("");
  
  // Estados para imagen, escáner y guardado
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Modal de Alerta Personalizado
  const [alertData, setAlertData] = useState<AlertState | null>(null);
  
  // Referencia para el escáner de html5-qrcode
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    // Inicializar etiqueta de ID de forma segura
    setAssetTag(`EQ-${Math.floor(1000 + Math.random() * 9000)}`);

    async function loadInitialData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("client_id")
        .eq("id", user.id)
        .single();

      if (!profile?.client_id) {
        setAlertData({
          title: "Empresa No Encontrada",
          message: "No se detectó la empresa asociada a este usuario. Serás redirigido.",
          type: "error",
        });
        setTimeout(() => router.push("/dashboard"), 2500);
        return;
      }
      setClientId(profile.client_id);

      const [{ data: cats }, { data: locs }] = await Promise.all([
        supabase.from("categories").select("id, name").order("name"),
        supabase.from("locations").select("id, name").order("name"),
      ]);
      
      if (cats) setCategories(cats);
      if (locs) setLocations(locs);
    }
    
    loadInitialData();
  }, [supabase, router]);

  // Cambiar prefijo según la categoría seleccionada
  const handleCategoryChange = (catId: string) => {
    setCategoryId(catId);
    const selectedCat = categories.find((c) => c.id === catId);
    const catName = selectedCat?.name.toLowerCase() || "";
    
    let prefix = "EQ";
    if (catName.includes("mouse") || catName.includes("periferico") || catName.includes("teclado") || catName.includes("kit")) {
      prefix = "PER";
    } else if (catName.includes("laptop") || catName.includes("notebook")) {
      prefix = "LAP";
    } else if (catName.includes("monitor")) {
      prefix = "MON";
    }

    setAssetTag(`${prefix}-${Math.floor(1000 + Math.random() * 9000)}`);
  };

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

  // Activar escáner de código de barras (Compatible con iOS/Android)
  const startScanner = () => {
    setIsScanning(true);

    // Damos un pequeño retraso para que el modal y el div "reader" se rendericen
    setTimeout(() => {
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 100 }, // Formato rectangular ideal para códigos de barras
        },
        (decodedText) => {
          // Lectura Exitosa
          setSerialNumber(decodedText);
          stopScanner();
        },
        (errorMessage) => {
          // Ignorar errores continuos de lectura mientras busca
        }
      ).catch((err) => {
        // Error crítico (ej. el usuario denegó el permiso)
        setIsScanning(false);
        setAlertData({
          title: "Acceso a Cámara Restringido 📷",
          message: "Asegúrate de dar permisos de cámara al navegador o usa una conexión segura (HTTPS).",
          type: "warning",
        });
      });
    }, 100);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        scannerRef.current?.clear();
        scannerRef.current = null;
      }).catch(console.error);
    }
    setIsScanning(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId) {
      setAlertData({
        title: "Error de Sesión",
        message: "Falta el ID del cliente. Por favor recarga la página.",
        type: "error",
      });
      return;
    }
    
    setIsSaving(true);

    try {
      let finalImageUrl = null;

      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${clientId}-${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("assets")
          .upload(fileName, imageFile, { upsert: true });

        if (uploadError) throw uploadError;

        if (uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from("assets")
            .getPublicUrl(fileName);
          finalImageUrl = publicUrlData.publicUrl;
        }
      }

      // P3.18: Inserción sanitizada contra XSS
      const { error: insertError } = await supabase.from("assets").insert({
        client_id: clientId,
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
      });

      if (insertError) throw insertError;

      router.push("/dashboard/activos");
      router.refresh();
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Ocurrió un error inesperado al guardar el activo.";
      setAlertData({
        title: "Error al Guardar Activo ⚠️",
        message: errorMessage,
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* MODAL DE ALERTA PERSONALIZADO */}
      {alertData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 dark:bg-black/70 backdrop-blur-md transition-all animate-fade-in">
          <div className="w-full max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-3xl border border-white/80 dark:border-gray-700/60 p-6 shadow-2xl space-y-4 text-center">
            
            <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border shadow-sm ${
              alertData.type === "error" 
                ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400" 
                : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
            }`}>
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
                onClick={() => setAlertData(null)}
                className="w-full py-3 rounded-xl font-bold text-sm text-white bg-blue-600/90 hover:bg-blue-600 shadow-md shadow-blue-500/20 backdrop-blur-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DEL ESCÁNER DE CÓDIGO DE BARRAS */}
      {isScanning && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md bg-gray-900 rounded-3xl overflow-hidden border border-gray-700 p-4 text-center shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-2">
              Escaneando Número de Serie
            </h3>
            <p className="text-xs text-gray-400 mb-4">Apunta con la cámara al código de barras o QR del producto</p>
            
            {/* Contenedor donde html5-qrcode inyectará el video */}
            <div id="reader" className="w-full bg-black rounded-2xl overflow-hidden border border-gray-700 mb-4"></div>
            
            <button
              onClick={() => stopScanner()}
              className="mt-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-lg"
            >
              Cancelar Escaneo
            </button>
          </div>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex items-center justify-between p-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-gray-700/50 shadow-sm transition-all">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white sm:text-3xl">
            Registrar Activo / Periférico 📦
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Añade desde laptops hasta mouses o accesorios de trabajo.
          </p>
        </div>
        <Link
          href="/dashboard/activos"
          className="px-4 py-2.5 rounded-xl font-bold text-sm text-gray-700 dark:text-gray-200 bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 backdrop-blur-sm transition-all"
        >
          Volver
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Fotografía del Equipo */}
        <GlassCard title="Fotografía del Producto / Caja">
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
                Cargar Foto
                <input 
                  id="imageUpload"
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageChange} 
                />
              </label>
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
                onChange={(e) => {
                  typeof handleCategoryChange !== 'undefined' ? handleCategoryChange(e.target.value) : setCategoryId(e.target.value);
                }}
                className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 text-sm outline-none transition-all shadow-inner"
              >
                <option value="">Seleccionar Categoría...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
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
                placeholder="Ej. Mouse Inalámbrico HP"
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
                placeholder="Ej. Logitech MX Master 3S"
                className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white text-sm outline-none transition-all shadow-inner focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            {/* Número de Serie */}
            <div>
              <label htmlFor="serialNumber" className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                Número de Serie (S/N)
              </label>
              <div className="flex space-x-2">
                <input
                  id="serialNumber"
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="Ej. S/N de fábrica"
                  className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white font-mono text-sm outline-none transition-all shadow-inner focus:ring-2 focus:ring-blue-500/50"
                />
                {typeof startScanner !== 'undefined' && (
                  <button
                    type="button"
                    onClick={startScanner}
                    title="Escanear Código de Barras"
                    className="px-3.5 py-3 bg-blue-600/90 hover:bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20 backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center shrink-0"
                  >
                    <BarcodeScanIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
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
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>

            {/* Estado */}
            <div>
              <label htmlFor="status" className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                Estado
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
          <Link
            href="/dashboard/activos"
            className="px-6 py-3 rounded-xl font-bold text-sm text-gray-700 dark:text-gray-300 bg-gray-200/60 dark:bg-gray-800/60 hover:bg-gray-300 dark:hover:bg-gray-700 transition-all"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 rounded-xl font-bold text-sm text-white bg-blue-600/90 hover:bg-blue-600 shadow-lg shadow-blue-500/30 backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {isSaving ? "Guardando..." : "Guardar Activo"}
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

function BarcodeScanIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5zM15 15h3m-3 3h3m-6-3h.008v.008H12V15zm0 3h.008v.008H12V18z" />
    </svg>
  );
}

function ExclamationTriangleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 24 24" strokeWidth={1.8} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}