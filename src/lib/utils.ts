import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateUniqueNumber(prefix: string = 'LR') {
  const timestamp = Date.now().toString(36); // Base 36 para ser mais compacto
  const random = Math.random().toString(36).substring(2, 7); // 5 caracteres aleatórios
  return `${prefix}-${timestamp}-${random}`.toUpperCase();
}