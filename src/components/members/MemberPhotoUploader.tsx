"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

type Props = {
  memberId: string;
  currentUrl?: string | null;
};

export default function MemberPhotoUploader({ memberId, currentUrl }: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `photos/${memberId}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("samaj")
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type || undefined });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("samaj").getPublicUrl(path);
      const photo_url = pub.publicUrl;

      // Fetch existing member to preserve fields
      const getRes = await fetch(`/api/members/${memberId}`, { cache: "no-store" });
      if (!getRes.ok) throw new Error("Failed to load member");
      const { data: member } = await getRes.json();

      const body = {
        personal_info: member.personal_info || {},
        contact_info: member.contact_info || {},
        address_info: member.address_info || {},
        membership_info: member.membership_info || {},
        metadata: { ...(member.metadata || {}), photo_url },
        is_active: member.is_active ?? true,
        is_deceased: member.is_deceased ?? false,
      };

      const putRes = await fetch(`/api/members/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!putRes.ok) throw new Error("Failed to update member");
      setFile(null);
      router.refresh();
    } catch (e) {
      console.error("Photo upload error:", e);
      const errorMessage = (e as any)?.message || "Upload failed";
      if (errorMessage.includes("Bucket not found")) {
        alert("Storage bucket not configured. Please contact admin to set up file storage.");
      } else {
        alert(`Upload failed: ${errorMessage}`);
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentUrl} alt="Member photo" className="h-16 w-16 rounded-full object-cover border" />
        ) : (
          <div className="h-16 w-16 rounded-full bg-muted grid place-items-center text-xs text-muted-foreground border">
            No photo
          </div>
        )}
        <div className="flex items-center gap-2">
          <input ref={inputRef} className="hidden" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            <Camera className="h-4 w-4 mr-2" />
            Choose Photo
          </Button>
          <Button type="button" size="sm" onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? "Uploading..." : currentUrl ? "Replace" : "Upload"}
          </Button>
        </div>
      </div>
      {file && <div className="text-xs text-muted-foreground">{file.name}</div>}
    </div>
  );
}


