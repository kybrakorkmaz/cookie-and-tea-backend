// DB Connection
import {drizzle as drizzleNeon} from "drizzle-orm/neon-serverless";
import {neon, Pool, neonConfig} from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "./schema/index.js";
import {ENV} from "../../env.js";
import postgres from "postgres";
import {drizzle as drizzleLocal} from "drizzle-orm/postgres-js";
import {logger} from "../lib/logger.js";

let db;
let sql;

if(ENV.NODE_ENV === "production"){
    // PRODUCTION: Neon Serverless
    // Raw HTTP function — cheap one-off queries (e.g. /health SELECT 1)
    const client = neon(ENV.DATABASE_URL);
    sql = client;

    // Drizzle runs over a WebSocket Pool instead: the neon-serverless drizzle
    // driver rejects HTTP-function payloads ("could not parse the HTTP request
    // body"), and db.transaction() requires a stateful connection regardless.
    neonConfig.webSocketConstructor = ws;
    const pool = new Pool({ connectionString: ENV.DATABASE_URL });
    db = drizzleNeon(pool, { schema });
}else{
    // DEVELOPMENT/TEST: Local Postgres (TCP/Binary)
    let localDbUrl = ENV.DATABASE_URL;

    // Inside Docker, containers communicate via service names and internal ports
    if (process.env.IN_DOCKER === "1") {
        localDbUrl = localDbUrl.replace(/@localhost(?::\d+)?(\/|$)/, "@postgres:5432$1");
    }

    // Connects to your local Docker container.
    const client = postgres(localDbUrl, {
        // Optional: set max connections for local dev
        max: ENV.NODE_ENV === "test" ? 1 : 10,
        onnotice: ENV.NODE_ENV === "development" ? (msg) => logger.info(msg) : undefined
    });
    sql = client;
    db = drizzleLocal(client, { schema });
}
export {db, sql};