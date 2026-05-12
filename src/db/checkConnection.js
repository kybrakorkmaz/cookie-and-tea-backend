import {sql} from "./client.js";
export const checkDatabaseConnection = async () =>{
    try {
        await sql`SELECT 1`;

        return{
            success: true,
            message: "Database connected",
        };
    }catch (error) {
        return {
            success: false,
            message: error.message,
        };
    }
}