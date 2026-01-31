import apiClient from './apiClient';

// Define the structure of a single chat message
export interface ChatMessage {
    role: 'user' | 'model'; // 'model' represents the AI
    parts: { text: string }[];
}

// The data we send to the backend
interface ChatPayload {
    message: string;
    history: ChatMessage[];
}

// The response we expect from the backend
interface ChatResponse {
    status: string;
    message: string; // This will be the AI's text response
}

/**
 * Sends a user's message and chat history to the backend AI service.
 * @param payload - An object containing the new message and the history.
 * @returns The AI's response message.
 */
export const sendChatMessage = async (payload: ChatPayload): Promise<string> => {
    try {
        const response = await apiClient.post<ChatResponse>('/ai/chat', payload);
        if (response.data?.status === 'success' && response.data.message) {
            return response.data.message;
        }
        throw new Error(response.data?.message || 'Failed to get a response from the assistant.');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};
