import { z } from "zod";

export const updateUserSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  bio: z.string().max(500).optional(),
  profilePicture: z.string().url("Must be a valid URL").optional(),
});
