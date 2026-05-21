import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { migrate as migrateNeon } from "drizzle-orm/neon-serverless/migrator";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleLocal } from "drizzle-orm/postgres-js";
import { migrate as migrateLocal } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { ENV } from "../../env.js";

// Helper to safely detect if running inside Docker
function isRunningInDocker() {
    return process.env.IN_DOCKER === "1";
}

async function runMigration() {
    console.log("Migration sequence initialized...");

    const dbUrl = ENV.DATABASE_URL;
    const nodeEnv = ENV.NODE_ENV;

    console.log(`Target Environment Validated: ${nodeEnv}`);

    if (nodeEnv === "production") {
        // PRODUCTION: Neon Serverless HTTP Context
        console.log("Applying structural scripts via Neon HTTP Serverless Driver...");
        const sqlClient = neon(dbUrl);
        const db = drizzleNeon(sqlClient);

        try {
            await migrateNeon(db, { migrationsFolder: "./src/db/migrations" });
            console.log("Production Migration completed successfully.");
        } catch (error) {
            console.error("Production Migration lifecycle failed:", error);
            process.exit(1);
        }
    } else {
        // DEVELOPMENT & TEST: Local Docker Postgres TCP Context
        console.log("Applying structural scripts via Local Postgres-js TCP Driver...");

        // Inside Docker container network layouts, replace 'localhost' with the service alias 'postgres'
        // and also reset the port to default 5432 since containers communicate on internal ports.
        let connectionString = dbUrl;

        if (isRunningInDocker() && connectionString.includes("@localhost:")) {
            // Replaces @localhost:PORT with @postgres:5432
            connectionString = connectionString.replace(/@localhost:\d+/, "@postgres:5432");
        }

        const sqlClient = postgres(connectionString);
        const db = drizzleLocal(sqlClient);

        try {
            await migrateLocal(db, { migrationsFolder: "./src/db/migrations" });
            console.log("Local Migration completed successfully.");
        } catch (error) {
            console.error("Local Migration lifecycle failed:", error);
            process.exit(1);
        } finally {
            await sqlClient.end();
        }
    }
}

runMigration().catch((err) => {
    console.error("Fatal uncaught migration exception:", err);
    process.exit(1);
});