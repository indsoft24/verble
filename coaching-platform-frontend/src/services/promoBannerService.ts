// src/services/promoBannerService.ts
import apiClient from './apiClient';

export interface PromoBanner {
    _id?: string;
    key?: string;
    isEnabled: boolean;
    title: string;
    batchText: string;
    urgencyText: string;
    ctaText: string;
    ctaUrl: string;
    originalPrice: string;
    offerPrice: string;
    countdownMinutes: number;
    updatedAt?: string;
}

export interface PromoBannerResponse {
    status: string;
    data: { promoBanner: PromoBanner };
}

export const getPromoBanner = async (): Promise<PromoBanner | null> => {
    const response = await apiClient.get<PromoBannerResponse>('/promo-banner');
    const banner = response.data.data.promoBanner;
    return banner.isEnabled ? banner : null;
};

export const getPromoBannerAdmin = async (): Promise<PromoBanner> => {
    const response = await apiClient.get<PromoBannerResponse>('/admin/promo-banner');
    return response.data.data.promoBanner;
};

export const updatePromoBanner = async (data: Partial<PromoBanner>): Promise<PromoBanner> => {
    const response = await apiClient.put<PromoBannerResponse>('/admin/promo-banner', data);
    return response.data.data.promoBanner;
};
