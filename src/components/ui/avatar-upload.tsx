import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Camera, Upload, Trash2, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  currentAvatar?: string;
  onUpload?: (file: File) => Promise<string>;
  onDelete?: () => Promise<void>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AvatarUpload({
  currentAvatar,
  onUpload,
  onDelete,
  size = 'md',
  className
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const clearMessages = useCallback(() => {
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 5000);
  }, []);

  const validateFile = (file: File): string | null => {
    const maxSize = 2 * 1024 * 1024; // 2MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Please use JPG, PNG, or WebP.';
    }

    if (file.size > maxSize) {
      return 'File too large. Maximum size is 2MB.';
    }

    return null;
  };

  const handleFileUpload = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      clearMessages();
      return;
    }

    if (!onUpload) {
      setError('Upload handler not configured');
      clearMessages();
      return;
    }

    try {
      setUploading(true);
      setProgress(0);
      setError(null);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const result = await onUpload(file);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setSuccess('Avatar uploaded successfully!');
      clearMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      clearMessages();
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    try {
      setUploading(true);
      await onDelete();
      setSuccess('Avatar deleted successfully!');
      clearMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      clearMessages();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn('space-y-4', className)} data-testid="avatar-upload-container">
      <div className="flex flex-col items-center space-y-4">
        {/* Avatar Display */}
        <motion.div
          className={cn('relative', sizeClasses[size])}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Avatar className="w-full h-full">
            <AvatarImage src={currentAvatar} alt="User avatar" />
            <AvatarFallback>
              <User className="w-1/2 h-1/2" />
            </AvatarFallback>
          </Avatar>
          
          {currentAvatar && !uploading && (
            <Button
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
              onClick={handleDelete}
              data-testid="delete-avatar-button"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </motion.div>

        {/* Upload Area */}
        <motion.div
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
            dragActive 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-300 hover:border-gray-400',
            uploading && 'pointer-events-none opacity-50'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            data-testid="avatar-file-input"
            disabled={uploading}
          />

          <div className="space-y-2">
            <Upload className="w-8 h-8 mx-auto text-gray-400" />
            <div>
              <p className="text-sm font-medium">Drag and drop or click to upload.</p>
              <p className="text-xs text-gray-500">JPG, PNG or WebP. Max 2MB.</p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            data-testid="upload-file-button"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
          
          <Button
            variant="outline"
            className="md:hidden"
            onClick={() => {
              // Mobile camera capture
              if (fileInputRef.current) {
                fileInputRef.current.setAttribute('capture', 'user');
                fileInputRef.current.click();
              }
            }}
            disabled={uploading}
            data-testid="upload-camera-button"
          >
            <Camera className="w-4 h-4 mr-2" />
            Camera
          </Button>
        </div>

        {/* Progress Bar */}
        {uploading && progress > 0 && (
          <div className="w-full" data-testid="upload-progress">
            <Progress value={progress} className="w-full" />
            <p className="text-xs text-center mt-1 text-gray-500">
              Uploading... {progress}%
            </p>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <Alert className="w-full" data-testid="avatar-success-alert">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="w-full" data-testid="avatar-error-alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
} 