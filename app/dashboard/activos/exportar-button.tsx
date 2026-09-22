"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function ExportarButton() {
  const [isExporting, setIsExporting] = useState(false);
  const supabase = createClient();

  const handleExportCSV = async () => {
    setIsExporting(true);

    try {
      // 1. Consultar todos los activos con relaciones
      const { data: assets, error } = await supabase
        .from("assets")
        .select(`
          asset_tag,
          name,
          model,
          serial_number,
          status,
          purchase_date,
          notes,
          created_at,
          categories ( name ),
          locations ( name )
        `)
        .order("created_at", { ascending: false });

      if (error || !assets) {
        alert("Error al obtener los activos para exportar.");
        setIsExporting(false);
        return;
      }

      // Mapeo de estados a español legible
      const statusLabels: Record<string, string> = {
        disponible: "Disponible",
        asignado: "Asignado",
        en_reparacion: "En Reparación",
        baja: "Dado de Baja",
      };

      // 2. Definir encabezados del archivo CSV
      const headers = [
        "Etiqueta ID",
        "Nombre",
        "Modelo / Marca",
        "Número de Serie",
        "Categoría",
        "Ubicación",
        "Estado",
        "Fecha de Compra",
        "Notas / Garantía",
      ];

      // Sanitizador anti-CSV Injection (previene ejecución de fórmulas en Excel)
      const sanitizeCSV = (value: string | null | undefined): string => {
        if (!value) return '""';
        let sanitized = String(value).replace(/"/g, '""');
        if (/^[=+\-@]/.test(sanitized)) {
          sanitized = "'" + sanitized;
        }
        return `"${sanitized}"`;
      };

      // 3. Mapear cada fila aplicando la sanitización en cada campo
      const rows = assets.map((item) => {
        const categoryName = Array.isArray(item.categories)
          ? item.categories[0]?.name
          : (item.categories as unknown as { name?: string })?.name || "Sin Categoría";

        const locationName = Array.isArray(item.locations)
          ? item.locations[0]?.name
          : (item.locations as unknown as { name?: string })?.name || "Sin Ubicación";

        return [
          sanitizeCSV(item.asset_tag),
          sanitizeCSV(item.name),
          sanitizeCSV(item.model),
          sanitizeCSV(item.serial_number),
          sanitizeCSV(categoryName),
          sanitizeCSV(locationName),
          sanitizeCSV(statusLabels[item.status] || item.status),
          sanitizeCSV(item.purchase_date),
          sanitizeCSV(item.notes),
        ].join(",");
      });

      // 4. Concatenar BOM UTF-8 (\uFEFF) para compatibilidad con Excel
      const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");

      // 5. Crear enlace de descarga en el navegador
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const today = new Date().toISOString().split("T")[0];

      link.setAttribute("href", url);
      link.setAttribute("download", `inventario_activos_${today}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error inesperado al generar el archivo.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExportCSV}
      disabled={isExporting}
      className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-bold text-sm text-gray-800 dark:text-gray-200 bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-sm backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
    >
      <DocumentArrowDownIcon className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
      {isExporting ? "Exportando..." : "Exportar Excel / CSV"}
    </button>
  );
}

function DocumentArrowDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}