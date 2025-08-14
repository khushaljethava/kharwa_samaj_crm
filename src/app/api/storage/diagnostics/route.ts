import { NextResponse } from "next/server";
import { checkStorageBucket, listStorageBuckets, createStorageBucket } from "@/lib/supabase/storage";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/storage/diagnostics
 * Check storage bucket status and configuration
 */
export async function GET() {
  try {
    // Check authentication
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Run diagnostics
    const bucketExists = await checkStorageBucket("samaj");
    const allBuckets = await listStorageBuckets();
    
    return NextResponse.json({
      success: true,
      data: {
        samajBucketExists: bucketExists,
        allBuckets: allBuckets.map(bucket => ({
          id: bucket.id,
          name: bucket.name,
          public: bucket.public,
          created_at: bucket.created_at
        })),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Storage diagnostics error:", error);
    return NextResponse.json(
      { error: "Failed to run storage diagnostics" }, 
      { status: 500 }
    );
  }
}

/**
 * POST /api/storage/diagnostics
 * Create the storage bucket if it doesn't exist
 */
export async function POST() {
  try {
    // Check authentication
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Attempt to create the bucket
    const created = await createStorageBucket("samaj");
    
    if (created) {
      return NextResponse.json({
        success: true,
        message: "Storage bucket 'samaj' is ready",
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        { error: "Failed to create storage bucket" }, 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Storage bucket creation error:", error);
    return NextResponse.json(
      { error: "Failed to create storage bucket" }, 
      { status: 500 }
    );
  }
}
