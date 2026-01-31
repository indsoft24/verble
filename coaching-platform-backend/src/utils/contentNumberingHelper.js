// src/utils/contentNumberingHelper.js
import DailyContent from '../models/DailyContent.js';

/**
 * Calculate sequence number for content based on type, level, and date
 * Sequence number is the count of items of the same type and level up to and including the current date
 * 
 * @param {string} contentId - The content ID
 * @param {string} type - Content type (WORD, PHRASE, STORY, etc.)
 * @param {string} level - Content level (FREE, BRONZE, SILVER, GOLD)
 * @param {Date} date - Content date
 * @returns {Promise<number>} - Sequence number (1-based)
 */
export const getContentSequenceNumber = async (contentId, type, level, date) => {
    try {
        const targetDate = new Date(date);
        targetDate.setHours(23, 59, 59, 999); // End of day

        // Get all content of same type and level up to target date, sorted by date and _id
        const allContent = await DailyContent.find({
            type: type,
            level: level,
            date: { $lte: targetDate },
            isActive: true
        }).sort({ date: 1, createdAt: 1, _id: 1 }).select('_id date createdAt').lean();

        // Find the index of current content
        const currentIndex = allContent.findIndex(
            item => item._id.toString() === contentId.toString()
        );

        // Return 1-based sequence number
        return currentIndex >= 0 ? currentIndex + 1 : 0;
    } catch (error) {
        console.error('Error calculating sequence number:', error);
        return 0;
    }
};

/**
 * Get sequence numbers for multiple content items
 * 
 * @param {Array} contents - Array of content items with _id, type, level, date
 * @returns {Promise<Array>} - Array of { contentId, sequenceNumber }
 */
export const getContentSequenceNumbers = async (contents) => {
    try {
        const sequenceNumbers = await Promise.all(
            contents.map(async (content) => {
                const seqNum = await getContentSequenceNumber(
                    content._id,
                    content.type,
                    content.level,
                    content.date
                );
                return {
                    contentId: content._id.toString(),
                    sequenceNumber: seqNum
                };
            })
        );

        return sequenceNumbers;
    } catch (error) {
        console.error('Error calculating sequence numbers:', error);
        return [];
    }
};
