import {object, z} from "zod";

// Validates the path parameter safely
export const getProfileParamsSchema = z.object({
    params: z.object({
        username: z.string({
            error: (issue) => {
                if (issue.code === "invalid_type" && issue.input === undefined) {
                    return { message: "Username parameter is required" };
                }
                return {};
            }
        }).trim().min(1),
    }),
});

// Validates both the path parameter AND optional query filters
export const getIntroQuerySchema = z.object({
    params: z.object({
        username: z.string().trim().min(1),
    }),
    query: z.object({
        earningTimeline: z.string().optional().transform((val) => {
            const num = Number(val);
            return Number.isInteger(num) && num > 0 ? num : 30;
        }),
        isFollower: z.string().optional().transform((val) => val !== "false"),
    }),
});

// Validates incoming HTTP PUT payloads for profile bio adjustments
export const updateAboutSchema = z.object({
    body: z.object({
        about: z.string().max(1000, { message: "Bio cannot exceed 1000 characters." })
    })
});

export const socialSchema = z.object({
    body: z.object({
        socials: z.array(
            z.object({
                socialMedia: z.enum(["twitter", "instagram", "youtube", "pinterest"], {
                    errorMap: () => ({ message: "Unsupported media platform provider" })
                }),
                socialUrl: z.string().url({ message: "Invalid social profile URL address format" })
            })
        )
    })
});