// Higher-order function validation middleware
import {ZodError} from "zod";

export const validate = (schema) => {
    return async (req, res, next) => {
        try {
            // Validate the request (body, query, and params)
            const parsedData = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });

            if (parsedData.body) req.body = parsedData.body;
            if (parsedData.params) req.params = parsedData.params

            if (parsedData.query) {
                // Clear the raw query properties cleanly
                for (const key in req.query) {
                    delete req.query[key];
                }
                // Copy the Zod-transformed/coerced values into the existing object container
                Object.assign(req.query, parsedData.query);
            }
            // If validation is successful, go to the next middleware/controller
            return next();
        } catch (error) {
            // If it's a Zod validation error, format it nicely
            if (error instanceof ZodError) {
                const formattedErrors = error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message
                }));

                const validationError = new Error("Validation failed");
                validationError.statusCode = 400;
                validationError.details = formattedErrors;

                return next(validationError);
            }

            // For any other unexpected errors, pass them to the error handler
            return next(error);
        }
    };
};