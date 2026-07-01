import {db, sql as sqlClient} from "../db/client.js";
import {actions, users} from "../db/schema/index.js";
import {and, desc, eq, sql} from "drizzle-orm";

let _ensured = false;
const ensureActionsTable = async () =>{
    if(_ensured) return;
    _ensured = true;
    // Create enum types and table if they don't exist to keep tests self-contained
    const createTypeAction = `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'action_type') THEN CREATE TYPE action_type AS ENUM ('comment','follow','donation'); END IF; END$$;`;
    const createTypeStatus = `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'action_status') THEN CREATE TYPE action_status AS ENUM ('unread','read'); END IF; END$$;`;

    const createTable = `CREATE TABLE IF NOT EXISTS actions (
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
    );`;

    await sqlClient.unsafe(createTypeAction);
    await sqlClient.unsafe(createTypeStatus);
    await sqlClient.unsafe(createTable);
}

export const createAction = async ({actorId, targetUserId, type, postId = null, amount = null, message = null, status = 'unread', readAt = null}) => {
    await ensureActionsTable();
    return db.insert(actions).values({
        actorId,
        targetUserId,
        type,
        postId,
        amount,
        message,
        status,
        readAt
    }).returning();
}

export const fetchActionsForUser = async (userId, page = 1, limit = 20) =>{
    const p = Number.isNaN(Number(page)) ? 1 : Math.max(1, parseInt(page, 10));
    const l = Number.isNaN(Number(limit)) ? 20 : Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (p - 1) * l;

    return db.select({
        id: actions.id,
        actorId: actions.actorId,
        actorName: users.name,
        actorUsername: users.username,
        type: actions.type,
        postId: actions.postId,
        amount: actions.amount,
        message: actions.message,
        status: actions.status,
        readAt: actions.readAt,
        createdAt: actions.createdAt
    }).from(actions)
        .innerJoin(users, eq(users.id, actions.actorId))
        .where(eq(actions.targetUserId, userId))
        .orderBy(desc(actions.createdAt))
        .limit(l)
        .offset(offset);
}

export const markActionRead = async (actionId, userId) =>{
    const result = await db.update(actions)
        .set({ status: 'read', readAt: sql`now()` })
        .where(and(eq(actions.id, actionId), eq(actions.targetUserId, userId)))
        .returning();
    return result;
}

export const deleteExpiredReadActions = async () =>{
    // Delete actions that are read and older than 14 days from readAt
    return db.delete(actions)
        .where(sql`${actions.status} = 'read' AND ${actions.readAt} < (now() - interval '14 days')`)
        .returning();
}

export const deleteAction = async (actionId, userId) =>{
    return db.delete(actions)
        .where(and(eq(actions.id, actionId), eq(actions.targetUserId, userId)))
        .returning();
}