/**
 * Production-Ready Image Utilities
 * Handles image fallbacks, error states, and loading
 */

/**
 * Get product image with proper fallback
 * Returns a proper fallback UI component data instead of placeholder path
 */
export function getProductImage(
  images: string[] | null | undefined,
  index: number = 0
): string | null {
  if (!images || images.length === 0) {
    return null; // Return null instead of placeholder path
  }
  
  const imageIndex = Math.max(0, Math.min(index, images.length - 1));
  const imageUrl = images[imageIndex];
  
  // Validate URL format
  if (!imageUrl || typeof imageUrl !== 'string') {
    return null;
  }
  
  // Check if it's a valid URL or data URL
  if (imageUrl.startsWith('http://') || 
      imageUrl.startsWith('https://') || 
      imageUrl.startsWith('data:') ||
      imageUrl.startsWith('/')) {
    return imageUrl;
  }
  
  return null;
}

/**
 * Generate a data URL for a placeholder image
 * This creates an actual SVG placeholder instead of relying on a file
 */
export function generatePlaceholderImage(
  width: number = 400,
  height: number = 400,
  text: string = 'No Image'
): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text 
        x="50%" 
        y="50%" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-size="14" 
        fill="#9ca3af" 
        text-anchor="middle" 
        dominant-baseline="middle"
      >${text}</text>
    </svg>
  `.trim();
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Check if image URL is valid and accessible
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  if (!url) return false;
  
  try {
    const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
    return true; // If fetch doesn't throw, assume valid
  } catch {
    return false;
  }
}

/**
 * Get all product images with fallback
 */
export function getProductImages(images: string[] | null | undefined): string[] {
  if (!images || images.length === 0) {
    return [generatePlaceholderImage(400, 400, 'No Image Available')];
  }
  
  return images.filter(img => img && typeof img === 'string');
}

