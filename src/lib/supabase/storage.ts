import { createSupabaseAdminClient } from "./admin";

/**
 * Utility functions for Supabase storage operations
 */

/**
 * Check if the storage bucket exists
 */
export async function checkStorageBucket(bucketName: string = "samaj"): Promise<boolean> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage.getBucket(bucketName);
    
    if (error) {
      console.error(`Bucket check error for '${bucketName}':`, error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error(`Exception checking bucket '${bucketName}':`, error);
    return false;
  }
}

/**
 * Create the storage bucket if it doesn't exist
 */
export async function createStorageBucket(bucketName: string = "samaj"): Promise<boolean> {
  try {
    const supabase = createSupabaseAdminClient();
    
    // First check if bucket exists
    const exists = await checkStorageBucket(bucketName);
    if (exists) {
      console.log(`Bucket '${bucketName}' already exists`);
      return true;
    }
    
    // Create the bucket
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/png', 
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
    });
    
    if (error) {
      console.error(`Failed to create bucket '${bucketName}':`, error);
      return false;
    }
    
    console.log(`Successfully created bucket '${bucketName}':`, data);
    return true;
  } catch (error) {
    console.error(`Exception creating bucket '${bucketName}':`, error);
    return false;
  }
}

/**
 * List all storage buckets (useful for debugging)
 */
export async function listStorageBuckets(): Promise<any[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error("Failed to list buckets:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Exception listing buckets:", error);
    return [];
  }
}

/**
 * Upload a file to the storage bucket with better error handling
 */
export async function uploadFile(
  file: File, 
  folder: string, 
  bucketName: string = "samaj"
): Promise<string> {
  const supabase = createSupabaseAdminClient();
  
  // Check if bucket exists first
  const bucketExists = await checkStorageBucket(bucketName);
  if (!bucketExists) {
    throw new Error(`Storage bucket '${bucketName}' does not exist. Please set up storage configuration.`);
  }
  
  const fileExt = file.name.split(".").pop() || "dat";
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
  
  const { error: upErr } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });
    
  if (upErr) {
    throw new Error(`Upload failed: ${upErr.message}`);
  }
  
  const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
  return data.publicUrl;
}
