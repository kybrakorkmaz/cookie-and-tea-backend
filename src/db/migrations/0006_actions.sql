-- Create actions enums and table for notifications
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'action_type') THEN
        CREATE TYPE action_type AS ENUM ('comment','follow','donation');
    END IF;
END$$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'action_status') THEN
        CREATE TYPE action_status AS ENUM ('unread','read');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS actions (
    id serial PRIMARY KEY,
    actor_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type action_type NOT NULL,
    post_id integer REFERENCES posts(id) ON DELETE SET NULL,
    amount integer,
    message text,
    status action_status NOT NULL DEFAULT 'unread',
    read_at timestamp,
    created_at timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS actions_target_created_idx ON actions (target_user_id, created_at DESC);
