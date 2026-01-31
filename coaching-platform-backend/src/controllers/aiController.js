import asyncHandler from 'express-async-handler';
import KnowledgeBaseArticle from '../models/KnowledgeBaseArticle.js';

/**
 * @desc    Handle a chat message from a user, get a response from AI
 * @route   POST /api/ai/chat
 * @access  Public (after lead submission)
 */
export const handleChat = asyncHandler(async (req, res) => {
    const { message, history } = req.body;

    if (!message) {
        res.status(400);
        throw new Error('A message is required.');
    }

    // 1. Fetch the knowledge base from your database
    const articles = await KnowledgeBaseArticle.find({ isEnabled: true }).select('title content keywords');
    
    let knowledgeBase = "You are Verble's helpful AI assistant. Your knowledge base consists of the following articles. Use this information to answer the user's questions. Do not mention that you are using a knowledge base. Be friendly and concise.\n\n";
    articles.forEach(article => {
        knowledgeBase += `--- Article: ${article.title} ---\n`;
        knowledgeBase += `${article.content}\n`;
        knowledgeBase += `Keywords: ${article.keywords.join(', ')}\n\n`;
    });

    // 2. Construct the prompt for the Gemini API
    // We provide the full context: the knowledge base, the chat history, and the new message.
    const chatHistory = [
        { role: "user", parts: [{ text: knowledgeBase }] },
        { role: "model", parts: [{ text: "I understand. I am Verble's helpful AI assistant. I will use the provided articles to answer questions." }] },
        ...(history || []), // Spread the existing chat history
        { role: "user", parts: [{ text: message }] }
    ];

    const payload = {
        contents: chatHistory,
        generationConfig: {
            temperature: 0.7,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
        },
    };

    // 3. Call the Gemini API
    try {
        const apiKey = process.env.GEMINI_API_KEY; 
        if (!apiKey) {
            throw new Error("Gemini API key is not configured on the server.");
        }
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error("Gemini API Error:", errorBody);
            throw new Error(`AI service failed with status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.candidates && result.candidates.length > 0 && result.candidates[0].content?.parts[0]?.text) {
            const aiResponse = result.candidates[0].content.parts[0].text;
            res.status(200).json({ status: 'success', message: aiResponse });
        } else {
            throw new Error("Received an invalid response from the AI service.");
        }

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        res.status(500).json({ 
            status: "error",
            message: "Failed to get a response from the AI assistant." 
        });
    }
});
