import {z} from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "production", "test"])
        .default("development"),
    PORT: z
        .coerce.number().int()
        .min(1, { message: "Port must be >= 1" })
        .max(65535, { message: "Port must be <= 65535" })
        .default(8000),
    BASE_URL: z.url({ message: "Invalid URL format" }),
    DATABASE_URL: z.string().refine((url) => {
        try {
            const protocol = new URL(url).protocol;
            return protocol === "postgres:" || protocol === "postgresql:";
        } catch {
            return false;
        }
    }, { message: "Invalid DB URL scheme (must be postgres:// or postgresql://)" }),
    JWT_SECRET: z.string().min(1, { message: "JWT_SECRET is required" }),
});

// Parse and export
export const ENV = envSchema.parse(process.env);