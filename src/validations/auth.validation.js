import {union, z} from "zod";

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

export const loginUserSchema = z.object({
    body: z.object({
        identifier: z.string()
            .min(3, "Identifier must be at least 3 characters long")
            .trim(),
        password: z.string().min(8, "password must be at least 8 characters")
    })
})