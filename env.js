import {z} from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "production", "test"])
        .default("development"),
    PORT: z
        .string()
        .default("8000")
        .refine((port)=> {
                const parsed = parseInt(port, 10);
                return parsed > 0 && parsed < 65536;
        }),
    BASE_URL: z
        .string()
        .refine(
            (url) => url.startsWith("http://") || url.startsWith("https://"),
            "Invalid URL format"
        ),
    DATABASE_URL: z.string().min(1, "Invalid database format"),
});

// Parse and export
export const ENV = envSchema.parse(process.env);