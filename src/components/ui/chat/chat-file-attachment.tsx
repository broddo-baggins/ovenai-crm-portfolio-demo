import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Paperclip,
  Image as ImageIcon,
  FileText,
  Download,
  X,
  Upload,
  File,
  Video,
  Music,
} from "lucide-react";
import { toast } from "sonner";

export interface AttachmentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  preview?: string;
  uploadProgress?: number;
}

interface ChatFileAttachmentProps {
  files: AttachmentFile[];
  onRemove?: (fileId: string) => void;
  onDownload?: (file: AttachmentFile) => void;
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
  className?: string;
}

export const ChatFileAttachment: React.FC<ChatFileAttachmentProps> = ({
  files,
  onRemove,
  onDownload,
  maxFileSize = 10,
  allowedTypes = [
    "image/*",
    "application/pdf",
    "text/*",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  className,
}) => {
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="h-4 w-4" />;
    if (fileType.startsWith("video/")) return <Video className="h-4 w-4" />;
    if (fileType.startsWith("audio/")) return <Music className="h-4 w-4" />;
    if (fileType.includes("pdf")) return <FileText className="h-4 w-4" />;
    if (fileType.includes("word") || fileType.includes("document"))
      return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileTypeColor = (fileType: string) => {
    if (fileType.startsWith("image/")) return "bg-blue-100 text-blue-700";
    if (fileType.startsWith("video/")) return "bg-purple-100 text-purple-700";
    if (fileType.startsWith("audio/")) return "bg-green-100 text-green-700";
    if (fileType.includes("pdf")) return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  };

  const handleRemove = (fileId: string) => {
    onRemove?.(fileId);
    toast.success("File removed");
  };

  const handleDownload = (file: AttachmentFile) => {
    if (file.url) {
      onDownload?.(file);
      // Create download link
      const link = document.createElement("a");
      link.href = file.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("File downloaded");
    }
  };

  if (files.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {files.map((file) => (
        <Card key={file.id} className="p-3">
          <div className="flex items-center gap-3">
            {/* File Icon */}
            <div className={`p-2 rounded-lg ${getFileTypeColor(file.type)}`}>
              {getFileIcon(file.type)}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <Badge variant="secondary" className="text-xs">
                  {formatFileSize(file.size)}
                </Badge>
              </div>

              {/* Upload Progress */}
              {file.uploadProgress !== undefined &&
                file.uploadProgress < 100 && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${file.uploadProgress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {file.uploadProgress}%
                      </span>
                    </div>
                  </div>
                )}

              {/* Image Preview */}
              {file.type.startsWith("image/") && file.preview && (
                <div className="mt-2">
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="h-20 w-20 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {file.url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(file)}
                  className="h-8 w-8 p-0"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}

              {onRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(file.id)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

// File Upload Component
interface FileUploadAreaProps {
  onFileSelect: (files: File[]) => void;
  maxFileSize?: number;
  allowedTypes?: string[];
  className?: string;
  disabled?: boolean;
}

export const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  onFileSelect,
  maxFileSize = 10,
  allowedTypes = ["image/*", "application/pdf", "text/*"],
  className,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      validateAndSelectFiles(files);
    },
    [disabled, maxFileSize, allowedTypes],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files = Array.from(e.target.files);
        validateAndSelectFiles(files);
      }
    },
    [maxFileSize, allowedTypes],
  );

  const validateAndSelectFiles = (files: File[]) => {
    const validFiles = files.filter((file) => {
      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        toast.error(
          `File ${file.name} is too large. Max size: ${maxFileSize}MB`,
        );
        return false;
      }

      // Check file type
      const isValidType = allowedTypes.some((type) => {
        if (type.endsWith("/*")) {
          return file.type.startsWith(type.slice(0, -2));
        }
        return file.type === type;
      });

      if (!isValidType) {
        toast.error(`File type ${file.type} is not allowed`);
        return false;
      }

      return true;
    });

    if (validFiles.length > 0) {
      onFileSelect(validFiles);
    }
  };

  return (
    <div className={className}>
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-gray-400 cursor-pointer"}
        `}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onClick={() =>
          !disabled && document.getElementById("file-input")?.click()
        }
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600 mb-1">
          Drop files here or click to browse
        </p>
        <p className="text-xs text-gray-400">
          Max {maxFileSize}MB • {allowedTypes.join(", ")}
        </p>

        <input
          id="file-input"
          type="file"
          multiple
          accept={allowedTypes.join(",")}
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default ChatFileAttachment;
