// DB Connection
import {drizzle} from "drizzle-orm/neon-serverless";
import {neon} from "@neondatabase/serverless";
import * as schema from "./schema/index.js";
import {ENV} from "../../env.js";

// Neon serverless client;
const sql = neon(ENV.DATABASE_URL); // Neon serverless driver also accepts normal postgres URLs
// Drizzle instance
export const db = drizzle(sql, {schema});
export {sql};