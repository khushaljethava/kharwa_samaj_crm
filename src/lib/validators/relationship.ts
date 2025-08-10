import { z } from "zod";

export const relationshipUpsertSchema = z.object({
  member_1_id: z.string().uuid(),
  member_2_id: z.string().uuid(),
  relationship_type: z.string(),
  relationship_status: z.string().optional(),
  start_date: z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), {
      message: "Invalid date",
    }),
  end_date: z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), {
      message: "Invalid date",
    }),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type RelationshipUpsertInput = z.infer<typeof relationshipUpsertSchema>;
