// DB Connection
import {drizzle as drizzleNeon} from "drizzle-orm/neon-serverless";
import {neon} from "@neondatabase/serverless";
import * as schema from "./schema/index.js";
import {ENV} from "../../env.js";
import postgres from "postgres";
import {drizzle as drizzleLocal} from "drizzle-orm/postgres-js";
import {dbLogger} from "../lib/logger.js";

let db;
let sql;

if(ENV.NODE_ENV === "production"){
    // PRODUCTION: Neon Serverless (HTTP)
    const client = neon(ENV.DATABASE_URL);
    sql = client;
    db = drizzleNeon(client, { schema });
}else{
    // DEVELOPMENT/TEST: Local Postgres (TCP/Binary)
    const localDbUrl = ENV.DATABASE_URL || "postgres://postgres:strongdevpass123@localhost:5432/cat_dev";
    // Connects to your local Docker container.
    const client = postgres(localDbUrl, {
        // Optional: set max connections for local dev
        max: ENV.NODE_ENV === "test" ? 1 : 10,
        onnotice: ENV.NODE_ENV === "development" ? dbLogger.info : undefined
    });
    sql = client;
    db = drizzleLocal(client, { schema });
}
export {db, sql};