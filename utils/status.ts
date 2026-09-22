export type AssetStatus = "disponible" | "asignado" | "en_reparacion" | "baja";

interface StatusStyle {
  label: string;
  badgeClass: string;
  iconClass: string;
}

export const statusStyles: Record<AssetStatus, StatusStyle> = {
  disponible: {
    label: "Disponible",
    badgeClass: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30",
    iconClass: "text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20",
  },
  asignado: {
    label: "Asignado",
    badgeClass: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30",
    iconClass: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
  en_reparacion: {
    label: "En Reparación",
    badgeClass: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30",
    iconClass: "text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20",
  },
  baja: {
    label: "Dado de Baja",
    badgeClass: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30",
    iconClass: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20",
  },
};

/**
 * Función auxiliar para obtener el estilo de manera segura.
 * Si el estado no existe en el diccionario, devuelve un estilo por defecto (gris).
 */
export function getStatusStyle(status: string | null | undefined): StatusStyle {
  const defaultStyle: StatusStyle = {
    label: "Desconocido",
    badgeClass: "bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/30",
    iconClass: "text-gray-600 dark:text-gray-400 bg-gray-500/10 border-gray-500/20",
  };

  if (!status) return defaultStyle;
  
  return statusStyles[status as AssetStatus] || defaultStyle;
}