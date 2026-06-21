import {z} from "zod";

export const registerUserSchema = z.object({
    body: z.object({
        name: z.string().trim().min(2, "Name must be at least 2 characters long"),
        username: z.string().trim().min(3, "Username must be at least 3 characters long").max(30, "Username is too long"),
        email: z.string().trim().email("Provide a valid email address"),
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
            .trim()
            .min(3, "Identifier must be at least 3 characters long"),
        password: z.string().min(8, "password must be at least 8 characters")
    })
})

export const emailSchema = z.email();