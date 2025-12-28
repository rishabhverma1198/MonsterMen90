import type { MediaFile } from './media-compression.service';

// Extend Window interface to include Google API types
declare global {
  interface Window {
    google?: {
      picker?: {
        PickerBuilder: new () => any;
        DocsView: new () => any;
        DocsViewMode: {
          LIST: string;
          GRID: string;
        };
        Feature: {
          NAV_HIDDEN: string;
          MULTISELECT_ENABLED: string;
        };
        Action: {
          PICKED: string;
          CANCEL: string;
        };
      };
    };
    gapi?: {
      load: (name: string, callback: () => void) => void;
    };
  }
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  webContentLink: string;
  thumbnailLink?: string;
}

export interface GoogleDriveService {
  initialize: () => Promise<void>;
  pickFiles: (options?: {
    maxFiles?: number;
    mimeTypes?: string[];
    multiple?: boolean;
  }) => Promise<GoogleDriveFile[]>;
  downloadFile: (file: GoogleDriveFile) => Promise<File>;
  convertToMediaFile: (driveFile: GoogleDriveFile, downloadedFile: File) => Promise<MediaFile>;
  uploadFromGoogleDrive: (options?: {
    maxFiles?: number;
    mimeTypes?: string[];
    multiple?: boolean;
  }) => Promise<MediaFile[]>;
}

export class GoogleDriveServiceImpl implements GoogleDriveService {
  private isInitialized = false;
  private pickerApiLoaded = false;
  private gapiLoaded = false;

  constructor() {
    // Check if Google API script is already loaded
    this.checkGoogleApiLoaded();
  }

  private checkGoogleApiLoaded(): void {
    // Check if Google API is already loaded in the window object
    if (typeof window !== 'undefined' && window.google) {
      this.gapiLoaded = true;
      if (window.google.picker) {
        this.pickerApiLoaded = true;
      }
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Google Drive service already initialized');
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        // Load Google API script if not already loaded
        if (!this.gapiLoaded) {
          this.loadGoogleApiScript();
        }

        // Wait for both APIs to be ready
        const checkReady = () => {
          if (this.gapiLoaded && this.pickerApiLoaded) {
            this.isInitialized = true;
            console.log('Google Drive service initialized successfully');
            resolve();
          } else {
            setTimeout(checkReady, 100);
          }
        };

        checkReady();
      } catch (error) {
        console.error('Failed to initialize Google Drive service:', error);
        reject(error);
      }
    });
  }

  private loadGoogleApiScript(): void {
    if (typeof window === 'undefined') {
      console.error('Google Drive service can only be used in browser environment');
      return;
    }

    // Check if script is already being loaded
    if (document.getElementById('google-api-script')) {
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-api-script';
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      this.gapiLoaded = true;
      this.loadGooglePickerApi();
    };
    script.onerror = (error) => {
      console.error('Failed to load Google API script:', error);
    };

    document.head.appendChild(script);
  }

  private loadGooglePickerApi(): void {
    if (typeof window === 'undefined' || !window.gapi) {
      console.error('Google API not available');
      return;
    }

    // Load the Google Picker API
    (window.gapi as any).load('picker', () => {
      this.pickerApiLoaded = true;
      console.log('Google Picker API loaded');
    });
  }

  async pickFiles(options: { 
    maxFiles?: number; 
    mimeTypes?: string[]; 
    multiple?: boolean; 
  } = {}): Promise<GoogleDriveFile[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      try {
        if (typeof window === 'undefined' || !window.google || !window.google.picker) {
          throw new Error('Google Picker API not available');
        }

        const { maxFiles = 10, mimeTypes = ['image/*', 'video/*'], multiple = true } = options;

        // Create the picker
        const picker = new window.google.picker.PickerBuilder()
          .addView(new window.google.picker.DocsView()
            .setIncludeFolders(false)
            .setMimeTypes(mimeTypes.join(','))
            .setSelectFolderEnabled(false)
            .setMode(multiple ? window.google.picker.DocsViewMode.LIST : window.google.picker.DocsViewMode.GRID))
          .setOAuthToken('YOUR_OAUTH_TOKEN') // This would need to be replaced with actual OAuth token
          .setDeveloperKey('YOUR_DEVELOPER_KEY') // This would need to be replaced with actual developer key
          .setCallback((data: any) => {
            if (data.action === window.google?.picker?.Action.PICKED) {
              const files: GoogleDriveFile[] = data.docs.map((doc: any) => ({
                id: doc.id,
                name: doc.name,
                mimeType: doc.mimeType,
                size: doc.sizeBytes || 0,
                webContentLink: doc.downloadUrl || doc.url,
                thumbnailLink: doc.thumbnailUrl
              }));
              
              // Limit to maxFiles if specified
              const limitedFiles = maxFiles > 0 ? files.slice(0, maxFiles) : files;
              resolve(limitedFiles);
            } else if (data.action === window.google?.picker?.Action.CANCEL) {
              resolve([]);
            }
          })
          .setOrigin(window.location.origin)
          .setTitle('Select files from Google Drive')
          .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
          .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
          .build();

        // Show the picker
        picker.setVisible(true);
      } catch (error) {
        console.error('Failed to create Google Drive picker:', error);
        reject(error);
      }
    });
  }

  async downloadFile(file: GoogleDriveFile): Promise<File> {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(file.webContentLink, {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer YOUR_OAUTH_TOKEN', // This would need to be replaced with actual OAuth token
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        const downloadedFile = new File([blob], file.name, { 
          type: file.mimeType, 
          lastModified: Date.now() 
        });

        resolve(downloadedFile);
      } catch (error) {
        console.error('Failed to download Google Drive file:', error);
        reject(error);
      }
    });
  }

  async convertToMediaFile(driveFile: GoogleDriveFile, downloadedFile: File): Promise<MediaFile> {
    return {
      file: downloadedFile,
      originalSize: driveFile.size,
      compressedSize: 0, // Will be set after compression
      url: URL.createObjectURL(downloadedFile),
      type: driveFile.mimeType.startsWith('image/') ? 'image' : 'video',
      format: driveFile.mimeType
    };
  }

  async uploadFromGoogleDrive(options: { 
    maxFiles?: number; 
    mimeTypes?: string[]; 
    multiple?: boolean; 
  } = {}): Promise<MediaFile[]> {
    try {
      // Pick files from Google Drive
      const driveFiles = await this.pickFiles(options);
      
      if (driveFiles.length === 0) {
        return [];
      }

      // Download and convert each file
      const mediaFiles: MediaFile[] = [];
      for (const driveFile of driveFiles) {
        try {
          const downloadedFile = await this.downloadFile(driveFile);
          const mediaFile = await this.convertToMediaFile(driveFile, downloadedFile);
          mediaFiles.push(mediaFile);
        } catch (error) {
          console.error(`Failed to process file ${driveFile.name}:`, error);
          // Continue with other files even if one fails
        }
      }

      return mediaFiles;
    } catch (error) {
      console.error('Failed to upload from Google Drive:', error);
      throw error;
    }
  }
}

// Singleton instance
let googleDriveServiceInstance: GoogleDriveServiceImpl | null = null;

export function getGoogleDriveService(): GoogleDriveService {
  if (!googleDriveServiceInstance) {
    googleDriveServiceInstance = new GoogleDriveServiceImpl();
  }
  return googleDriveServiceInstance;
}

// Export as default for easier import
export const googleDriveService = getGoogleDriveService();