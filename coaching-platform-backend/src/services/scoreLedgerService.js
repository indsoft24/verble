import mongoose from 'mongoose';
import UserScoreLedger from '../models/UserScoreLedger.js';

/**
 * Append a ledger row; ignore duplicate key (retries).
 */
export async function appendLedgerEntry({
    userId,
    category,
    points = 0,
    delta = 0,
    title,
    sourceType,
    sourceId,
    eventKind = 'default',
    status = 'approved',
    occurredAt = new Date(),
    meta = {},
}) {
    if (!mongoose.Types.ObjectId.isValid(userId) || !title || !sourceType || !sourceId) {
        return null;
    }
    try {
        return await UserScoreLedger.create({
            user: userId,
            category,
            points,
            delta,
            title,
            sourceType,
            sourceId: String(sourceId),
            eventKind,
            status,
            occurredAt,
            meta,
        });
    } catch (err) {
        if (err?.code === 11000) return null;
        throw err;
    }
}

export function ledgerDocToEvent(doc) {
    return {
        id: doc._id.toString(),
        category: doc.category,
        title: doc.title,
        points: doc.points ?? 0,
        delta: doc.delta ?? 0,
        status: doc.status,
        occurredAt: doc.occurredAt,
        sourceType: doc.sourceType,
        sourceId: doc.sourceId,
        meta: doc.meta || {},
        fromLedger: true,
    };
}
