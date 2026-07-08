import { z } from "zod";
export const settingsSchema = z.object({
    body: z.object({
        username: z.string().min(3, "Username must be at least 3 characters").optional(),
        name: z.string().min(1, "Full name cannot be empty!").optional(),
        email: z.email("Invalid email address!").optional(),
        password: z.string().min(8, "Password must include at least 8 characters!").optional(),
        confirmPassword: z.string().optional()
    }).refine((data) => {
        // Only enforce matching if the user is trying to change their password
        if (data.password || data.confirmPassword) {
            return data.password === data.confirmPassword;
        }
        return true;
    }, {
        message: "Passwords are not same!",
        path: ["confirmPassword"]
    })
});