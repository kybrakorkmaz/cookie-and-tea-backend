import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/db/schema/index.js",
    out: "./src/db/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL || "postgres://postgres:strongdevpass123@localhost:5432/cat_dev",
    },
    verbose: true,
    strict: true,
});