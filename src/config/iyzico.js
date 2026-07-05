import Iyzipay from "iyzipay";
import {ENV} from "../../env.js";

export const iyzico = new Iyzipay({
    apiKey: ENV.IYZICO_API_KEY,
    secretKey: ENV.IYZICO_SECRET_KEY,
    uri: ENV.IYZICO_BASE_URL,
});