-- Mock data for 4 people
INSERT INTO "users" ("name", "username", "email", "hashed_password", "about", "role") VALUES
('Alice Smith', 'alice', 'alice@example.com', '$2b$10$EpjXf8Zq0D2RzS3f8m3ZeuJk7JvV1y9.8y9.8y9.8y9.8y9.8y9.8', 'Digital artist and tea lover.', 'user'),
('Bob Johnson', 'bob', 'bob@example.com', '$2b$10$EpjXf8Zq0D2RzS3f8m3ZeuJk7JvV1y9.8y9.8y9.8y9.8y9.8y9.8', 'Full-stack developer and cookie connoisseur.', 'user'),
('Charlie Brown', 'charlie', 'charlie@example.com', '$2b$10$EpjXf8Zq0D2RzS3f8m3ZeuJk7JvV1y9.8y9.8y9.8y9.8y9.8y9.8', 'Just a guy who likes to share thoughts.', 'user'),
('Diana Prince', 'diana', 'diana@example.com', '$2b$10$EpjXf8Zq0D2RzS3f8m3ZeuJk7JvV1y9.8y9.8y9.8y9.8y9.8y9.8', 'Travel blogger and photographer.', 'admin');

-- Mock posts
INSERT INTO "posts" ("user_id", "type", "header", "content", "images") VALUES
(1, 'image', 'My Latest Painting', 'Hope you all like this one!', ARRAY['https://example.com/art1.jpg']),
(2, 'text', 'Hello World', 'First post on this awesome platform.', NULL),
(3, 'hybrid', 'Check this out', 'Combining some cool images and thoughts.', ARRAY['https://example.com/pic1.jpg']),
(4, 'text', 'Travel Tips', 'Always carry a towel.', NULL);

-- Mock follows
INSERT INTO "follows" ("follower_id", "following_id") VALUES
(1, 2),
(1, 4),
(2, 1),
(3, 1),
(4, 1);

-- Mock socials
INSERT INTO "socials" ("user_id", "social_media", "social_url") VALUES
(1, 'instagram', 'https://instagram.com'),
(2, 'twitter', 'https://twitter.com'),
(4, 'youtube', 'https://youtube.com');

-- Mock comments
INSERT INTO "comments" ("post_id", "commenter_id", "comment") VALUES
(1, 2, 'This is amazing!'),
(1, 3, 'Love the colors.'),
(2, 1, 'Welcome, Bob!');

-- Mock donations
INSERT INTO "donations" ("post_id", "donator_id", "receiver_id", "amount") VALUES
(1, 2, 1, 500),
(1, 4, 1, 1000),
(3, 1, 3, 200);

-- Update user counts (manual sync as per schema comments)
UPDATE "users" SET "follower_count" = 4, "following_count" = 2 WHERE "id" = 1;
UPDATE "users" SET "follower_count" = 1, "following_count" = 1 WHERE "id" = 2;
UPDATE "users" SET "follower_count" = 0, "following_count" = 1 WHERE "id" = 3;
UPDATE "users" SET "follower_count" = 1, "following_count" = 1 WHERE "id" = 4;

-- Update post counts
UPDATE "posts" SET "comment_count" = 2, "donation_sum" = 1500 WHERE "id" = 1;
UPDATE "posts" SET "comment_count" = 1 WHERE "id" = 2;
UPDATE "posts" SET "donation_sum" = 200 WHERE "id" = 3;
