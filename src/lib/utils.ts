import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { TablesInsert, Tables } from "@/integrations/supabase/types_generated";
import type { ItemData } from "@/components/shared-form-sections/ItemRow";

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

// NEW: Helper function to format duration from seconds to human-readable string
export function formatDuration(seconds: number): string {
  if (seconds === 0) return "0 min";
  if (seconds < 60) return `${Math.round(seconds)} seg`;

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) {
    return `${hours} h ${remainingMinutes > 0 ? `${remainingMinutes} min` : ''}`.trim();
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days} dias ${remainingHours > 0 ? `${remainingHours} h` : ''}`.trim();
}