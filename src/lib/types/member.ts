export type UUID = string;

export interface Member {
  id: UUID;
  member_code: string;
  personal_info: Record<string, unknown>;
  contact_info: Record<string, unknown>;
  address_info: Record<string, unknown>;
  membership_info: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_deceased: boolean;
  metadata: Record<string, unknown>;
}
