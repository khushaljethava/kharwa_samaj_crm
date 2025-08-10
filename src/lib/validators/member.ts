import { z } from "zod";

export const memberUpsertSchema = z.object({
  personal_info: z.record(z.string(), z.unknown()).default({}),
  contact_info: z.record(z.string(), z.unknown()).default({}),
  address_info: z.record(z.string(), z.unknown()).default({}),
  membership_info: z.record(z.string(), z.unknown()).default({}),
  metadata: z.record(z.string(), z.unknown()).default({}),
  is_active: z.boolean().optional().default(true),
  is_deceased: z.boolean().optional().default(false),
});

export type MemberUpsertInput = z.infer<typeof memberUpsertSchema>;
