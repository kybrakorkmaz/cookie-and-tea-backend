import { z } from "zod";

export const donationSchema = z.object({
    body: z.object({
        recipientUsername: z.string()
            .trim()
            .min(3, "Recipient username must be at least 3 characters long")
            .max(30, "Username is too long"),
    }),
});
