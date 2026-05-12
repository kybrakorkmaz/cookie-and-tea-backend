import { checkDatabaseConnection} from "../db/checkConnection.js";

(async () =>{
    const result = await checkDatabaseConnection();
    if(result.success){
        console.log("Health check paased", result.message);
        process.exit(0);
    }

    console.error("Health check failed", result.message);
    process.exit(1);
})();
