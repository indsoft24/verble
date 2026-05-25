import DailyContent from '../models/DailyContent.js';

/** Next sequence for type+level (1-based). */
export const getNextSequenceNumber = async (type, level) => {
    const last = await DailyContent.findOne({ type, level, isActive: { $ne: false } })
        .sort({ sequenceNumber: -1 })
        .select('sequenceNumber')
        .lean();
    return (last?.sequenceNumber || 0) + 1;
};

export const assignSequenceNumberIfMissing = async (doc) => {
    if (doc.sequenceNumber && doc.sequenceNumber > 0) return doc.sequenceNumber;
    const seq = await getNextSequenceNumber(doc.type, doc.level);
    doc.sequenceNumber = seq;
    await doc.save();
    return seq;
};

export const attachSequenceNumbers = async (items) => {
    return Promise.all(
        items.map(async (item) => {
            const obj = item.toObject ? item.toObject() : { ...item };
            if (!obj.sequenceNumber) {
                const seq = await getContentSequenceNumber(obj._id, obj.type, obj.level);
                obj.sequenceNumber = seq;
            }
            return obj;
        })
    );
};

/** Fallback rank by date when sequenceNumber not stored. */
export const getContentSequenceNumber = async (id, type, level) => {
    const doc = await DailyContent.findById(id).select('sequenceNumber date type level').lean();
    if (!doc) return 0;
    if (doc.sequenceNumber) return doc.sequenceNumber;
    const earlier = await DailyContent.countDocuments({
        type: doc.type,
        level: doc.level,
        isActive: { $ne: false },
        $or: [{ date: { $lt: doc.date } }, { date: doc.date, _id: { $lte: id } }],
    });
    return earlier || 1;
};
