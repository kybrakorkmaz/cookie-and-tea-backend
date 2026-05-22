// Higher-order function validation middleware
export const validate = (schema) =>{
    return async (req, res, next)=>{
        try {
            // Validate incoming client payload
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next(); // Validation passed, proceed to controller.
        }catch (error) {
            // If Zod fails, format errors nicely and pass to error middleware
            if(error.name === "ZodError"){
                const errorMessage = error.errors.map((err)=>`${err.path.join(".")}: ${err.message}`);

                // Create an inline error object with an HTTP status code
                const validationError = new Error(`Validation failed: ${errorMessage.join(", ")}`);
                validationError.statusCode = 400;

                return next(validationError); // Forward to centralized errorHandler
            }
            // Catch-all to make sure unexpected errors (if not zod error) get forwarded to the error handler 
            next(error);
        }
    };
};