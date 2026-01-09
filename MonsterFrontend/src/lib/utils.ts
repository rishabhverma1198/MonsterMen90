import clsx, { type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function for conditionally joining CSS class names
 * Tailwind-safe (resolves conflicting classes)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a string into a stable numeric hash
 * Useful for cart item IDs (prevents duplicates)
 */
export function hashStringToNumber(str: string): number {
  if (typeof str !== "string") {
    throw new TypeError("Input must be a string")
  }

  if (!str) return 0

  let hash = 0
  const prime = 31
  const max = Number.MAX_SAFE_INTEGER

  for (let i = 0; i < str.length; i++) {
    hash = Math.floor((hash * prime + str.charCodeAt(i)) % max)
  }

  return Math.abs(hash)
}

/**
 * FNV-1a hash (better distribution, fewer collisions)
 */
export function hashStringToNumberFNV(str: string): number {
  if (typeof str !== "string") {
    throw new TypeError("Input must be a string")
  }

  if (!str) return 0

  let hash = 0x811c9dc5
  const prime = 0x01000193
  const max = Number.MAX_SAFE_INTEGER

  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.floor((hash * prime) % max)
  }

  return Math.abs(hash)
}

/**
 * Generates a unique cart item ID
 * Combines productId + variant + size
 */
export function generateCartItemId(
  productId: string,
  variant?: string | null,
  size?: string | null
): string {
  if (!productId || typeof productId !== "string") {
    throw new Error("productId must be a non-empty string")
  }

  const parts = [
    productId.trim(),
    variant?.trim(),
    size?.trim(),
  ].filter(Boolean) as string[]

  const hash = hashStringToNumberFNV(parts.join("|"))

  return `${parts.join("_")}_${hash}`
}

/**
 * Short readable cart ID (UI / debugging use)
 */
export function generateShortCartItemId(
  productId: string,
  variant?: string | null,
  size?: string | null
): string {
  if (!productId || typeof productId !== "string") {
    throw new Error("productId must be a non-empty string")
  }

  const parts = [
    productId.trim(),
    variant?.trim(),
    size?.trim(),
  ].filter(Boolean) as string[]

  const hash = hashStringToNumber(parts.join("|")) % 10000

  return `${parts.join("_")}_${hash.toString().padStart(4, "0")}`
}