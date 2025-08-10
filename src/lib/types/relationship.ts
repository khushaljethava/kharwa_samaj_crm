import type { UUID } from "./member";

export interface Relationship {
  id: UUID;
  member_1_id: UUID;
  member_2_id: UUID;
  relationship_type: string;
  relationship_status?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
