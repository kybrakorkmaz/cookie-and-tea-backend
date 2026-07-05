import { z } from "zod";

export const donationSchema = z.object({
    body: z.object({
        recipientUsername: z.string()
            .trim()
            .min(3, "Recipient username must be at least 3 characters long")
            .max(30, "Username is too long"),
        postId: z.coerce.number().int().positive().optional(),
    }),
});

// Validates the one-time card tokenization request (iyzico "store card" flow)
export const cardSchema = z.object({
    body: z.object({
        cardHolderName: z.string().trim().min(2, "Card holder name is required"),

        // Otomatik olarak boşlukları temizler, ardından 15-19 haneli numara kontrolünü yapar
        cardNumber: z.preprocess(
            (val) => (typeof val === "string" ? val.replace(/\s+/g, "") : val),
            z.string().trim().regex(/^\d{15,19}$/, "Card number must be 15-19 digits")
        ),

        expireMonth: z.string().trim().regex(/^(0[1-9]|1[0-2])$/, "Expire month must be MM"),

        // Eğer gelen yıl 2 haneliyse başına "20" ekleyerek 4 haneye tamamlar (örn: "29" -> "2029")
        expireYear: z.preprocess(
            (val) => {
                if (typeof val === "string") {
                    const cleaned = val.trim();
                    return cleaned.length === 2 ? `20${cleaned}` : cleaned;
                }
                return val;
            },
            z.string().trim().regex(/^\d{4}$/, "Expire year must be YYYY")
        ),

        cvc: z.string().trim().regex(/^\d{3,4}$/, "CVC must be 3-4 digits"),
    }),
});