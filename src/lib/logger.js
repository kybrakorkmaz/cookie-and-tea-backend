// Simple logger abstraction for the application
const createLogger = (name) => {
    return {
        info: (...args) => {
            console.log(`[${name}]`, ...args);
        },
        warn: (...args) => {
            console.warn(`[${name}]`, ...args);
        },
        error: (...args) => {
            console.error(`[${name}]`, ...args);
        },
        debug: (...args) => {
            console.debug(`[${name}]`, ...args);
        }
    };
};

export const dbLogger = createLogger("DB");
export const processLogger = createLogger("Process");

