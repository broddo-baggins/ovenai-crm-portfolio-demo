import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export interface AvatarUploadOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface AvatarUploadResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
  metadata?: {
    size: number;
    type: string;
    dimensions?: { width: number; height: number };
  };
}

export class AvatarService {
  private static readonly MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  private static readonly MAX_UPLOADS_PER_HOUR = 5;
  private static readonly RATE_LIMIT_KEY = 'avatar_upload_count';

  /**
   * Upload avatar with comprehensive validation and security measures
   */
  static async uploadAvatar(
    file: File, 
    user: User, 
    options: AvatarUploadOptions = {}
  ): Promise<AvatarUploadResult> {
    try {
      // 1. Rate limiting check
      const rateLimitCheck = this.checkRateLimit(user.id);
      if (!rateLimitCheck.allowed) {
        return {
          success: false,
          error: `Upload limit exceeded. You can upload ${this.MAX_UPLOADS_PER_HOUR} avatars per hour. Try again later.`
        };
      }

      // 2. File validation
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // 3. Image compression and processing
      const processedFile = await this.processImage(file, options);
      
      // 4. Generate secure file path
      const filePath = this.generateSecureFilePath(user.id, processedFile.type);
      
      // 5. Upload to Supabase Storage
      const uploadResult = await this.uploadToStorage(filePath, processedFile);
      if (!uploadResult.success) {
        return uploadResult;
      }

      // 6. Record upload for rate limiting
      this.recordUpload(user.id);

      // 7. Cleanup old avatar if exists
      await this.cleanupOldAvatar(user.id, filePath);

      return {
        success: true,
        publicUrl: uploadResult.publicUrl,
        metadata: {
          size: processedFile.size,
          type: processedFile.type,
          dimensions: await this.getImageDimensions(processedFile)
        }
      };

    } catch (error) {
      console.error('Avatar upload error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during upload. Please try again.'
      };
    }
  }

  /**
   * Get avatar URL for display (fallback to user's email-based avatar)
   */
  static getAvatarUrl(user: User | null, uploadedUrl?: string): string {
    if (uploadedUrl) {
      return uploadedUrl;
    }
    
    if (user?.email) {
      // Generate a placeholder avatar based on email
      const hash = this.simpleHash(user.email);
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email.split('@')[0])}&background=${hash.slice(0, 6)}&color=fff&size=400`;
    }
    
    return `https://ui-avatars.com/api/?name=User&background=6B7280&color=fff&size=400`;
  }

  /**
   * Delete user's avatar
   */
  static async deleteAvatar(userId: string, avatarUrl?: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!avatarUrl) {
        return { success: true }; // No avatar to delete
      }

      // Extract file path from URL if it's a Supabase storage URL
      const filePath = this.extractFilePathFromUrl(avatarUrl);
      if (filePath && filePath.includes('avatars/')) {
        await this.deleteFromStorage(filePath);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting avatar:', error);
      return { success: false, error: 'Failed to delete avatar' };
    }
  }

  // Private helper methods

  private static validateFile(file: File): { valid: boolean; error?: string } {
    // File size check
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${this.MAX_FILE_SIZE / (1024 * 1024)}MB.`
      };
    }

    // File type check
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed types: ${this.ALLOWED_TYPES.join(', ')}`
      };
    }

    // File name validation (prevent path traversal)
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
      return {
        valid: false,
        error: 'Invalid file name'
      };
    }

    return { valid: true };
  }

  private static async processImage(
    file: File, 
    options: AvatarUploadOptions = {}
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const { quality = 0.8, maxWidth = 400, maxHeight = 400 } = options;
        
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Image compression failed'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('Invalid image file'));
      img.src = URL.createObjectURL(file);
    });
  }

  private static generateSecureFilePath(userId: string, fileType: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const extension = fileType.split('/')[1];
    return `avatars/${userId}/${timestamp}-${random}.${extension}`;
  }

  private static async uploadToStorage(
    filePath: string, 
    file: File
  ): Promise<AvatarUploadResult> {
    try {
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return {
        success: true,
        publicUrl: urlData.publicUrl
      };
    } catch (error) {
      return { success: false, error: 'Storage upload failed' };
    }
  }

  private static async deleteFromStorage(filePath: string): Promise<void> {
    try {
      await supabase.storage
        .from('avatars')
        .remove([filePath]);
    } catch (error) {
      console.error('Storage deletion error:', error);
    }
  }

  private static checkRateLimit(userId: string): { allowed: boolean } {
    try {
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);
      const key = `${this.RATE_LIMIT_KEY}_${userId}`;
      
      // Get stored upload timestamps
      const stored = localStorage.getItem(key);
      let uploads: number[] = stored ? JSON.parse(stored) : [];
      
      // Remove uploads older than 1 hour
      uploads = uploads.filter(timestamp => timestamp > oneHourAgo);
      
      // Check if limit exceeded
      if (uploads.length >= this.MAX_UPLOADS_PER_HOUR) {
        return { allowed: false };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Rate limit check error:', error);
      return { allowed: true }; // Allow on error
    }
  }

  private static recordUpload(userId: string): void {
    try {
      const now = Date.now();
      const key = `${this.RATE_LIMIT_KEY}_${userId}`;
      
      // Get stored upload timestamps
      const stored = localStorage.getItem(key);
      let uploads: number[] = stored ? JSON.parse(stored) : [];
      
      // Add current upload
      uploads.push(now);
      
      // Store updated list
      localStorage.setItem(key, JSON.stringify(uploads));
    } catch (error) {
      console.error('Upload recording error:', error);
    }
  }

  private static async cleanupOldAvatar(userId: string, currentPath: string): Promise<void> {
    try {
      // List all user avatars
      const { data, error } = await supabase.storage
        .from('avatars')
        .list(`avatars/${userId}`);

      if (error || !data) return;

      // Delete old avatars (keep only current)
      const currentFileName = currentPath.split('/').pop();
      const oldFiles = data
        .filter(file => file.name !== currentFileName)
        .map(file => `avatars/${userId}/${file.name}`);

      if (oldFiles.length > 0) {
        await supabase.storage
          .from('avatars')
          .remove(oldFiles);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  private static extractFilePathFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.findIndex(part => part === 'avatars');
      if (bucketIndex !== -1) {
        return pathParts.slice(bucketIndex).join('/');
      }
      return null;
    } catch {
      return null;
    }
  }

  private static async getImageDimensions(
    file: File
  ): Promise<{ width: number; height: number } | undefined> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => resolve(undefined);
      img.src = URL.createObjectURL(file);
    });
  }

  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(6, '0');
  }
} 