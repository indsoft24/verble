// src/services/offerService.ts
import apiClient from './apiClient';

export interface Offer {
    _id: string;
    title: string;
    description?: string;
    type: 'OFFER' | 'WEBINAR';
    imageUrl?: string;
    linkUrl?: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    priority: number;
}

export interface OffersResponse {
    status: string;
    data: {
        offers: Offer[];
    };
}

export const getActiveOffers = async (): Promise<Offer[]> => {
    const response = await apiClient.get<OffersResponse>('/offers');
    return response.data.data.offers;
};
