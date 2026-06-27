import {updateUserStatus} from "../repositories/auth.repository.js";

export const testInterceptorMiddleware = (req, res, next) => {
    // 1. SECURITY: Never intercept preflight requests
    if (req.method === 'OPTIONS') {
        return next();
    }

    const isTestEnv = ENV.NODE_ENV === "test";
    const hasBypassHeader = req.headers["x-test-bypass"] === ENV.BYPASS_SECRET;

    if (isTestEnv && hasBypassHeader) {
        const originalJson = res.json;

        res.json = async function (data) {
            // 2. SAFETY: Ensure the object is not null/undefined before checking properties
            if (res.statusCode === 201 && data?.user?.id) {
                try {
                    await updateUserStatus(data.user.id, "active");
                    if (data.user) data.user.status = "active";
                } catch (err) {
                    console.error("Test interceptor status migration failed:", err);
                }
            }
            return originalJson.call(this, data);
        };
    }
    next();
};