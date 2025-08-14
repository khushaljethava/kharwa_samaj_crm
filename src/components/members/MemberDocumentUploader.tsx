"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FileText, Upload, X } from "lucide-react";

type DocumentType = 'aadhar' | 'pan' | 'other';

type Props = {
  memberId: string;
  currentDocuments?: {
    aadhar_url?: string;
    pan_url?: string;
    others?: string[];
  } | null;
};

export default function MemberDocumentUploader({ memberId, currentDocuments }: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [uploading, setUploading] = useState(false);
  
  // File inputs for different document types
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [panFile, setPanFile] = useState<File | null>(null);
  const [otherFiles, setOtherFiles] = useState<File[]>([]);
  
  // Refs for file inputs
  const aadharInputRef = useRef<HTMLInputElement | null>(null);
  const panInputRef = useRef<HTMLInputElement | null>(null);
  const otherInputRef = useRef<HTMLInputElement | null>(null);

  async function uploadFile(file: File, folder: string) {
    const fileExt = file.name.split(".").pop() || "dat";
    const fileName = `${folder}/${memberId}-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const { error: upErr } = await supabase.storage.from("samaj").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });
    if (upErr) throw new Error(upErr.message);
    const { data } = supabase.storage.from("samaj").getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function handleUpload() {
    if (!aadharFile && !panFile && otherFiles.length === 0) return;
    
    setUploading(true);
    try {
      // Fetch existing member to preserve fields
      const getRes = await fetch(`/api/members/${memberId}`, { cache: "no-store" });
      if (!getRes.ok) throw new Error("Failed to load member");
      const { data: member } = await getRes.json();

      // Upload new files and get URLs
      let aadhar_url = currentDocuments?.aadhar_url;
      let pan_url = currentDocuments?.pan_url;
      const other_urls = [...(currentDocuments?.others || [])];

      if (aadharFile) {
        aadhar_url = await uploadFile(aadharFile, "documents/aadhar");
      }
      if (panFile) {
        pan_url = await uploadFile(panFile, "documents/pan");
      }
      if (otherFiles.length > 0) {
        for (const file of otherFiles) {
          const url = await uploadFile(file, "documents/others");
          other_urls.push(url);
        }
      }

      // Update member with new document URLs
      const updatedDocuments = {
        aadhar_url,
        pan_url,
        others: other_urls,
      };

      const body = {
        personal_info: member.personal_info || {},
        contact_info: member.contact_info || {},
        address_info: member.address_info || {},
        membership_info: member.membership_info || {},
        metadata: { 
          ...(member.metadata || {}), 
          documents: updatedDocuments 
        },
        is_active: member.is_active ?? true,
        is_deceased: member.is_deceased ?? false,
      };

      const putRes = await fetch(`/api/members/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!putRes.ok) throw new Error("Failed to update member");
      
      // Clear file selections
      setAadharFile(null);
      setPanFile(null);
      setOtherFiles([]);
      
      router.refresh();
    } catch (e) {
      console.error("Document upload error:", e);
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

  function removeOtherFile(index: number) {
    setOtherFiles(prev => prev.filter((_, i) => i !== index));
  }

  const hasFilesToUpload = aadharFile || panFile || otherFiles.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upload Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Aadhar Upload */}
        <div className="space-y-2">
          <Label>Aadhar Card</Label>
          <div className="flex items-center gap-2">
            {currentDocuments?.aadhar_url && (
              <a 
                href={currentDocuments.aadhar_url} 
                target="_blank" 
                rel="noreferrer"
                className="text-sm text-blue-600 underline hover:text-blue-800"
              >
                View Current
              </a>
            )}
            <input 
              ref={aadharInputRef} 
              className="hidden" 
              type="file" 
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx" 
              onChange={(e) => setAadharFile(e.target.files?.[0] || null)} 
            />
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => aadharInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
          </div>
          {aadharFile && (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span>{aadharFile.name}</span>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => setAadharFile(null)}
                className="h-auto p-1"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* PAN Upload */}
        <div className="space-y-2">
          <Label>PAN Card</Label>
          <div className="flex items-center gap-2">
            {currentDocuments?.pan_url && (
              <a 
                href={currentDocuments.pan_url} 
                target="_blank" 
                rel="noreferrer"
                className="text-sm text-blue-600 underline hover:text-blue-800"
              >
                View Current
              </a>
            )}
            <input 
              ref={panInputRef} 
              className="hidden" 
              type="file" 
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx" 
              onChange={(e) => setPanFile(e.target.files?.[0] || null)} 
            />
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => panInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
          </div>
          {panFile && (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span>{panFile.name}</span>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => setPanFile(null)}
                className="h-auto p-1"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Other Documents Upload */}
        <div className="space-y-2">
          <Label>Other Documents</Label>
          <div className="flex items-center gap-2">
            {currentDocuments?.others && currentDocuments.others.length > 0 && (
              <div className="text-sm">
                <span className="text-muted-foreground">Current: </span>
                {currentDocuments.others.map((url, idx) => (
                  <span key={idx}>
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      Doc {idx + 1}
                    </a>
                    {idx < currentDocuments.others!.length - 1 && ", "}
                  </span>
                ))}
              </div>
            )}
            <input 
              ref={otherInputRef} 
              className="hidden" 
              type="file" 
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx" 
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setOtherFiles(prev => [...prev, ...files]);
              }} 
            />
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => otherInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Add Files
            </Button>
          </div>
          {otherFiles.length > 0 && (
            <div className="space-y-1">
              {otherFiles.map((file, idx) => (
                <div key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>{file.name}</span>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeOtherFile(idx)}
                    className="h-auto p-1"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="pt-2">
          <Button 
            type="button" 
            onClick={handleUpload} 
            disabled={!hasFilesToUpload || uploading}
            className="w-full"
          >
            {uploading ? "Uploading..." : "Upload Documents"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
