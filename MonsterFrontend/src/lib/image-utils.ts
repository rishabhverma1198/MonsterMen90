import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Image processing utilities
export function resizeImage(file: File, maxWidth: number = 800, maxHeight: number = 600, quality: number = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
      resolve(compressedDataUrl)
    }

    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
    }
    
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

export function validateImageFile(file: File, maxSizeMB: number = 5): { valid: boolean; error?: string } {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  
  if (!isImageFile(file)) {
    return { valid: false, error: 'File must be an image' }
  }
  
  if (file.size > maxSizeBytes) {
    return { valid: false, error: `Image must be less than ${maxSizeMB}MB` }
  }
  
  return { valid: true }
}