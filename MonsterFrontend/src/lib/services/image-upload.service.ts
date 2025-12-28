import { supabase } from '@/lib/supabase';

/**
 * Image Upload Service
 * Handles product image uploads to Supabase Storage
 */
export class ImageUploadService {
  private static bucketName = 'product-images';

  /**
   * Upload a single image file
   */
  static async uploadImage(file: File, productId?: string): Promise<string> {
    try {
      // Validate file input
      if (!file || !file.name) {
        throw new Error('Invalid file provided');
      }

      // Generate unique filename with proper extension handling
      const fileName = file.name;
      const lastDotIndex = fileName.lastIndexOf('.');
      const fileExt = lastDotIndex > 0 ? fileName.substring(lastDotIndex + 1) : 'jpg';
      const baseName = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
      const cleanBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
      const uniqueFileName = `${productId || 'temp'}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${cleanBaseName}.${fileExt}`;
      const filePath = uniqueFileName;

      // Upload file to Supabase Storage
      const { data: uploadData, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        if (error.message.includes('Bucket not found')) {
          throw new Error('Storage bucket not configured. Please contact administrator to set up product-images bucket in Supabase.');
        }
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Validate that upload was successful
      if (!uploadData) {
        throw new Error('Upload failed: No data returned from storage');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error('Failed to get public URL for uploaded image');
      }

      return publicUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  }

  /**
   * Upload multiple images
   */
  static async uploadImages(files: File[], productId?: string): Promise<string[]> {
    try {
      const uploadPromises = files.map(file => this.uploadImage(file, productId));
      const urls = await Promise.all(uploadPromises);
      return urls;
    } catch (error) {
      console.error('Multiple image upload error:', error);
      throw error;
    }
  }

  /**
   * Delete an image
   */
  static async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Validate input
      if (!imageUrl || typeof imageUrl !== 'string') {
        throw new Error('Invalid image URL provided');
      }

      let filePath: string;

      try {
        // Extract file path from URL
        const url = new URL(imageUrl);
        // Handle different URL formats and encoding
        const pathname = decodeURIComponent(url.pathname);
        filePath = pathname.split('/').pop() || '';
      } catch {
        // If URL parsing fails, try to extract filename directly
        const urlParts = imageUrl.split('/');
        filePath = urlParts[urlParts.length - 1] || '';
      }

      if (!filePath || filePath.trim() === '') {
        throw new Error('Could not extract file path from image URL');
      }

      // Clean the file path
      filePath = filePath.split('?')[0]; // Remove query parameters
      filePath = filePath.split('#')[0]; // Remove hash fragments

      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Image delete error:', error);
      throw error;
    }
  }

  /**
   * Validate image file
   */
  static validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 5MB' };
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
    }

    return { valid: true };
  }

  /**
   * Resize image before upload (optional)
   */
  static async resizeImage(file: File, maxWidth: number = 800, maxHeight: number = 800): Promise<File> {
    // Check if running in browser environment
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      throw new Error('Image resizing is only available in browser environment');
    }

    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        const img = new Image();

        img.onload = () => {
          try {
            // Calculate new dimensions
            let { width, height } = img;
            
            if (width > height) {
              if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
              }
            } else {
              if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
              }
            }

            // Ensure minimum dimensions
            width = Math.max(width, 1);
            height = Math.max(height, 1);

            // Set canvas dimensions
            canvas.width = Math.floor(width);
            canvas.height = Math.floor(height);

            // Draw and compress
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            canvas.toBlob((blob) => {
              if (blob) {
                const resizedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now()
                });
                resolve(resizedFile);
              } else {
                resolve(file);
              }
            }, file.type, 0.8);
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => {
          reject(new Error('Failed to load image for resizing'));
        };

        img.src = URL.createObjectURL(file);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Create image preview URL
   */
  static createImagePreview(file: File): string {
    // Check if running in browser environment
    if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
      throw new Error('Image preview is only available in browser environment');
    }
    
    if (!file) {
      throw new Error('Invalid file provided for preview');
    }

    return URL.createObjectURL(file);
  }

  /**
   * Clean up preview URL
   */
  static revokeImagePreview(url: string): void {
    // Check if running in browser environment
    if (typeof URL === 'undefined' || typeof URL.revokeObjectURL !== 'function') {
      console.warn('Image preview cleanup is only available in browser environment');
      return;
    }
    
    if (!url) {
      return;
    }

    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      console.warn('Failed to revoke image preview URL:', error);
    }
  }
}