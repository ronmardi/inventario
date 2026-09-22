"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function NuevoActivoPage() {
  const router = useRouter();
  const supabase = createClient();

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  
  const [assetTag, setAssetTag] = useState(`EQ-${Math.floor(1000 + Math.random() * 9000)}`);
  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [status, setStatus] = useState("disponible");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [notes, setNotes] = useState("");
  
  // Estados para imagen y escáner
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanTargetField, setScanTargetField] = useState<"serial" | "tag">("serial");
  const [isSaving, setIsSaving] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    async function loadInitialData() {
      const [{ data: cats }, { data: locs }] = await Promise.all([
        supabase.from("categories").select("id, name").order("name"),
        supabase.from("locations").select("id, name").order("name"),
      ]);
      if (cats) setCategories(cats);
      if (locs) setLocations(locs);
    }
    loadInitialData();
  }, [supabase]);

  // Cambiar prefijo según la categoría seleccionada
  const handleCategoryChange = (catId: string) => {
    setCategoryId(catId);
    const selectedCat = categories.find((c) => c.id === catId);
    const catName = selectedCat?.name.toLowerCase() || "";
    
    let prefix = "EQ";
    if (catName.includes("mouse") || catName.includes("periferico") || catName.includes("teclado")) {
      prefix = "PER";
    } else if (catName.includes("laptop") || catName.includes("notebook")) {
      prefix = "LAP";
    } else if (catName.includes("monitor")) {
      prefix = "MON";
    }

    setAssetTag(`${prefix}-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  // Manejo de carga de imágenes
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Activar escáner de código de barras
  const startScanner = async (target: "serial" | "tag") => {
    setScanTargetField(target);
    setIsScanning(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Si el navegador soporta el BarcodeDetector nativo
      if ("BarcodeDetector" in window) {
        // @ts-ignore
        const barcodeDetector = new window.BarcodeDetector({
          formats: ["code_128", "code_39", "ean_13", "qr_code", "data_matrix"],
        });

        const interval = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === 4) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const scannedValue = barcodes[0].rawValue;
                if (target === "serial") setSerialNumber(scannedValue);
                if (target === "tag") setAssetTag(scannedValue);
                
                stopScanner(stream, interval);
              }
            } catch (err) {
              console.error(err);
            }
          }
        }, 500);
      }
    } catch (err) {
      alert("No se pudo acceder a la cámara o el navegador no soporta el detector nativo.");
      setIsScanning(false);
    }
  };

  const stopScanner = (stream?: MediaStream, interval?: NodeJS.Timeout) => {
    if (interval) clearInterval(interval);
    if (videoRef.current && videoRef.current.srcObject) {
      const activeStream = videoRef.current.srcObject as MediaStream;
      activeStream.getTracks().forEach((track) => track.stop());
    }
    setIsScanning(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("client_id")
      .eq("id", user.id)
      .single();

    if (!profile?.client_id) return;

    const { error } = await supabase.from("assets").insert({
      client_id: profile.client_id,
      asset_tag: assetTag,
      name,
      model: model || null,
      serial_number: serialNumber || null,
      category_id: categoryId || null,
      location_id: locationId || null,
      status,
      purchase_date: purchaseDate || null,
      notes,
    });

    if (error) {
      alert("Error al guardar el activo: " + error.message);
      setIsSaving(false);
      return;
    }

    router.push("/dashboard/activos");
    router.refresh();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Modal del Escáner de Código de Barras */}
      {isScanning && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md bg-gray-900 rounded-3xl overflow-hidden border border-gray-700 p-4 text-center">
            <h3 className="text-white font-bold text-lg mb-2">
              Escaneando {scanTargetField === "serial" ? "Número de Serie" : "Etiqueta"}
            </h3>
            <p className="text-xs text-gray-400 mb-4">Apunta con la cámara al código de barras o QR en el producto o caja</p>
            <video ref={videoRef} autoPlay playsInline className="w-full h-64 object-cover rounded-2xl border border-gray-700" />
            <button
              onClick={() => stopScanner()}
              className="mt-4 px-6 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-500 transition-all"
            >
              Cancelar Escaneo
            </button>
          </div>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex items-center justify-between p-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-gray-700/50 shadow-sm">
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

      {/* Formulario Liquid Glass */}
      <form onSubmit={handleSubmit} className="p-8 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-gray-700/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] space-y-6">
        
        {/* Subida de Fotografía del Equipo */}
        <div>
          <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
            Fotografía del Producto / Caja
          </label>
          <div className="flex items-center space-x-6">
            <div className="h-28 w-28 rounded-2xl bg-white/60 dark:bg-gray-800/60 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden shadow-inner">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl">📷</span>
              )}
            </div>
            <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-white/60 dark:border-gray-600/60 text-sm font-bold text-gray-800 dark:text-gray-200 shadow-sm hover:bg-white transition-all">
              Cargar Foto
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Selector de Categoría PRIMERO para adaptar el prefijo */}
          <div>
            <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
              Categoría
            </label>
            <select
              value={categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 text-sm outline-none"
            >
              <option value="">Seleccionar Categoría...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Etiqueta ID */}
          <div>
            <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
              Etiqueta ID / Código
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={assetTag}
                onChange={(e) => setAssetTag(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 font-mono font-bold text-blue-600 dark:text-blue-400 text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => startScanner("tag")}
                title="Escanear Código de Barras"
                className="px-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all flex items-center justify-center"
              >
                📷
              </button>
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
              Nombre Corto *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ej. Mouse Inalámbrico HP / Notebook Dell"
              className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white text-sm outline-none"
            />
          </div>

          {/* Modelo */}
          <div>
            <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
              Marca / Modelo
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Ej. Logitech MX Master 3S"
              className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white text-sm outline-none"
            />
          </div>

          {/* Número de Serie + Escáner directo */}
          <div>
            <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
              Número de Serie (S/N)
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="Ej. S/N grabado en la caja o producto"
                className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white font-mono text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => startScanner("serial")}
                title="Escanear Código de Barras de la caja"
                className="px-3 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-all flex items-center justify-center"
              >
                📷
              </button>
            </div>
          </div>

          {/* Ubicación */}
          <div>
            <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
              Ubicación Física
            </label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white text-sm outline-none"
            >
              <option value="">Seleccionar Ubicación...</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
              Estado Inicial
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white text-sm outline-none"
            >
              <option value="disponible">Disponible</option>
              <option value="asignado">Asignado</option>
              <option value="en_reparacion">En Reparación</option>
              <option value="baja">Dado de Baja</option>
            </select>
          </div>

          {/* Fecha de compra */}
          <div>
            <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
              Fecha de Compra
            </label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white text-sm outline-none"
            />
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
            Observaciones / Notas
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Detalles sobre garantía, estado del cable, o si viene en kit..."
            className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/50 dark:border-gray-600/50 text-gray-900 dark:text-white text-sm outline-none"
          />
        </div>

        {/* Botones */}
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