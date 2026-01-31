// src/services/aiValidationService.js
/**
 * AI-based sentence validation service
 * This service can integrate with AI APIs (OpenAI, Google AI, etc.) to automatically validate sentences
 * 
 * Note: This is a placeholder implementation. To use AI validation, you need to:
 * 1. Install an AI SDK (e.g., openai, @google/generative-ai)
 * 2. Set up API keys in environment variables
 * 3. Implement the actual AI validation logic
 */

/**
 * Validate a sentence using AI
 * @param {string} sentence - The sentence to validate
 * @param {string} word - The word/phrase the sentence should use
 * @param {string} context - Optional context (e.g., word meaning, examples)
 * @returns {Promise<{isCorrect: boolean, confidence: number, feedback?: string}>}
 */
export const validateSentenceWithAI = async (sentence, word, context = '') => {
    // Check if AI validation is enabled
    if (process.env.ENABLE_AI_VALIDATION !== 'true') {
        return null; // AI validation disabled
    }

    try {
        // Placeholder for AI validation
        // Example integration with OpenAI:
        /*
        const OpenAI = require('openai');
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const prompt = `Validate if the following sentence correctly uses the word "${word}".
        
Word meaning: ${context}

Sentence: "${sentence}"

Respond with JSON: {"isCorrect": true/false, "confidence": 0.0-1.0, "feedback": "explanation"}`;

        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
        });

        const result = JSON.parse(response.choices[0].message.content);
        return {
            isCorrect: result.isCorrect,
            confidence: result.confidence || 0.5,
            feedback: result.feedback || '',
        };
        */

        // For now, return null to indicate AI validation is not implemented
        // This allows the system to fall back to manual validation
        return null;
    } catch (error) {
        console.error('[AIValidationService] Error validating sentence:', error);
        return null; // Return null on error to fall back to manual validation
    }
};

/**
 * Validate multiple sentences using AI (batch processing)
 * @param {Array<{sentence: string, word: string, context?: string}>} sentences - Array of sentences to validate
 * @returns {Promise<Array<{isCorrect: boolean, confidence: number, feedback?: string}>>}
 */
export const validateSentencesBatch = async (sentences) => {
    if (process.env.ENABLE_AI_VALIDATION !== 'true') {
        return null;
    }

    try {
        // Batch validation logic would go here
        // For now, return null
        return null;
    } catch (error) {
        console.error('[AIValidationService] Error validating sentences batch:', error);
        return null;
    }
};

/**
 * Auto-validate simple sentences (basic grammar and word usage check)
 * This is a simple rule-based validation that can work without AI
 * @param {string} sentence - The sentence to validate
 * @param {string} word - The word that should be used
 * @returns {Promise<{isCorrect: boolean, confidence: number, feedback?: string} | null>}
 */
export const autoValidateSimpleSentence = async (sentence, word) => {
    try {
        // Basic validation rules
        const lowerSentence = sentence.toLowerCase();
        const lowerWord = word.toLowerCase();

        // Check if word is in sentence
        if (!lowerSentence.includes(lowerWord)) {
            return {
                isCorrect: false,
                confidence: 0.9,
                feedback: `The sentence does not contain the word "${word}".`,
            };
        }

        // Basic grammar check (sentence should end with punctuation)
        const hasPunctuation = /[.!?]$/.test(sentence.trim());
        if (!hasPunctuation) {
            return {
                isCorrect: false,
                confidence: 0.7,
                feedback: 'The sentence should end with proper punctuation (. ! ?).',
            };
        }

        // Basic length check (too short might be incomplete)
        if (sentence.trim().split(/\s+/).length < 3) {
            return {
                isCorrect: false,
                confidence: 0.6,
                feedback: 'The sentence seems too short. Please provide a complete sentence.',
            };
        }

        // If basic checks pass, return null to indicate manual review needed
        // This allows simple sentences to pass basic validation but still be reviewed
        return {
            isCorrect: true,
            confidence: 0.5, // Low confidence - needs manual review
            feedback: 'Basic checks passed. Manual review recommended.',
        };
    } catch (error) {
        console.error('[AIValidationService] Error in auto-validation:', error);
        return null;
    }
};
