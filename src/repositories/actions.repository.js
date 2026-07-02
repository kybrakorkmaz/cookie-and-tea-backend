import {db, sql as sqlClient} from "../db/client.js";
import {actions, users} from "../db/schema/index.js";
import {and, desc, eq, sql} from "drizzle-orm";

export const createAction = async ({actorId, targetUserId, type, postId = null, amount = null, message = null, status = 'unread', readAt = null}) => {
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
    // Parse values first, then run finite checks to eliminate empty string cascading bugs
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    const p = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;
    const l = Number.isFinite(parsedLimit) ? Math.max(1, Math.min(100, parsedLimit)) : 20;
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
    return db.delete(actions)
        .where(sql`${actions.status} = 'read' AND ${actions.readAt} < (now() - interval '14 days')`)
        .returning();
}

export const deleteAction = async (actionId, userId) =>{
    return db.delete(actions)
        .where(and(eq(actions.id, actionId), eq(actions.targetUserId, userId)))
        .returning();
}