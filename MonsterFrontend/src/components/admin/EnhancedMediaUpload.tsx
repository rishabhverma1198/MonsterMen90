import React, { useState, useRef } from 'react';
import { Upload, X, Image, Video, FileText, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { mediaCompressionService } from '@/lib/services/media-compression.service';
import type { MediaFile, CompressionOptions } from '@/lib/services/media-compression.service';

interface EnhancedMediaUploadProps {
  onFilesUploaded: (files: MediaFile[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  className?: string;
}

interface UploadedFile {
  file: MediaFile;
  status: 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
}

export default function EnhancedMediaUpload({
  onFilesUploaded,
  maxFiles = 10,
  maxSizeMB = 5,
  acceptedTypes = ['image/*', 'video/*'],
  className = ''
}: EnhancedMediaUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  // const [isUploading, setIsUploading] = useState(false); // Not needed for current implementation
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressionOptions: CompressionOptions = {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.8,
    videoQuality: 0.7,
    targetSizeKB: 500
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    
    // Validate file count
    if (uploadedFiles.length + fileArray.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate and process files
    fileArray.forEach((file) => {
      const validation = mediaCompressionService.validateFile(file);
      if (!validation.valid) {
        alert(`File "${file.name}": ${validation.error}`);
        return;
      }

      uploadFile(file);
    });
  };

  const uploadFile = async (file: File) => {
    // const fileId = Date.now() + Math.random(); // Not needed for current implementation
    
    // Add to upload list with uploading status
    const newUploadedFile: UploadedFile = {
      file: {
        file,
        originalSize: file.size,
        compressedSize: 0,
        url: '',
        type: file.type.startsWith('image/') ? 'image' : 'video',
        format: file.type
      },
      status: 'uploading',
      progress: 0
    };

    setUploadedFiles(prev => [...prev, newUploadedFile]);

    try {
      // Compress the file
      const compressedFile = await mediaCompressionService.compressFile(file, compressionOptions);
      
      // Update progress to 100%
      setUploadedFiles(prev => prev.map(f => 
        f.file.file === file 
          ? { ...f, file: compressedFile, status: 'completed', progress: 100 }
          : f
      ));

      // Notify parent component
      const completedFiles = [...uploadedFiles, { ...newUploadedFile, file: compressedFile, status: 'completed', progress: 100 }]
        .filter(f => f.status === 'completed')
        .map(f => f.file);
      
      onFilesUploaded(completedFiles);

    } catch (error) {
      // Handle upload error
      setUploadedFiles(prev => prev.map(f => 
        f.file.file === file 
          ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
          : f
      ));
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setUploadedFiles([]);
    onFilesUploaded([]);
  };

  const formatFileSize = (bytes: number) => {
    return mediaCompressionService.getFileSize(bytes);
  };

  const getFileIcon = (type: 'image' | 'video') => {
    return type === 'image' ? <Image className="w-5 h-5" /> : <Video className="w-5 h-5" />;
  };

  const getCompressionRatio = (original: number, compressed: number) => {
    return mediaCompressionService.getCompressionRatio(original, compressed);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card 
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Upload className={`w-12 h-12 mb-4 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
          <h3 className="text-lg font-semibold mb-2">Upload Images & Videos</h3>
          <p className="text-gray-600 mb-4">
            Drag and drop files here, or click to browse
          </p>
          <p className="text-sm text-gray-500">
            Supports: Images (JPG, PNG, WebP) and Videos (MP4, WebM) • Max {maxSizeMB}MB per file
          </p>
          <Button variant="outline" className="mt-4">
            <Upload className="w-4 h-4 mr-2" />
            Choose Files
          </Button>
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        title="File upload input"
      />

      {/* Upload Progress */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Uploaded Files ({uploadedFiles.length})</h4>
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Clear All
            </Button>
          </div>
          
          <div className="space-y-2">
            {uploadedFiles.map((uploadedFile, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded ${
                      uploadedFile.status === 'completed' ? 'bg-green-100' :
                      uploadedFile.status === 'error' ? 'bg-red-100' : 'bg-blue-100'
                    }`}>
                      {uploadedFile.status === 'completed' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : uploadedFile.status === 'error' ? (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      ) : (
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        {getFileIcon(uploadedFile.file.type)}
                        <span className="font-medium truncate max-w-[200px]">
                          {(uploadedFile.file.file as File).name}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        {uploadedFile.status === 'uploading' && (
                          <span>Compressing...</span>
                        )}
                        {uploadedFile.status === 'completed' && (
                          <span>
                            {formatFileSize(uploadedFile.file.originalSize)} → {formatFileSize(uploadedFile.file.compressedSize)}
                            ({getCompressionRatio(uploadedFile.file.originalSize, uploadedFile.file.compressedSize)}% smaller)
                          </span>
                        )}
                        {uploadedFile.status === 'error' && (
                          <span className="text-red-600">{uploadedFile.error}</span>
                        )}
                      </div>
                      
                      {uploadedFile.status === 'uploading' && (
                        <Progress value={uploadedFile.progress} className="mt-1" />
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={uploadedFile.status === 'uploading'}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* File Preview */}
                {uploadedFile.status === 'completed' && (
                  <div className="mt-2">
                    {uploadedFile.file.type === 'image' ? (
                      <img
                        src={uploadedFile.file.url}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded border"
                      />
                    ) : (
                      <video
                        src={uploadedFile.file.url}
                        className="w-16 h-16 object-cover rounded border"
                        muted
                        preload="metadata"
                      />
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Compression Info */}
      <Alert>
        <FileText className="w-4 h-4" />
        <AlertDescription>
          <strong>Auto-compression enabled:</strong> Images are resized to max 1200x1200px and videos are compressed to optimize loading speed.
        </AlertDescription>
      </Alert>
    </div>
  );
}