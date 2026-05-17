import app from "./app.js";
import {ENV} from "../../env.js";

app.listen(ENV.PORT, () => {
    console.log(`Server running at ${ENV.BASE_URL}`);
});
