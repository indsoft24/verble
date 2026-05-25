import mongoose from 'mongoose';
import DatabaseAuditLog from '../models/DatabaseAuditLog.js';
import {
    buildFieldList,
    buildSafeQuery,
    ensureCollectionAllowed,
    maskSensitiveDocument,
    parseValidatedDocumentJson,
    serializeForClient,
} from '../utils/databaseManagerUtils.js';

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 25;
const DEFAULT_AUDIT_LIMIT = 50;

const getCollection = (collectionName) => mongoose.connection.db.collection(collectionName);

const parsePagination = (pageInput, limitInput) => {
    const page = Math.max(parseInt(pageInput || '1', 10), 1);
    const requestedLimit = parseInt(limitInput || `${DEFAULT_LIMIT}`, 10);
    const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);
    return { page, limit, skip: (page - 1) * limit };
};

const parseObjectId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid document id.');
    }
    return new mongoose.Types.ObjectId(id);
};

const createAuditLog = async ({ user, action, collectionName, documentId, beforeData, afterData }) => {
    await DatabaseAuditLog.create({
        userId: user._id,
        userEmail: user.email,
        action,
        collectionName,
        documentId,
        beforeData: beforeData ? maskSensitiveDocument(beforeData) : null,
        afterData: afterData ? maskSensitiveDocument(afterData) : null,
    });
};

export const getCollections = async (req, res, next) => {
    try {
        const search = (req.query.search || '').toString().trim().toLowerCase();
        const allCollections = await mongoose.connection.db.listCollections({}, { nameOnly: true }).toArray();

        const collections = await Promise.all(
            allCollections
                .map((item) => item.name)
                .filter((name) => !name.startsWith('system.'))
                .filter((name) => !search || name.toLowerCase().includes(search))
                .map(async (name) => {
                    try {
                        ensureCollectionAllowed(name);
                        const count = await getCollection(name).estimatedDocumentCount({ maxTimeMS: 1500 });
                        return { name, count, restricted: false };
                    } catch (error) {
                        return { name, count: 0, restricted: true };
                    }
                })
        );

        res.json({
            status: 'success',
            data: {
                collections: collections.sort((a, b) => a.name.localeCompare(b.name)),
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getCollectionDocuments = async (req, res, next) => {
    try {
        const { collectionName } = req.params;
        ensureCollectionAllowed(collectionName);

        const { page, limit, skip } = parsePagination(req.query.page, req.query.limit);
        const sortField = (req.query.sortField || '_id').toString();
        const sortDirection = req.query.sortDirection === 'asc' ? 1 : -1;
        const query = buildSafeQuery({
            search: req.query.search?.toString(),
            filterJson: req.query.filterJson?.toString(),
            dateField: req.query.dateField?.toString(),
            dateFrom: req.query.dateFrom?.toString(),
            dateTo: req.query.dateTo?.toString(),
        });

        const collection = getCollection(collectionName);
        const [documentsRaw, total] = await Promise.all([
            collection
                .find(query, { maxTimeMS: 4000 })
                .sort({ [sortField]: sortDirection })
                .skip(skip)
                .limit(limit)
                .toArray(),
            collection.countDocuments(query, { maxTimeMS: 4000 }),
        ]);

        const documents = documentsRaw.map((doc) => maskSensitiveDocument(serializeForClient(doc)));
        const fields = buildFieldList(documents);

        res.json({
            status: 'success',
            data: {
                collectionName,
                documents,
                fields,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.max(1, Math.ceil(total / limit)),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

export const createDocument = async (req, res, next) => {
    try {
        const { collectionName } = req.params;
        ensureCollectionAllowed(collectionName);
        const parsedDocument = parseValidatedDocumentJson(JSON.stringify(req.body.document || {}));
        delete parsedDocument._id;

        const collection = getCollection(collectionName);
        const result = await collection.insertOne(parsedDocument);
        const created = await collection.findOne({ _id: result.insertedId });

        await createAuditLog({
            user: req.user,
            action: 'create',
            collectionName,
            documentId: result.insertedId.toString(),
            beforeData: null,
            afterData: created,
        });

        res.status(201).json({
            status: 'success',
            data: {
                document: maskSensitiveDocument(serializeForClient(created)),
            },
        });
    } catch (error) {
        next(error);
    }
};

export const updateDocument = async (req, res, next) => {
    try {
        const { collectionName, documentId } = req.params;
        ensureCollectionAllowed(collectionName);
        const _id = parseObjectId(documentId);
        const parsedDocument = parseValidatedDocumentJson(JSON.stringify(req.body.document || {}));
        delete parsedDocument._id;

        const collection = getCollection(collectionName);
        const before = await collection.findOne({ _id });
        if (!before) {
            return res.status(404).json({ status: 'fail', message: 'Document not found.' });
        }

        await collection.updateOne({ _id }, { $set: parsedDocument });
        const after = await collection.findOne({ _id });

        await createAuditLog({
            user: req.user,
            action: 'update',
            collectionName,
            documentId,
            beforeData: before,
            afterData: after,
        });

        res.json({
            status: 'success',
            data: {
                document: maskSensitiveDocument(serializeForClient(after)),
            },
        });
    } catch (error) {
        next(error);
    }
};

export const deleteDocument = async (req, res, next) => {
    try {
        const { collectionName, documentId } = req.params;
        ensureCollectionAllowed(collectionName);
        const _id = parseObjectId(documentId);
        const softDelete = req.query.softDelete === 'true';
        const collection = getCollection(collectionName);

        const before = await collection.findOne({ _id });
        if (!before) {
            return res.status(404).json({ status: 'fail', message: 'Document not found.' });
        }

        if (softDelete) {
            await collection.updateOne({ _id }, { $set: { deletedAt: new Date(), isDeleted: true } });
        } else {
            await collection.deleteOne({ _id });
        }

        await createAuditLog({
            user: req.user,
            action: 'delete',
            collectionName,
            documentId,
            beforeData: before,
            afterData: softDelete ? { ...before, deletedAt: new Date(), isDeleted: true } : null,
        });

        res.json({
            status: 'success',
            message: softDelete ? 'Document soft deleted.' : 'Document deleted.',
            data: null,
        });
    } catch (error) {
        next(error);
    }
};

export const getAuditLogs = async (req, res, next) => {
    try {
        const { page, limit, skip } = parsePagination(req.query.page, req.query.limit || `${DEFAULT_AUDIT_LIMIT}`);
        const collectionName = req.query.collectionName?.toString();
        const query = collectionName ? { collectionName } : {};

        const [logs, total] = await Promise.all([
            DatabaseAuditLog.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Math.min(limit, DEFAULT_AUDIT_LIMIT))
                .lean(),
            DatabaseAuditLog.countDocuments(query),
        ]);

        res.json({
            status: 'success',
            data: {
                logs,
                pagination: {
                    total,
                    page,
                    limit: Math.min(limit, DEFAULT_AUDIT_LIMIT),
                    totalPages: Math.max(1, Math.ceil(total / Math.min(limit, DEFAULT_AUDIT_LIMIT))),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};
