import { supabase } from '@/lib/supabase';

/**
 * Video URL validation result
 */
interface VideoValidationResult {
  valid: boolean;
  error?: string;
  accessible?: boolean;
  warning?: string;
}

/**
 * Video Upload Service
 * Handles video URL validation and optional video file uploads to Supabase Storage
 * 
 * Videos are treated differently from images because:
 * - Video files are typically much larger and require more storage
 * - Video URLs often come from external sources (YouTube, Vimeo, CDN)
 * - Video accessibility validation requires different checks than images
 * - Video content may need special handling for streaming/quality
 */
export class VideoUploadService {
  private static bucketName = 'product-videos';

  /**
   * Validate video URL format and accessibility
   */
  static async validateVideoUrl(url: string, checkAccessibility: boolean = true): Promise<VideoValidationResult> {
    // Basic URL format validation
    if (!url || typeof url !== 'string') {
      return { valid: false, error: 'Invalid URL provided' };
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }

    // Protocol validation (only allow http/https)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed' };
    }

    // Hostname validation (basic check)
    if (!parsedUrl.hostname || parsedUrl.hostname.length < 4) {
      return { valid: false, error: 'Invalid hostname in URL' };
    }

    // Video extension validation
    const pathname = parsedUrl.pathname.toLowerCase();
    const validVideoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv'];

    const hasValidExtension = validVideoExtensions.some(ext => pathname.endsWith(ext));
    
    // If no extension found, check if it's a known video service
    const knownVideoServices = [
      'youtube.com', 'youtu.be', 'vimeo.com', 'dailymotion.com',
      'wistia.com', 'twitch.tv', 'facebook.com', 'instagram.com'
    ];
    
    const isKnownVideoService = knownVideoServices.some(service => 
      parsedUrl.hostname.toLowerCase() === service || 
      parsedUrl.hostname.toLowerCase().endsWith('.' + service)
    );

    if (!hasValidExtension && !isKnownVideoService) {
      return { 
        valid: false, 
        error: 'URL must point to a valid video file or recognized video platform' 
      };
    }

    // Check accessibility if requested
    if (checkAccessibility) {
      try {
        const response = await fetch(url, { 
          method: 'HEAD',
          mode: 'cors'
        });
        
        if (!response.ok) {
          return { 
            valid: false, 
            error: `Video URL returned HTTP status: ${response.status}` 
          };
        }
      } catch (error) {
        // Network error or CORS issue
        if (error instanceof TypeError && error.message.includes('CORS')) {
          // CORS error doesn't necessarily mean the URL is invalid
          return { 
            valid: true, 
            accessible: false, 
            warning: 'Could not verify video accessibility due to CORS policy. Video may still be valid.' 
          };
        }
        return { 
          valid: false, 
          error: 'Video URL is not accessible. Please check the URL and ensure it is publicly available.' 
        };
      }
    }

    return { valid: true, accessible: checkAccessibility };
  }

  /**
   * Validate multiple video URLs
   */
  static async validateVideoUrls(urls: string[], checkAccessibility: boolean = true): Promise<{
    valid: string[];
    invalid: Array<{ url: string; error: string }>;
    warnings: Array<{ url: string; warning: string }>;
  }> {
    const validationPromises = urls.map(async (url) => {
      const result = await this.validateVideoUrl(url, checkAccessibility);
      return { url, result };
    });

    const results = await Promise.all(validationPromises);
    
    const valid: string[] = [];
    const invalid: Array<{ url: string; error: string }> = [];
    const warnings: Array<{ url: string; warning: string }> = [];

    results.forEach(({ url, result }) => {
      if (result.valid) {
        valid.push(url);
        if (result.warning) {
          warnings.push({ url, warning: result.warning });
        }
      } else {
        invalid.push({ url, error: result.error || 'Unknown validation error' });
      }
    });

    return { valid, invalid, warnings };
  }

  /**
   * Upload a single video file (optional - for local video uploads)
   */
  static async uploadVideo(file: File, productId?: string): Promise<string> {
    try {
      // Validate file input
      if (!file || !file.name) {
        throw new Error('Invalid file provided');
      }

      // Validate video file
      const validation = this.validateVideoFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Generate unique filename
      const fileName = file.name;
      const lastDotIndex = fileName.lastIndexOf('.');
      const fileExt = lastDotIndex > 0 ? fileName.substring(lastDotIndex + 1) : 'mp4';
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
          throw new Error('Storage bucket not configured. Please contact administrator to set up product-videos bucket in Supabase.');
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
        throw new Error('Failed to get public URL for uploaded video');
      }

      return publicUrl;
    } catch (error) {
      console.error('Video upload error:', error);
      throw error;
    }
  }

  /**
   * Upload multiple video files
   */
  static async uploadVideos(files: File[], productId?: string): Promise<string[]> {
    try {
      const uploadPromises = files.map(file => this.uploadVideo(file, productId));
      const urls = await Promise.all(uploadPromises);
      return urls;
    } catch (error) {
      console.error('Multiple video upload error:', error);
      throw error;
    }
  }

  /**
   * Delete a video
   */
  static async deleteVideo(videoUrl: string): Promise<void> {
    try {
      // Validate input
      if (!videoUrl || typeof videoUrl !== 'string') {
        throw new Error('Invalid video URL provided');
      }

      let filePath: string;

      try {
        // Extract file path from URL
        const url = new URL(videoUrl);
        const pathname = decodeURIComponent(url.pathname);
        filePath = pathname.split('/').pop() || '';
      } catch {
        // If URL parsing fails, try to extract filename directly
        const urlParts = videoUrl.split('/');
        filePath = urlParts[urlParts.length - 1] || '';
      }

      if (!filePath || filePath.trim() === '') {
        throw new Error('Could not extract file path from video URL');
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
      console.error('Video delete error:', error);
      throw error;
    }
  }

  /**
   * Validate video file
   */
  static validateVideoFile(file: File): { valid: boolean; error?: string } {
    // Check file size (50MB limit for videos)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return { valid: false, error: 'Video file size must be less than 50MB' };
    }

    // Check file type
    const allowedTypes = [
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
      'video/x-msvideo', 'video/x-matroska', 'video/x-flv'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Only MP4, WebM, OGG, MOV, AVI, MKV, and FLV videos are allowed' };
    }

    return { valid: true };
  }

  /**
   * Create video preview (for local files)
   */
  static createVideoPreview(file: File): string {
    if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
      throw new Error('Video preview is only available in browser environment');
    }
    
    if (!file) {
      throw new Error('Invalid file provided for preview');
    }

    return URL.createObjectURL(file);
  }

  /**
   * Clean up preview URL
   */
  static revokeVideoPreview(url: string): void {
    if (typeof URL === 'undefined' || typeof URL.revokeObjectURL !== 'function') {
      console.warn('Video preview cleanup is only available in browser environment');
      return;
    }
    
    if (!url) {
      return;
    }

    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      console.warn('Failed to revoke video preview URL:', error);
    }
  }
}