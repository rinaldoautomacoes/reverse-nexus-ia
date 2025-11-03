import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { TablesInsert, Tables } from "@/integrations/supabase/types_generated";
import type { ItemData } from "@/components/coleta-form-sections/ColetaItemRow"; // Import ItemData

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateUniqueNumber(prefix: string = 'LR') {
  const timestamp = Date.now().toString(36); // Base 36 para ser mais compacto
  const random = Math.random().toString(36).substring(2, 7); // 5 caracteres aleatórios
  return `${prefix}-${timestamp}-${random}`.toUpperCase();
}

// Helper function to format items for the 'modelo_aparelho' field in 'coletas' table
export const formatItemsForColetaModeloAparelho = (items: ItemData[] | TablesInsert<'items'>[] | Tables<'items'>[] | null) => {
  if (!items || items.length === 0) return null;
  const summary = items.map(item => `${item.quantity || 0}x ${('name' in item ? item.name : item.modelo_aparelho) || 'N/A'}`).join(', ');
  return summary.length > 255 ? summary.substring(0, 252) + '...' : summary; // Ensure it fits in a TEXT field
};

// Helper function to get total quantity of items
export const getTotalQuantityOfItems = (items: Array<{ quantity: number | null }> | null) => {
  return items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
};

// NEW: Helper function to format item descriptions for reports
export const formatItemDescriptionsForColeta = (items: Tables<'items'>[] | null) => {
  if (!items || items.length === 0) return null;
  const descriptions = items.map(item => item.description || 'N/A').filter(Boolean).join(', ');
  return descriptions.length > 255 ? descriptions.substring(0, 252) + '...' : descriptions;
};