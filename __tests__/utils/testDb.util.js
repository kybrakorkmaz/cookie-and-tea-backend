// Cleanup function
import {db} from "../../src/db/client.js";
import {eq, inArray, like, or} from "drizzle-orm";
import {comments, donations, follows, posts, socials, users} from "../../src/db/schema/index.js";
import bcrypt from "bcrypt";

/**
 * Internal helper to guarantee zero collision strings across concurrently running tests.
 */
const generateRandomContext = () => {
    const uniqueId = Math.floor(Math.random() * 100000);
    return {
        uniqueId,
        password: "password123",
        username: `test_user_${uniqueId}`,
        email: `test_user_${uniqueId}@test.com`
    };
};

/**
 * Seeds a single user with automated hashing and dynamic unique strings.
 * Perfect for replacing code duplication inside auth.test.js
 */
export const seedTestUser = async (overrides = {}, status = "active") => {
    const context = generateRandomContext();
    const rawPassword = overrides.password || context.password;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const [user] = await db.insert(users).values({
        name: overrides.name || "Test Identity",
        username: overrides.username || context.username,
        email: overrides.email || context.email,
        hashedPassword: hashedPassword,
        status: overrides.status || status,
        about: overrides.about || null,
        profileImage: overrides.profileImage || null,
        backgroundImage: overrides.backgroundImage || null
    }).returning();

    return {
        ...user,
        rawPassword
    };
};
/**
 * Sets up a root user, an optional follower, and dependent metrics.
 */
export const seedCompleteProfileContext = async (uniqueId, rawPassword) => {
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const testUsername = `test_user_${uniqueId}`;
    const followerUsername = `test_follower_${uniqueId}`;

    // Core Creator
    const [user] = await db.insert(users).values({
        name: "Kubra Korkmaz",
        username: testUsername,
        email: `test_user_${uniqueId}@example.com`,
        hashedPassword,
        about: "Full-Stack Software Developer",
        profileImage: "profile.png",
        backgroundImage: "bg.png",
        status: "active"
    }).returning();

    // Secondary Follower
    const [follower] = await db.insert(users).values({
        name: "Follower Friend",
        username: followerUsername,
        email: `test_follower_${uniqueId}@example.com`,
        hashedPassword,
        status: "active"
    }).returning();

    // Relational Mappings
    await db.insert(socials).values({
        userId: user.id,
        socialMedia: "youtube",
        socialUrl: `https://youtube.com/${testUsername}`
    });

    await db.insert(posts).values({
        userId: user.id,
        type: "text",
        header: "First Tea Post",
        content: "Welcome to my support page!",
        donationSum: 50
    });

    await db.insert(follows).values({
        followerId: follower.id,
        followingId: user.id
    });

    return { user, follower };
};

export const generateTestPost = async (userOrId)=>{
    const userId = typeof userOrId === 'object' ? userOrId.id : userOrId;
    const [post] = await db.insert(posts).values({
        userId: userId,
        type: "text",
        header: "test title",
        content: "test content"
    }).returning();
    return post;
}
/**
 * Sweeps the test database clean of any mock entities matching the test namespace patterns.
 */
export const purgeTestUsers = async (namespacePrefix = "test\\_") => {
    const targetUsers = await db.select({id: users.id})
        .from(users)
        .where(like(users.username, `${namespacePrefix}%`));

    if(targetUsers.length === 0) return;
    const userIds = targetUsers.map(u => u.id);

    // Clear out explicit child tables lacking automatic cascading options
    await db.delete(donations).where(
        or(inArray(donations.donatorId, userIds), inArray(donations.receiverId, userIds))
    );
    await db.delete(comments).where(inArray(comments.commenterId, userIds));

    // Clear remaining dependent schemas
    await db.delete(socials).where(inArray(socials.userId, userIds));
    await db.delete(follows).where(
        or(inArray(follows.followerId, userIds), inArray(follows.followingId, userIds))
    );
    await db.delete(posts).where(inArray(posts.userId, userIds));

    // finally, safely delete the parent user records
    await db.delete(users).where(inArray(users.id, userIds));
};

