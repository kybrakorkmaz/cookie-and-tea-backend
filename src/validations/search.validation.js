import {z} from "zod";

// Validates GET /api/v1/search/users query parameters
export const searchUsersQuerySchema = z.object({
    query: z.object({
        q: z.string({
            required_error: "Search query 'q' is required",
            invalid_type_error: "Search query must be a valid string"
        }).trim().min(1, "Search query cannot be empty").max(100, "Search query is too long"),
        limit: z.string().optional().transform((val) => {
            const num = Number(val);
            return Number.isInteger(num) && num > 0 && num <= 20 ? num : 8;
        })
    }),
});
