/**
 * Sanitiza entradas de texto para prevenir ataques XSS (Cross-Site Scripting).
 * Convierte caracteres especiales de HTML en sus entidades correspondientes
 * para evitar que el navegador los interprete como código ejecutable.
 */
export const sanitizeInput = (input: string | null | undefined): string => {
  if (!input) return "";
  
  return input.replace(/[&<>"'/]/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
      "/": "&#x2F;"
    };
    return entities[char] || char;
  }).trim();
};

/**
 * Sanitiza cadenas de texto para ser usadas en búsquedas de Supabase / PostgREST,
 * especialmente dentro de filtros compuestos como .or().
 * Escapa las comas y elimina caracteres que puedan causar errores de sintaxis.
 */
export const sanitizeSearchQuery = (query: string | null | undefined): string => {
  if (!query) return "";
  
  return query
    .trim()
    .replace(/['"%]/g, "") // Previene inyección SQL básica eliminando comillas y comodines
    .replace(/,/g, "\\,"); // Escapa la coma con backslash para que PostgREST no la lea como separador .or()
};