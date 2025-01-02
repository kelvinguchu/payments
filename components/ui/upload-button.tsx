"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface UploadButtonProps {
  onUploadComplete: (url: string) => void;
  isLoading?: boolean;
}

export function UploadButton({
  onUploadComplete,
  isLoading,
}: UploadButtonProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please select an image under 5MB",
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please select an image file",
        });
        return;
      }

      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "ml_default");

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      if (!cloudName) {
        throw new Error("Cloudinary cloud name is not configured");
      }

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      const data = await response.json();

      if (!data.secure_url) {
        throw new Error("No URL received from upload");
      }

      onUploadComplete(data.secure_url);

      toast({
        title: "Upload complete",
        description: "Your avatar has been updated successfully",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description:
          error instanceof Error ? error.message : "Please try again later",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Button
      type='button'
      variant='outline'
      className='border-border/40 bg-gradient-to-b from-background/50 to-background/80 backdrop-blur transition-colors hover:bg-accent'
      disabled={uploading || isLoading}>
      <label className='flex cursor-pointer items-center gap-2'>
        {uploading ? (
          <>
            <Loader2 className='h-4 w-4 animate-spin' />
            <span>Uploading...</span>
          </>
        ) : (
          <>
            <Upload className='h-4 w-4' />
            <span>Change Avatar</span>
          </>
        )}
        <input
          type='file'
          className='hidden'
          accept='image/*'
          onChange={handleUpload}
          disabled={uploading || isLoading}
        />
      </label>
    </Button>
  );
}
