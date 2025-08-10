import { z } from "zod";

export const feePaymentCreateSchema = z.object({
  subscription_id: z.string().uuid(),
  amount: z.number().nonnegative(),
  payment_date: z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), {
      message: "Invalid date",
    }),
  payment_method: z.string().optional(),
  transaction_id: z.string().optional(),
});

export type FeePaymentCreateInput = z.infer<typeof feePaymentCreateSchema>;


