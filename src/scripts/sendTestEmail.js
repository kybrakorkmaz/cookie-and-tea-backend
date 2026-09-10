// Smoke-test the current EMAIL_* configuration by sending a real message
// through the project's existing email utility (src/utils/email.util.js).
//
// Usage:
//   npm run email:test -- recipient@example.com
//
// With Mailtrap Sandbox (sandbox.smtp.mailtrap.io) the mail lands in your
// Mailtrap inbox. With Mailtrap Email Sending (live.smtp.mailtrap.io) it is
// delivered for real — check https://mailtrap.io/sending/email_logs afterwards.
import { sendEmail } from "../utils/email.util.js";
import { ENV } from "../../env.js";

const to = process.argv[2];

if (!to) {
    console.error("Usage: npm run email:test -- recipient@example.com");
    process.exit(1);
}

console.log(`Sending test email via ${ENV.EMAIL_HOST}:${ENV.EMAIL_PORT} as ${ENV.FROM_EMAIL} ...`);

sendEmail({
    to,
    subject: "Hello from Mailtrap",
    message: "This is a test e-mail message.",
    html: "<p>This is a test e-mail message.</p>",
})
    .then((info) => {
        console.log("Message sent: %s", info.messageId);
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
