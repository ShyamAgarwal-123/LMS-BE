import { z } from "zod";

const courseSchema = z.object({
  title: z
    .string()
    .min(3, "The title must be at least 3 characters")
    .max(50, "The title must be at most 50 characters"),
  subtitle: z
    .string()
    .min(3, "The subtitle must be at least 3 characters")
    .max(50, "The subtitle must be at most 50 characters"),
  price: z.number().min(100),
  discription: z
    .string()
    .min(10, "The description must be at least 10 characters")
    .max(500, "The description must be at most 500 characters"),
});

export default courseSchema;
