import { z } from "zod";

const signInSchema = z.object({
  username: z
    .string()
    .min(3, "The username must be atleast 3 character")
    .max(50, "The username must atmost 50 Character"),
  password: z.string().min(8, "The password must be altest 8 character"),
});

export default signInSchema;
