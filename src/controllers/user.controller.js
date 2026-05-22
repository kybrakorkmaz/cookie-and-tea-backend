export const registerUser = async (req, res, next) =>{
    try {
        const { email } = req.body;

        // Simulate an error like a duplicate DB item
        if(email === "token@example.com"){
            const conflictError = new Error("Email is already registered");
            conflictError.statusCode = 409;
            throw conflictError;
        }

        res.status(201).json({
            status: "success",
            data: {user: {email}}
        });
    }catch (error) {
        next(error); // Passes the error smoothly to Express's global handler
    }
}