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