import { spawn } from "node:child_process";

// Vercel preview/dev deploys must not mutate the production database.
// Local `npm start` already runs db:migrate; this script is the Vercel build hook.
const vercelEnv = process.env.VERCEL_ENV;
if (vercelEnv && vercelEnv !== "production") {
    console.log(`Skipping DB migrate (VERCEL_ENV=${vercelEnv})`);
    process.exit(0);
}

const child = spawn(process.execPath, ["src/db/migrate.js"], { stdio: "inherit" });
child.on("exit", (code) => process.exit(code ?? 1));
