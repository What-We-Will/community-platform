import { createClient } from "@/lib/supabase/client";

export type UploadResult = {
  path: string;
  publicUrl: string | null;
  signedUrl: string | null;
  error: string | null;
};

export async function uploadPublicFile(
  bucket: string,
  path: string,
  file: File
): Promise<UploadResult> {
  const supabase = createClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    return { path: "", publicUrl: null, signedUrl: null, error: error.message };
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    path: data.path,
    publicUrl: urlData.publicUrl,
    signedUrl: null,
    error: null,
  };
}

export async function uploadPrivateFile(
  bucket: string,
  path: string,
  file: File
): Promise<UploadResult> {
  const supabase = createClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    return { path: "", publicUrl: null, signedUrl: null, error: error.message };
  }

  const { data: signedData, error: signedError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(data.path, 3600);

  return {
    path: data.path,
    publicUrl: null,
    signedUrl: signedError ? null : signedData?.signedUrl ?? null,
    error: null,
  };
}

export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  if (error) return null;
  return data.signedUrl;
}

export async function deleteFile(
  bucket: string,
  path: string
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  return !error;
}

export function validateFile(
  file: File,
  options: { maxSizeMB: number; allowedTypes: string[] }
): string | null {
  if (file.size > options.maxSizeMB * 1024 * 1024) {
    return `File size must be under ${options.maxSizeMB} MB`;
  }
  if (!options.allowedTypes.includes(file.type)) {
    return `File type ${file.type} is not allowed`;
  }
  return null;
}
