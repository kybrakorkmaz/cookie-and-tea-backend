import {z} from "zod";

export const registerUserSchema = z.object({
    body: z.object({
        name: z.string(),
        username: z.string(),
        email: z.email("Provide a valid email address"),
        password: z.string().min(8, "Password must be at least 8 characters long"),
        confirmPassword: z.string()
    }).refine(
        (data)=>data.password === data.confirmPassword,{
            message: "Passwords do not match",
            path: ["confirmPassword"],
        }
    ),
});
