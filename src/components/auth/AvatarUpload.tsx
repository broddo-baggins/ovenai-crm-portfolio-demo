import React, { useState, useRef, useCallback } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/ClientAuthContext';
import { AvatarService } from '@/services/avatarService';
import { Upload, Camera, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  onAvatarChange?: (newAvatarUrl: string | null) => void;
  size?: 'sm' | 'md' | 'lg';
  allowDelete?: boolean;
  className?: string;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  onAvatarChange,
  size = 'md',
  allowDelete = true,
  className = ''
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null);

  // Size configurations
  const sizeConfig = {
    sm: { container: 'w-16 h-16', upload: 'w-4 h-4', button: 'px-2 py-1 text-xs' },
    md: { container: 'w-24 h-24', upload: 'w-5 h-5', button: 'px-3 py-2 text-sm' },
    lg: { container: 'w-32 h-32', upload: 'w-6 h-6', button: 'px-4 py-2' }
  };

  const config = sizeConfig[size];

  // Clear messages after delay
  const clearMessages = useCallback(() => {
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 5000);
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setSuccess(null);

    try {
      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await AvatarService.uploadAvatar(file, user, {
        quality: 0.8,
        maxWidth: 400,
        maxHeight: 400
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success && result.publicUrl) {
        setAvatarUrl(result.publicUrl);
        setSuccess(`Avatar uploaded successfully! Size: ${Math.round((result.metadata?.size || 0) / 1024)}KB`);
        onAvatarChange?.(result.publicUrl);
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (error) {
      setError('Upload failed due to network error');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
      clearMessages();
    }
  }, [user, onAvatarChange, clearMessages]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
    // Reset input to allow same file selection
    e.target.value = '';
  }, [handleFileSelect]);

  const handleDelete = useCallback(async () => {
    if (!user || !avatarUrl) return;

    setIsUploading(true);
    setError(null);

    try {
      const result = await AvatarService.deleteAvatar(user.id, avatarUrl);
      
      if (result.success) {
        setAvatarUrl(null);
        setSuccess('Avatar deleted successfully');
        onAvatarChange?.(null);
      } else {
        setError(result.error || 'Delete failed');
      }
    } catch (error) {
      setError('Delete failed due to network error');
    } finally {
      setIsUploading(false);
      clearMessages();
    }
  }, [user, avatarUrl, onAvatarChange, clearMessages]);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const openCamera = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'user');
      fileInputRef.current.click();
      fileInputRef.current.removeAttribute('capture');
    }
  }, []);

  const displayAvatarUrl = avatarUrl || AvatarService.getAvatarUrl(user, avatarUrl || undefined);

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Avatar Display */}
      <div className="relative">
        <motion.div
          className={`relative ${config.container} rounded-full overflow-hidden border-2 ${
            dragActive 
              ? 'border-primary-500 border-dashed' 
              : isUploading 
                ? 'border-blue-500' 
                : 'border-gray-200 dark:border-slate-700'
          } transition-colors`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          data-testid="avatar-upload-container"
        >
          <Avatar className="w-full h-full">
            <AvatarImage 
              src={displayAvatarUrl} 
              alt="User avatar"
              className="object-cover"
            />
            <AvatarFallback className="bg-gray-200 dark:bg-slate-700">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>

          {/* Upload Overlay */}
          <AnimatePresence>
            {dragActive && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-primary-500 bg-opacity-80 flex items-center justify-center"
              >
                <Upload className="w-8 h-8 text-white" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading Overlay */}
          <AnimatePresence>
            {isUploading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
              >
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Upload Progress */}
        <AnimatePresence>
          {isUploading && uploadProgress > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-full"
            >
              <Progress 
                value={uploadProgress} 
                className="h-2 bg-gray-200 dark:bg-slate-700"
                data-testid="upload-progress"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button
          variant="outline"
          size={size === 'sm' ? 'sm' : 'default'}
          onClick={openFileDialog}
          disabled={isUploading}
          className={config.button}
          data-testid="upload-file-button"
        >
          <Upload className={`${config.upload} mr-2`} />
          Upload
        </Button>

        {/* Camera button (mobile) */}
        <Button
          variant="outline"
          size={size === 'sm' ? 'sm' : 'default'}
          onClick={openCamera}
          disabled={isUploading}
          className={`${config.button} md:hidden`}
          data-testid="upload-camera-button"
        >
          <Camera className={`${config.upload} mr-2`} />
          Camera
        </Button>

        {/* Delete button */}
        {allowDelete && avatarUrl && (
          <Button
            variant="outline"
            size={size === 'sm' ? 'sm' : 'default'}
            onClick={handleDelete}
            disabled={isUploading}
            className={`${config.button} text-red-600 hover:text-red-700`}
            data-testid="delete-avatar-button"
          >
            <Trash2 className={`${config.upload} mr-2`} />
            Delete
          </Button>
        )}
      </div>

      {/* Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-sm"
          >
            <Alert variant="destructive" data-testid="avatar-error-alert">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-sm"
          >
            <Alert className="border-green-500 bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300" data-testid="avatar-success-alert">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
        data-testid="avatar-file-input"
      />

      {/* Upload Instructions */}
      <div className="text-center text-sm text-gray-500 dark:text-slate-400 max-w-xs">
        <p>JPG, PNG or WebP. Max 2MB.</p>
        <p>Drag and drop or click to upload.</p>
      </div>
    </div>
  );
};

export default AvatarUpload; 