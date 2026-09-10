import { z } from "zod";

export const settingsSchema = z.object({
    body: z.object({
        username: z.string()
            .trim()
            .min(3, "Username must be at least 3 characters")
            .max(30),
        name: z.string()
            .trim()
            .min(2, "Name is too short"),
        email: z.string()
            .trim()
            .email("Invalid email address"),
        password: z.string()
            .min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string()
    })
        .partial() // Makes all fields optional so partial PATCH requests pass!
        .refine((data) => {
            // Only enforce password matching if a password change is actually being attempted
            if (data.password && data.password !== data.confirmPassword) {
                return false;
            }
            return true;
        }, {
            message: "Passwords do not match",
            path: ["confirmPassword"]
        })
});