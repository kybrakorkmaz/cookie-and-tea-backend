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
    DATABASE_URL: z.string().refine((url) =>
            url.startsWith("postgres://") ||
            url.startsWith("postgresql://") ||
            url.startsWith("mysql://"),
        { message: "Invalid DB URL scheme" }
    ),
});

// Parse and export
export const ENV = envSchema.parse(process.env);