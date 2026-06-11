
import {ENV} from "../../env.js";
import nodeMailer from "nodemailer";


const transporter = nodeMailer.createTransport({
    host: ENV.EMAIL_HOST,
    port: ENV.EMAIL_PORT,
    auth:{
        user: ENV.EMAIL_USERNAME,
        pass: ENV.EMAIL_PASSWORD
    }
});

export const sendEmail = async(options) => {
    const mailOptions = {
        from: `"${ENV.FROM_NAME}" <${ENV.FROM_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        text: options.message,
        html: options.html
    }
    return transporter.sendMail(mailOptions);
}
