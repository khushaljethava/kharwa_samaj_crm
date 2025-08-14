"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Separator } from "@/components/ui/separator";
import { MinusCircle, PlusCircle } from "lucide-react";

const relationshipTypes = [
  { value: "parent_child", label: "Parent-Child" },
  { value: "spousal", label: "Spousal" },
  { value: "sibling", label: "Sibling" },
  { value: "extended_family", label: "Extended Family" },
  { value: "in_law", label: "In-law" },
  { value: "guardian", label: "Guardian" },
];

const relationshipTypeValues = relationshipTypes.map((rt) => rt.value) as [
  string,
  ...string[]
];

const memberSchema = z.object({
  personal_info: z.object({
    first_name: z.string().min(1, { message: "First name is required" }),
    middle_name: z.string().optional(),
    last_name: z.string().min(1, { message: "Last name is required" }),
    nicknames: z.string().optional(),
    date_of_birth: z.string().optional(), // Consider using a date type if possible
    gender: z.string().optional(),
    blood_group: z.string().optional(),
    marital_status: z.string().optional(),
    education_qualifications: z.string().optional(),
    occupation: z.string().optional(),
    employer_details: z.string().optional(),
    annual_income: z.number().optional().nullable(), // Optional numeric field
    aadhar_number: z.string().optional(), // Needs encryption
    religious_affiliations: z.string().optional(),
    gotra_sub_caste: z.string().optional(),
  }),
  contact_info: z.object({
    phone_primary: z.string().min(1, { message: "Primary phone is required" }),
    phone_secondary: z.string().optional(),
    whatsapp_number: z.string().optional(),
    email_primary: z.string().email({ message: "Invalid email address" }).optional().or(z.literal('')),
    email_secondary: z.string().email({ message: "Invalid email address" }).optional().or(z.literal('')),
    social_media: z.string().optional(), // Consider JSONB if multiple platforms
    emergency_contact_name: z.string().optional(),
    emergency_contact_phone: z.string().optional(),
  }),
  address_info: z.object({
    current_address: z.string().optional(),
    permanent_address: z.string().optional(),
    native_place: z.string().optional(),
  }),
  medical_conditions: z.string().optional(), // Needs encryption
  relationships: z.array(
    z.object({
      member_id: z.string().uuid({ message: "Invalid member ID" }),
      relationship_type: z.enum(relationshipTypeValues),
    })
  ).optional(),
});

type MemberFormValues = z.infer<typeof memberSchema>;

export default function NewMemberPage() {
  const router = useRouter();
  const [existingMembers, setExistingMembers] = useState<{ id: string; display_name: string }[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [panFile, setPanFile] = useState<File | null>(null);
  const [otherDocs, setOtherDocs] = useState<File[]>([]);
  const supabase = createSupabaseBrowserClient();

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      personal_info: { first_name: "", last_name: "" },
      contact_info: { phone_primary: "" },
      address_info: {},
      medical_conditions: "",
      relationships: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "relationships",
  });

  useEffect(() => {
    const fetchMembers = async () => {
      // Fetch a limited list of members for the relationship dropdown
      // In a real app, this would likely be a searchable infinite scroll or similar
      const res = await fetch("/api/members?limit=100");
      if (res.ok) {
        const payload = await res.json();
        const data: Array<{ id: string; personal_info?: Record<string, unknown> | null }> = payload?.data || [];
        setExistingMembers(
          data.map((m) => {
            const pi = (m.personal_info || {}) as Record<string, unknown>;
            const display = [pi.first_name as string, pi.middle_name as string, pi.last_name as string]
              .filter(Boolean)
              .join(" ");
            return {
              id: m.id,
              display_name: display || m.id,
            };
          }),
        );
      } else {
        toast.error("Failed to fetch existing members.");
      }
    };
    fetchMembers();
  }, []);

  const onSubmit = async (data: MemberFormValues) => {
    // Upload files first; gather URLs to store in metadata
    async function uploadFile(file: File, folder: string) {
      const fileExt = file.name.split(".").pop() || "dat";
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const { error: upErr } = await supabase.storage.from("samaj").upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });
      if (upErr) throw new Error(upErr.message);
      const { data } = supabase.storage.from("samaj").getPublicUrl(fileName);
      return data.publicUrl;
    }

    let photo_url: string | null = null;
    let aadhar_url: string | null = null;
    let pan_url: string | null = null;
    const other_urls: string[] = [];

    try {
      if (photoFile) photo_url = await uploadFile(photoFile, "photos");
      if (aadharFile) aadhar_url = await uploadFile(aadharFile, "documents/aadhar");
      if (panFile) pan_url = await uploadFile(panFile, "documents/pan");
      if (otherDocs && otherDocs.length > 0) {
        for (const f of otherDocs) {
          const url = await uploadFile(f, "documents/others");
          other_urls.push(url);
        }
      }
    } catch (e: any) {
      console.error("Upload error:", e);
      const errorMessage = e?.message || "Unknown error";
      if (errorMessage.includes("Bucket not found")) {
        toast.error("Storage bucket not configured. Please contact admin to set up file storage.");
      } else {
        toast.error(`Upload failed: ${errorMessage}`);
      }
      return;
    }

    // Map relationship data to match DB schema structure
    const relationships = data.relationships?.map(rel => ({
      member_2_id: rel.member_id, // member_1_id will be the new member's ID
      relationship_type: rel.relationship_type,
      // Add other relationship fields if needed (status, start_date, etc.)
    })) || [];

    const body = {
      personal_info: data.personal_info,
      contact_info: data.contact_info,
      address_info: data.address_info,
      medical_conditions: data.medical_conditions,
      metadata: {
        photo_url,
        documents: {
          aadhar_url,
          pan_url,
          others: other_urls,
        },
      },
      relationships_to_create: relationships, // Pass relationships separately
    };

    form.setValue("relationships", data.relationships); // Update form state

    const res = await fetch("/api/members", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (res.ok) {
      toast.success("Member created successfully!");
      router.push("/members");
    } else {
      const errorData = await res.json();
      toast.error(`Failed to create member: ${errorData.message || 'Unknown error'}`);
      console.error("Failed to create member:", errorData);
    }
  };

  const handleAddRelationship = () => {
    append({ member_id: "", relationship_type: "parent_child" }); // Default type
  };

  const handleRemoveRelationship = (index: number) => {
    remove(index);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold">New Member</h1>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input id="first_name" {...form.register("personal_info.first_name")} />
              {form.formState.errors.personal_info?.first_name && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.personal_info.first_name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input id="last_name" {...form.register("personal_info.last_name")} />
              {form.formState.errors.personal_info?.last_name && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.personal_info.last_name.message}</p>
              )}
            </div>
            {/* Add other personal info fields */}
            <div className="md:col-span-2">
              <Label htmlFor="photo">Member Photo</Label>
              <Input id="photo" type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone_primary">Primary Phone</Label>
              <Input id="phone_primary" {...form.register("contact_info.phone_primary")} />
              {form.formState.errors.contact_info?.phone_primary && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.contact_info.phone_primary.message}</p>
              )}
            </div>
             <div>
              <Label htmlFor="email_primary">Primary Email</Label>
              <Input id="email_primary" type="email" {...form.register("contact_info.email_primary")} />
              {form.formState.errors.contact_info?.email_primary && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.contact_info.email_primary.message}</p>
              )}
            </div>
            {/* Add other contact info fields */}
          </CardContent>
        </Card>

         <Card>
          <CardHeader><CardTitle>Address Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="current_address">Current Address</Label>
              <Textarea id="current_address" {...form.register("address_info.current_address")} />
            </div>
             {/* Add other address info fields */}
          </CardContent>
        </Card>

         <Card>
          <CardHeader><CardTitle>Medical Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="medical_conditions">Medical Conditions</Label>
              <Textarea id="medical_conditions" {...form.register("medical_conditions")} />
               {/* Note: This field should be encrypted */}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="aadhar">Aadhar Card</Label>
              <Input id="aadhar" type="file" accept="image/*,application/pdf" onChange={(e) => setAadharFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <Label htmlFor="pan">PAN Card</Label>
              <Input id="pan" type="file" accept="image/*,application/pdf" onChange={(e) => setPanFile(e.target.files?.[0] || null)} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="others">Other Documents</Label>
              <Input id="others" type="file" multiple accept="image/*,application/pdf" onChange={(e) => setOtherDocs(Array.from(e.target.files || []))} />
              <p className="text-xs text-muted-foreground mt-1">You can select multiple files</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Relationships</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center space-x-2">
                 <div className="flex-1">
                  <Label htmlFor={`relationships.${index}.member_id`}>Related Member</Label>
                   <Select
                    onValueChange={(value) => form.setValue(`relationships.${index}.member_id`, value)}
                    value={form.watch(`relationships.${index}.member_id`)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a member" />
                    </SelectTrigger>
                    <SelectContent>
                      {existingMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                   {form.formState.errors.relationships?.[index]?.member_id && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.relationships[index]?.member_id?.message}</p>
                  )}
                 </div>
                 <div className="flex-1">
                   <Label htmlFor={`relationships.${index}.relationship_type`}>Relationship Type</Label>
                   <Select
                      onValueChange={(value) => form.setValue(`relationships.${index}.relationship_type`, value as string)}
                      value={form.watch(`relationships.${index}.relationship_type`)}
                   >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship type" />
                      </SelectTrigger>
                      <SelectContent>
                        {relationshipTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                   </Select>
                    {form.formState.errors.relationships?.[index]?.relationship_type && (
                      <p className="text-red-500 text-sm mt-1">{form.formState.errors.relationships[index]?.relationship_type?.message}</p>
                    )}
                 </div>
                <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveRelationship(index)}>
                  <MinusCircle className="h-4 w-4" />
                </Button>
              </div>
            ))}
             <Button type="button" variant="outline" size="sm" onClick={handleAddRelationship} className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Relationship
            </Button>
          </CardContent>
        </Card>

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving..." : "Create Member"}
        </Button>
      </form>
    </div>
  );
}
