/**
 * Clamp list queries so callers cannot request unbounded result sets.
 */
export const parseOffsetLimit = (query, { defaultLimit = 5, maxLimit = 100 } = {}) => {
    const parsedLimit = parseInt(query?.limit, 10);
    const parsedOffset = parseInt(query?.offset, 10);
    const limit = Number.isInteger(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, maxLimit)
        : defaultLimit;
    const offset = Number.isInteger(parsedOffset) && parsedOffset >= 0
        ? parsedOffset
        : 0;
    return { limit, offset };
};
