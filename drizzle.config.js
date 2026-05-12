import {ENV} from "./env.js"
/** @type {import("drizzle-kit").Config} */
export default {
    schema: "./src/db/client.js", // entry point schema
    out: "./src/db/migrations",  // migration output folder
    dialect: "postgresql",       // database dialect
    dbCredentials:{
        url:ENV.DATABASE_URL,    // Neon connection string
    },
    verbose: true,
    strict: true
}