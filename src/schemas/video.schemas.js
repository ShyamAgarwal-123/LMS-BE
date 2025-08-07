import { z } from "zod";

const videoSchema = z.object({
  title: z
    .string()
    .min(3, "The title must be at least 3 characters")
    .max(50, "The title must be at most 50 characters"),
  freePreview: z.boolean({ coerce: true }),
  // videoUrl: z.string().url(),
  // public_id: z.string(),
  s3Key: z.string(),
});

export default videoSchema;
