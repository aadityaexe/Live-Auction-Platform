import { z } from "zod";

export const createAuctionSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(150, "Title cannot exceed 150 characters"),

    description: z
      .string()
      .min(10, "Description must be at least 10 characters"),

    images: z.array(z.string().url("Each image must be a valid URL")).optional(),

    categoryId: z.string().optional(),

    startingPrice: z
      .number()
      .positive("Starting price must be greater than 0"),

    minimumIncrement: z
      .number()
      .positive("Minimum increment must be greater than 0"),

    reservePrice: z
      .number()
      .positive("Reserve price must be greater than 0")
      .optional(),

    startTime: z.coerce.date(),

    endTime: z.coerce.date(),
  })
  .refine(
    (data) => data.endTime > data.startTime,
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  )
  .refine(
    (data) =>
      !data.reservePrice ||
      data.reservePrice >= data.startingPrice,
    {
      message: "Reserve price cannot be lower than starting price",
      path: ["reservePrice"],
    }
  );

export const updateAuctionSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(150, "Title cannot exceed 150 characters")
      .optional(),

    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .optional(),

    images: z.array(z.string().url("Each image must be a valid URL")).optional(),

    categoryId: z.string().optional(),

    startingPrice: z
      .number()
      .positive("Starting price must be greater than 0")
      .optional(),

    minimumIncrement: z
      .number()
      .positive("Minimum increment must be greater than 0")
      .optional(),

    reservePrice: z
      .number()
      .positive("Reserve price must be greater than 0")
      .optional(),

    startTime: z.coerce.date().optional(),

    endTime: z.coerce.date().optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.endTime > data.startTime;
      }
      return true;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );