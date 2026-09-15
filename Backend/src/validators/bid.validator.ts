import { z } from "zod";

export const createBidSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be a positive number"),

  requestId: z
    .string()
    .min(5, "requestId must be at least 5 characters")
    .max(100, "requestId cannot exceed 100 characters"),
});
