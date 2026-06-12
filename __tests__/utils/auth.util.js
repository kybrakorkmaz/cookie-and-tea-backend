import {ENV} from "../../env.js";
import request from "supertest";
import jwt from "jsonwebtoken";


/**
 *  Real HTTP Login simulation via Supertest Agent
 */
export const createAuthenticatedAgent = async (app, username, rawPassword) => {
    const agent = request.agent(app);
    const response = await agent
        .post("/api/v1/auth/login")
        .send({
            identifier: username,
            password: rawPassword
        });
    // Fail fast if POST /api/v1/auth/login failed or dropped cookies completely
    const cookies = response.headers["set-cookie"];
    if (response.status !== 200 || !cookies || !cookies.some(c => c.startsWith("token="))) {
        throw new Error(
            `Failed to create authenticated agent for user '${username}'. Status: ${response.status}. Response: ${JSON.stringify(response.body)}`
        );
    }
    return agent;
};

/**
 * Generates an authentic session token payload for testing purposes
 */
export const generateTestAuthCookie = (userId, username, email) => {
    const token = jwt.sign(
        { userId, username, email },
        ENV.JWT_SECRET,
        { expiresIn: "1h" }
    );
    // Return it formatted exactly how standard HTTP headers expect cookies
    return `token=${token}`;
}