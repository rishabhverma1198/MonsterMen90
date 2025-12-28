/**
 * Media Compression Service
 * Handles image and video compression for optimal website performance
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  videoQuality?: number;
  targetSizeKB?: number;
}

export interface MediaFile {
  file: File | Blob;
  originalSize: number;
  compressedSize: number;
  url: string;
  type: 'image' | 'video';
  format: string;
}

class MediaCompressionService {
  private readonly MAX_IMAGE_SIZE = 1024 * 1024; // 1MB
  private readonly MAX_VIDEO_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  private readonly VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];

  /**
   * Compress image file
   */
  async compressImage(file: File, options: CompressionOptions = {}): Promise<MediaFile> {
    const {
      maxWidth = 1200,
      maxHeight = 1200,
      quality = 0.8
    } = options;

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
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

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            const compressedSize = blob.size;
            const originalSize = file.size;
            const url = URL.createObjectURL(blob);

            resolve({
              file: blob,
              originalSize,
              compressedSize,
              url,
              type: 'image',
              format: blob.type
            });
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Compress video file
   */
  async compressVideo(file: File, options: CompressionOptions = {}): Promise<MediaFile> {
    const {
      videoQuality = 0.7
    } = options;

    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');

      video.onloadedmetadata = () => {
        // Set canvas size to video dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // For video compression, we'll create a compressed version
        // Note: This is a simplified approach. For production, consider using FFmpeg.wasm
        const originalSize = file.size;
        
        // Create a compressed version by re-encoding
        this.reencodeVideo(file, videoQuality)
          .then((compressedBlob) => {
            const url = URL.createObjectURL(compressedBlob);
            resolve({
              file: compressedBlob,
              originalSize,
              compressedSize: compressedBlob.size,
              url,
              type: 'video',
              format: compressedBlob.type
            });
          })
          .catch(reject);
      };

      video.onerror = () => reject(new Error('Failed to load video'));
      video.src = URL.createObjectURL(file);
      video.load();
    });
  }

  /**
   * Re-encode video for compression (simplified approach)
   */
  private async reencodeVideo(
    file: File, 
    quality: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Create a simplified compressed version
        // For production, use FFmpeg.wasm for proper video compression
        const stream = canvas.captureStream(30); // 30 FPS
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9',
          videoBitsPerSecond: Math.floor(1024 * 1024 * quality) // Convert quality to bitrate
        });

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            resolve(event.data);
          }
        };

        mediaRecorder.onerror = () => reject(new Error('Video compression failed'));
        mediaRecorder.start();

        // Draw video frames
        video.play();
        const drawFrame = () => {
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0);
          if (!video.paused && !video.ended) {
            requestAnimationFrame(drawFrame);
          } else {
            mediaRecorder.stop();
          }
        };
        drawFrame();
      };

      video.onerror = () => reject(new Error('Failed to load video for compression'));
      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Convert file to base64
   */
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Compress file based on type
   */
  async compressFile(file: File, options: CompressionOptions = {}): Promise<MediaFile> {
    if (this.IMAGE_TYPES.includes(file.type)) {
      return this.compressImage(file, options);
    } else if (this.VIDEO_TYPES.includes(file.type)) {
      return this.compressVideo(file, options);
    } else {
      throw new Error(`Unsupported file type: ${file.type}`);
    }
  }

  /**
   * Validate file size and type
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    if (!this.IMAGE_TYPES.includes(file.type) && !this.VIDEO_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Unsupported file type. Please use: ${[...this.IMAGE_TYPES, ...this.VIDEO_TYPES].join(', ')}`
      };
    }

    const maxSize = this.IMAGE_TYPES.includes(file.type) ? this.MAX_IMAGE_SIZE : this.MAX_VIDEO_SIZE;
    
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return {
        valid: false,
        error: `File too large. Maximum size: ${maxSizeMB}MB`
      };
    }

    return { valid: true };
  }

  /**
   * Get file size in human readable format
   */
  getFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Calculate compression ratio
   */
  getCompressionRatio(original: number, compressed: number): number {
    return Math.round(((original - compressed) / original) * 100);
  }
}

export const mediaCompressionService = new MediaCompressionService();
export default mediaCompressionService;