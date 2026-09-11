import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { migrate as migrateNeon } from "drizzle-orm/neon-serverless/migrator";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
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
        // PRODUCTION: Neon over a WebSocket Pool.
        // The neon() HTTP function's payloads are rejected by drizzle's
        // neon-serverless session ("could not parse the HTTP request body"),
        // and the migrator needs real transaction support.
        console.log("Applying structural scripts via Neon WebSocket Driver...");
        neonConfig.webSocketConstructor = ws;
        const pool = new Pool({ connectionString: dbUrl });
        const db = drizzleNeon(pool);

        try {
            await migrateNeon(db, { migrationsFolder: "./src/db/migrations" });
            console.log("Production Migration completed successfully.");
        } catch (error) {
            console.error("Production Migration lifecycle failed:", error);
            process.exit(1);
        } finally {
            await pool.end();
        }
    } else {
        // DEVELOPMENT & TEST: Local Docker Postgres TCP Context
        console.log("Applying structural scripts via Local Postgres-js TCP Driver...");

        // Inside Docker container network layouts, replace 'localhost' with the service alias 'postgres'
        // and also reset the port to default 5432 since containers communicate on internal ports.
        let connectionString = dbUrl;

        if (isRunningInDocker()) {
            // Replaces @localhost[:PORT] with @postgres:5432 while preserving path
            connectionString = connectionString.replace(/@localhost(?::\d+)?(\/|$)/, "@postgres:5432$1");
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

runMigration().then(() => {
    console.log("Migration sequence finalized.");
    process.exit(0);
}).catch((err) => {
    console.error("Fatal uncaught migration exception:", err);
    process.exit(1);
});