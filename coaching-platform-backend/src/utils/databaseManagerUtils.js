import mongoose from 'mongoose';

const MAX_FILTER_JSON_LENGTH = 8000;
const MAX_DOCUMENT_JSON_LENGTH = 200000;
const DEFAULT_RESTRICTED_COLLECTIONS = ['system.profile', 'system.js'];
const SENSITIVE_FIELD_PATTERNS = [
    /password/i,
    /token/i,
    /secret/i,
    /api[-_]?key/i,
    /private[-_]?key/i,
    /refresh[-_]?token/i,
    /access[-_]?token/i,
];
const SAFE_OPERATORS = new Set([
    '$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin',
    '$exists', '$and', '$or', '$nor', '$not',
]);
const UNSAFE_OPERATORS = new Set([
    '$where', '$function', '$accumulator', '$expr', '$jsonSchema',
    '$regex', '$text', '$geoNear', '$near', '$nearSphere',
]);

export const parseEnvList = (value = '') =>
    value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

export const isSystemCollection = (collectionName) => collectionName.startsWith('system.');

export const getRestrictedCollections = () => {
    const fromEnv = parseEnvList(process.env.DB_MANAGER_RESTRICTED_COLLECTIONS || '');
    return new Set([...DEFAULT_RESTRICTED_COLLECTIONS, ...fromEnv]);
};

export const ensureCollectionAllowed = (collectionName) => {
    if (!collectionName || typeof collectionName !== 'string') {
        throw new Error('Invalid collection name.');
    }
    if (isSystemCollection(collectionName)) {
        throw new Error('System collections are not accessible.');
    }
    if (getRestrictedCollections().has(collectionName)) {
        throw new Error('This collection is restricted.');
    }
};

const toObjectIdIfPossible = (value) => {
    if (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
        return new mongoose.Types.ObjectId(value);
    }
    return value;
};

const normalizeSpecialValue = (value) => {
    if (Array.isArray(value)) {
        return value.map((item) => normalizeSpecialValue(item));
    }
    if (!value || typeof value !== 'object') {
        return toObjectIdIfPossible(value);
    }
    if (Object.keys(value).length === 1 && value.$oid && typeof value.$oid === 'string') {
        if (!mongoose.Types.ObjectId.isValid(value.$oid)) {
            throw new Error(`Invalid ObjectId value: ${value.$oid}`);
        }
        return new mongoose.Types.ObjectId(value.$oid);
    }
    if (Object.keys(value).length === 1 && value.$date) {
        const parsedDate = new Date(value.$date);
        if (Number.isNaN(parsedDate.getTime())) {
            throw new Error(`Invalid date value: ${value.$date}`);
        }
        return parsedDate;
    }

    return Object.fromEntries(
        Object.entries(value).map(([key, nestedValue]) => [key, normalizeSpecialValue(nestedValue)])
    );
};

const validateFilterOperators = (input) => {
    if (!input || typeof input !== 'object') {
        return;
    }
    if (Array.isArray(input)) {
        input.forEach(validateFilterOperators);
        return;
    }
    for (const [key, value] of Object.entries(input)) {
        if (key.startsWith('$')) {
            if (UNSAFE_OPERATORS.has(key)) {
                throw new Error(`Operator ${key} is not allowed.`);
            }
            if (!SAFE_OPERATORS.has(key)) {
                throw new Error(`Operator ${key} is not supported.`);
            }
        }
        validateFilterOperators(value);
    }
};

export const parseValidatedJsonInput = (input, maxLength = MAX_FILTER_JSON_LENGTH) => {
    if (!input) {
        return null;
    }
    if (input.length > maxLength) {
        throw new Error('JSON payload too large.');
    }
    let parsed;
    try {
        parsed = JSON.parse(input);
    } catch (error) {
        throw new Error('Invalid JSON payload.');
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('JSON input must be an object.');
    }
    validateFilterOperators(parsed);
    return normalizeSpecialValue(parsed);
};

export const parseValidatedDocumentJson = (input) => parseValidatedJsonInput(input, MAX_DOCUMENT_JSON_LENGTH);

export const buildSafeQuery = ({ search, filterJson, dateField, dateFrom, dateTo }) => {
    const query = {};
    if (filterJson) {
        Object.assign(query, parseValidatedJsonInput(filterJson));
    }

    if (search && search.trim()) {
        const value = search.trim().slice(0, 100);
        query.$or = [
            { _id: toObjectIdIfPossible(value) },
            { name: { $regex: value, $options: 'i' } },
            { title: { $regex: value, $options: 'i' } },
            { email: { $regex: value, $options: 'i' } },
            { slug: { $regex: value, $options: 'i' } },
        ];
    }

    if (dateField && (dateFrom || dateTo)) {
        const dateFilter = {};
        if (dateFrom) {
            const from = new Date(dateFrom);
            if (Number.isNaN(from.getTime())) throw new Error('Invalid dateFrom value.');
            dateFilter.$gte = from;
        }
        if (dateTo) {
            const to = new Date(dateTo);
            if (Number.isNaN(to.getTime())) throw new Error('Invalid dateTo value.');
            dateFilter.$lte = to;
        }
        query[dateField] = dateFilter;
    }

    return query;
};

const shouldMask = (key) => SENSITIVE_FIELD_PATTERNS.some((pattern) => pattern.test(key));

export const maskSensitiveDocument = (value) => {
    if (Array.isArray(value)) {
        return value.map(maskSensitiveDocument);
    }
    if (!value || typeof value !== 'object') {
        return value;
    }
    return Object.fromEntries(
        Object.entries(value).map(([key, nestedValue]) => [
            key,
            shouldMask(key) ? '***MASKED***' : maskSensitiveDocument(nestedValue),
        ])
    );
};

export const serializeForClient = (document) =>
    JSON.parse(
        JSON.stringify(document, (_, value) => {
            if (value && value._bsontype === 'ObjectId') {
                return value.toString();
            }
            if (value instanceof Date) {
                return value.toISOString();
            }
            return value;
        })
    );

export const buildFieldList = (docs = []) => {
    const fields = new Set(['_id']);
    docs.forEach((doc) => {
        Object.keys(doc || {}).forEach((key) => fields.add(key));
    });
    return [...fields];
};
