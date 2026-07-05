import { purgeExpiredReads } from "../services/actions.service.js";
import { logger } from "./logger.js";

// How often we check the database for expired (read, older than 14 days) notifications.
const PURGE_INTERVAL_MS = 24 * 60 * 60 * 1000; // once a day

const runPurge = async () => {
    try {
        const deleted = await purgeExpiredReads();
        if (deleted.length > 0) {
            logger.info(`Purged ${deleted.length} expired action(s) (read for more than 14 days).`);
        }
    } catch (error) {
        logger.error("Failed to purge expired actions", { error });
    }
};

/**
 * Starts a background job that permanently deletes notifications ("actions")
 * that have been read for more than 14 days.
 * NOTE: this only ever touches the `actions` table (notifications). Underlying
 * transaction records (e.g. donations) are stored separately and are never deleted here.
 */
export const startActionsCleanupScheduler = () => {
    // Run once shortly after startup, then on a recurring interval.
    void runPurge();
    return setInterval(runPurge, PURGE_INTERVAL_MS);
};
