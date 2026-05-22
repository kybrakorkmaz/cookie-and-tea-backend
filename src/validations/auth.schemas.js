import {z} from "zod";

export const CreateUserSchema = z.object({
    body: z.object({
        email: z.email("Provide a valid email address"),
        password: z.string().min(8, "Password must be at least 8 characters long"),
    }),
});

