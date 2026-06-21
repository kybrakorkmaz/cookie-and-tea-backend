import {z} from "zod";
import dotenv from "dotenv";

// Only trigger dotenv if we aren't running in Docker or using native env-file flags
if (!process.env.IN_DOCKER && !process.env.DATABASE_URL) {
    dotenv.config();
}

const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "production", "test"])
        .default("development"),
    PORT: z
        .coerce.number().int()
        .min(1, { message: "Port must be >= 1" })
        .max(65535, { message: "Port must be <= 65535" })
        .default(8003),
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

    // Modern SMTP Config updates for Mailtrap Sandbox environments
    EMAIL_HOST: z.string().min(1, { message: "EMAIL_HOST routing target is required" }),
    EMAIL_PORT: z.coerce.number().int().default(2525), // Coerces numeric strings safely from env
    EMAIL_USERNAME: z.string().min(1, { message: "EMAIL_USERNAME credential token is required" }),
    EMAIL_PASSWORD: z.string().min(1, { message: "EMAIL_PASSWORD credential token is required" }),

    // Optional but highly recommended: clean branding configurations
    FROM_NAME: z.string().default("Cookie & Tea App"),
    FROM_EMAIL: z.string().email().default("noreply@cookieandtea.com"),
    BYPASS_SECRET: z.string().default("secret-test-key")
});

// Parse and export
export const ENV = envSchema.parse(process.env);