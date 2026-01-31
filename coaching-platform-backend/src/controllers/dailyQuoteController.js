// src/controllers/dailyQuoteController.js
import asyncHandler from 'express-async-handler';

// Sample quotes - In production, these could be stored in a database
const dailyQuotes = [
    {
        quote: 'Every day is a new opportunity to learn and grow.',
        author: 'Anonymous'
    },
    {
        quote: 'The beautiful thing about learning is that no one can take it away from you.',
        author: 'B.B. King'
    },
    {
        quote: 'Education is the most powerful weapon which you can use to change the world.',
        author: 'Nelson Mandela'
    },
    {
        quote: 'Learning never exhausts the mind.',
        author: 'Leonardo da Vinci'
    },
    {
        quote: 'The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.',
        author: 'Brian Herbert'
    },
    {
        quote: 'Live as if you were to die tomorrow. Learn as if you were to live forever.',
        author: 'Mahatma Gandhi'
    },
    {
        quote: 'The more that you read, the more things you will know. The more that you learn, the more places you\'ll go.',
        author: 'Dr. Seuss'
    },
    {
        quote: 'Success is the sum of small efforts repeated day in and day out.',
        author: 'Robert Collier'
    },
    {
        quote: 'The expert in anything was once a beginner.',
        author: 'Helen Hayes'
    },
    {
        quote: 'Your limitation—it\'s only your imagination.',
        author: 'Anonymous'
    }
];

/**
 * @desc    Get daily quote
 * @route   GET /api/daily-quote
 * @access  Public
 */
export const getDailyQuote = asyncHandler(async (req, res) => {
    // Get a quote based on the day of the year (ensures same quote for the same day)
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((today - startOfYear) / (1000 * 60 * 60 * 24));
    
    // Use day of year as index to get consistent quote for the day
    const quoteIndex = dayOfYear % dailyQuotes.length;
    const selectedQuote = dailyQuotes[quoteIndex];

    res.status(200).json({
        status: 'success',
        data: {
            quote: selectedQuote.quote,
            author: selectedQuote.author
        }
    });
});
