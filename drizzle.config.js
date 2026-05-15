import {ENV} from "./env.js"
/** @type {import("drizzle-kit").Config} */
export default {
    // Point this to your index.js where you exported all tables
    schema: "./src/db/schema/index.js",
    out: "./src/db/migrations",  // migration output folder
    dialect: "postgresql",       // database dialect
    dbCredentials:{
        url:ENV.DATABASE_URL,    // Neon connection string or local postgres
    },
    verbose: true,
    strict: true
}