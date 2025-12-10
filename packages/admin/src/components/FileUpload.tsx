import { Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { MAX_FILE_SIZE } from "../lib/constants";
import { Button } from "./shared/Button";
import { Spinner } from "./shared/Spinner";

interface FileUploadProps {
  accept?: string;
  maxSize?: number;
  onSuccess: (url: string) => void;
  value?: string;
}

export function FileUpload({
  accept = "*/*",
  maxSize = MAX_FILE_SIZE,
  onSuccess,
  value,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (file.size > maxSize) {
      toast.error(`File size exceeds ${(maxSize / 1024 / 1024).toFixed(2)}MB limit`);
      return;
    }

    setUploading(true);

    try {
      // For now, we'll just show a preview and store the file locally
      // In a real implementation, you'd:
      // 1. Request a signed URL from the backend
      // 2. Upload to R2 using the signed URL
      // 3. Update the entity with the file reference

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === "string") {
          setPreview(result);
          onSuccess(result);
          toast.success("File uploaded successfully");
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      void handleFileSelect(file);
    }
  };

  const handleClear = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            void handleFileSelect(file);
          }
        }}
      />

      {preview ? (
        <div className="relative rounded-md border p-4">
          {accept.startsWith("image/") ? (
            <img src={preview} alt="Preview" className="max-h-48 rounded-md object-contain" />
          ) : (
            <div className="flex items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm">{preview}</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center rounded-md border-2 border-dashed p-8 transition-colors hover:border-primary"
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={handleDrop}
          onClick={() => {
            fileInputRef.current?.click();
          }}
        >
          {uploading ? (
            <Spinner size="md" />
          ) : (
            <>
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drag and drop or click to upload
              </p>
              <p className="text-xs text-muted-foreground">
                Max size: {(maxSize / 1024 / 1024).toFixed(2)}MB
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
