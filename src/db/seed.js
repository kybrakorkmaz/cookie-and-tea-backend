import { db, sql } from "./client.js";
import { users, posts, comments, donations, follows, socials } from "./schema/index.js";
import { faker } from "@faker-js/faker";
import { ENV } from "../../env.js";
import bcrypt from "bcrypt";

async function seed() {
    if (ENV.NODE_ENV === "production") {
        console.error("CRITICAL SAFETY ERROR: Cannot run seeding in production environment!");
        process.exit(1);
    }

    console.log("Seeding process started...");

    try {
        // 1. Clear existing data (optional but recommended for a clean seed)
        // Order matters due to foreign key constraints
        console.log("Clearing existing data...");
        await db.delete(comments);
        await db.delete(donations);
        await db.delete(posts);
        await db.delete(socials);
        await db.delete(follows);
        await db.delete(users);

        // 2. Create Users
        console.log("Creating users...");
        const passwordHash = await bcrypt.hash("password123", 10);
        
        const userDatas = Array.from({ length: 10 }).map((_, i) => ({
            name: faker.person.fullName(),
            username: i === 0 ? "testuser" : `user_${i}_${faker.string.alphanumeric(5)}`,
            email: i === 0 ? "test@example.com" : `user${i}@example.com`,
            hashedPassword: passwordHash,
            role: i === 0 ? "admin" : "user",
            status: "active",
            about: faker.lorem.sentence(),
            profileImage: faker.image.avatar(),
            backgroundImage: faker.image.urlPicsumPhotos({ width: 1200, height: 400 }),
        }));

        const insertedUsers = await db.insert(users).values(userDatas).returning();
        console.log(`Inserted ${insertedUsers.length} users.`);

        // 3. Create Socials
        console.log("Creating social links...");
        const socialPlatforms = ["twitter", "instagram", "youtube", "pinterest"];
        const socialDatas = [];
        insertedUsers.forEach(user => {
            // Give each user 1-3 social links
            const count = faker.number.int({ min: 1, max: 3 });
            const selectedPlatforms = faker.helpers.arrayElements(socialPlatforms, count);
            selectedPlatforms.forEach(platform => {
                socialDatas.push({
                    userId: user.id,
                    socialMedia: platform,
                    socialUrl: `https://${platform}.com/${user.username}`,
                });
            });
        });
        await db.insert(socials).values(socialDatas);

        // 4. Create Follows
        console.log("Creating follows...");
        const followDatas = [];
        insertedUsers.forEach(follower => {
            // Each user follows 2-5 other users
            const following = faker.helpers.arrayElements(
                insertedUsers.filter(u => u.id !== follower.id),
                { min: 2, max: 5 }
            );
            following.forEach(target => {
                followDatas.push({
                    followerId: follower.id,
                    followingId: target.id,
                });
            });
        });
        if (followDatas.length > 0) {
            await db.insert(follows).values(followDatas);
        }

        // 5. Create Posts
        console.log("Creating posts...");
        const postTypes = ["text", "image", "video", "hybrid"];
        const postDatas = [];
        insertedUsers.forEach(user => {
            // Each user has 3-7 posts
            const postCount = faker.number.int({ min: 3, max: 7 });
            for (let i = 0; i < postCount; i++) {
                const type = faker.helpers.arrayElement(postTypes);
                postDatas.push({
                    userId: user.id,
                    type,
                    header: faker.lorem.sentence(),
                    content: faker.lorem.paragraphs(1),
                    images: (type === "image" || type === "hybrid") 
                        ? [faker.image.urlPicsumPhotos(), faker.image.urlPicsumPhotos()] 
                        : [],
                    videos: (type === "video" || type === "hybrid") 
                        ? ["https://www.w3schools.com/html/mov_bbb.mp4"] 
                        : [],
                    createdAt: faker.date.past(),
                });
            }
        });
        const insertedPosts = await db.insert(posts).values(postDatas).returning();
        console.log(`Inserted ${insertedPosts.length} posts.`);

        // 6. Create Comments
        console.log("Creating comments...");
        const commentDatas = [];
        insertedPosts.forEach(post => {
            // Each post has 0-5 comments
            const commentCount = faker.number.int({ min: 0, max: 5 });
            for (let i = 0; i < commentCount; i++) {
                const commenter = faker.helpers.arrayElement(insertedUsers);
                commentDatas.push({
                    postId: post.id,
                    commenterId: commenter.id,
                    comment: faker.lorem.sentence(),
                });
            }
        });
        if (commentDatas.length > 0) {
            await db.insert(comments).values(commentDatas);
            
            // Update comment counts (denormalized field)
            console.log("Updating post comment counts...");
            for (const post of insertedPosts) {
                const count = commentDatas.filter(c => c.postId === post.id).length;
                if (count > 0) {
                    await db.update(posts)
                        .set({ commentCount: count })
                        .where(sql`${posts.id} = ${post.id}`);
                }
            }
        }

        // 7. Create Donations
        console.log("Creating donations...");
        const donationDatas = [];
        insertedPosts.forEach(post => {
            // 30% chance of a donation per post
            if (faker.number.float({ min: 0, max: 1 }) < 0.3) {
                const donator = faker.helpers.arrayElement(insertedUsers);
                const amount = faker.number.int({ min: 100, max: 5000 }); // in cents
                donationDatas.push({
                    postId: post.id,
                    donatorId: donator.id,
                    receiverId: post.userId,
                    amount,
                });
            }
        });
        if (donationDatas.length > 0) {
            await db.insert(donations).values(donationDatas);

            // Update donation sums (denormalized field)
            console.log("Updating post donation sums...");
            for (const post of insertedPosts) {
                const sum = donationDatas
                    .filter(d => d.postId === post.id)
                    .reduce((acc, d) => acc + d.amount, 0);
                if (sum > 0) {
                    await db.update(posts)
                        .set({ donationSum: sum })
                        .where(sql`${posts.id} = ${post.id}`);
                }
            }
        }

        console.log("Seeding completed successfully!");
    } catch (error) {
        console.error("Seeding failed:", error);
        throw error;
    } finally {
        // Close the connection if sql.end is available (postgres-js)
        if (sql && typeof sql.end === "function") {
            await sql.end();
        }
    }
}

seed().then(() => {
    console.log("Seeding process finished.");
    process.exit(0);
}).catch((err) => {
    process.exit(1);
});
