// File: src/services/leadService.ts

import apiClient from './apiClient';

// Interface for the data sent from the lead capture form
export interface LeadSubmissionData {
    name: string;
    email: string;
    phoneNumber: string;
    interestedCourses: string[];
    otherCourseInterest?: string;
    sourceUrl: string;
    postId?: string;
    attachmentId?: string;
    sourceType?: string;
    webinarUrl?: string;
}

// Interface for the successful API response, which includes the download token
interface GatedFileLeadResponse {
    status: string;
    message: string;
    token: string;
}

interface ChatbotLeadResponse {
    status: string;
    message: string;
    webinarLink?: string | null;
}

/**
 * Submits the lead capture form and returns a secure download token.
 * @param leadData The user's details from the form.
 */
export const submitLeadAndGetToken = async (leadData: LeadSubmissionData): Promise<{ token: string }> => {
    try {
        const response = await apiClient.post<GatedFileLeadResponse>('/leads/submit', leadData);
        if (response.data?.status === 'success' && response.data.token) {
            return { token: response.data.token };
        }
        throw new Error(response.data?.message || 'Failed to submit form.');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

/**
 * Submits the lead capture form from the general chatbot widget.
 * @param leadData The user's details from the form.
 */
export const submitChatbotLead = async (leadData: LeadSubmissionData): Promise<ChatbotLeadResponse> => {
    try {
        // This uses the same backend endpoint, which is efficient.
        // The backend will simply not find a postId or attachmentId and will skip the token generation part.
        const response = await apiClient.post<ChatbotLeadResponse>('/leads/general', leadData);
        
        if (response.data?.status === 'success') {
            return response.data;
        }
        throw new Error(response.data?.message || 'Failed to submit form.');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};