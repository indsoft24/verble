/** Default membership level per API content type (admin no longer picks level manually). */

const GOLD_MEDIA = ['SCENE', 'SPEECH', 'LYRICS', 'FEED'];

export const deriveLevelFromType = (type, metadata = {}) => {
    switch (type) {
        case 'WORD':
        case 'PHRASE':
            return 'FREE';
        case 'STORY':
        case 'VOCAB_SET':
            return 'BRONZE';
        case 'CONVERSATION':
            return metadata?.isProfessionalLibrary ? 'GOLD' : 'SILVER';
        case 'PUZZLE':
            return 'SILVER';
        case 'SCENE':
        case 'SPEECH':
        case 'LYRICS':
        case 'FEED':
            return 'GOLD';
        default:
            return 'FREE';
    }
};

export const assertGoldMediaLevel = (type, level) => {
    if (GOLD_MEDIA.includes(type) && !['GOLD', 'BONUS'].includes(level)) {
        throw new Error(
            `${type} must use level GOLD or BONUS to appear in the Premium (Gold) learner section.`
        );
    }
};

export const DISPLAY_NUMBER_BASE = 1110;

export const getDisplayTag = (sequenceNumber) => {
    if (!sequenceNumber || sequenceNumber < 1) return '';
    return `#${DISPLAY_NUMBER_BASE + sequenceNumber}`;
};

export const buildAutoTitle = (type, sequenceNumber, metadata = {}) => {
    if (!sequenceNumber || sequenceNumber < 1) {
        return type;
    }
    const tag = getDisplayTag(sequenceNumber);
    if (type === 'PUZZLE') {
        return metadata.puzzleType === 'GRAMMAR_FILL_BLANK'
            ? `${tag} Grammar Puzzle`
            : `${tag} Spot Puzzle`;
    }
    return tag;
};
