// File: src/services/notificationService.ts
import apiClient from './apiClient';

export interface Notification {
    _id: string;
    user: string;
    title: string;
    message: string;
    isRead: boolean;
    link?: string;
    type: 'announcement' | 'new_content' | 'subscription' | 'default';
    createdAt: string;
    updatedAt: string;
    categoryKey?: string;
    categoryLabel?: string;
    examCategory?: string;
}

interface GetNotificationsResponse {
    status: string;
    results: number;
    data: {
        notifications: Notification[];
        unreadCount: number;
        filteredUnreadCount?: number;
        categories?: NotificationCategoryStat[];
    };
}

export interface NotificationCategoryStat {
    key: string;
    label: string;
    total: number;
    unread: number;
}

interface MarkAsReadResponse {
    status: string;
    data: {
        notification: Notification;
    };
}

interface MarkAllAsReadResponse {
    status: string;
    message: string;
}

interface DeleteNotificationResponse {
    status: string;
    message: string;
    data: null;
}

interface DeleteAllNotificationsResponse {
    status: string;
    message: string;
    data: {
        deletedCount: number;
    };
}

/**
 * Get all notifications for the logged-in user
 */
export const getUserNotifications = async (categoryKey?: string): Promise<{
    notifications: Notification[];
    unreadCount: number;
    filteredUnreadCount: number;
    categories: NotificationCategoryStat[];
}> => {
    try {
        const response = await apiClient.get<GetNotificationsResponse>('/notifications', {
            params: categoryKey ? { category: categoryKey } : undefined,
        });
        if (response.data?.status === 'success' && response.data.data) {
            return {
                notifications: response.data.data.notifications,
                unreadCount: response.data.data.unreadCount,
                filteredUnreadCount: response.data.data.filteredUnreadCount ?? response.data.data.unreadCount,
                categories: response.data.data.categories ?? [],
            };
        }
        throw new Error('Failed to fetch notifications');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

/**
 * Mark a single notification as read
 */
export const markNotificationAsRead = async (notificationId: string): Promise<Notification> => {
    try {
        const response = await apiClient.post<MarkAsReadResponse>(`/notifications/${notificationId}/read`);
        if (response.data?.status === 'success' && response.data.data?.notification) {
            return response.data.data.notification;
        }
        throw new Error('Failed to mark notification as read');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (categoryKey?: string): Promise<void> => {
    try {
        const response = await apiClient.post<MarkAllAsReadResponse>('/notifications/mark-all-read', null, {
            params: categoryKey ? { category: categoryKey } : undefined,
        });
        if (response.data?.status !== 'success') {
            throw new Error(response.data?.message || 'Failed to mark all notifications as read');
        }
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

/**
 * Delete a single notification
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
    try {
        const response = await apiClient.delete<DeleteNotificationResponse>(`/notifications/${notificationId}`);
        if (response.data?.status !== 'success') {
            throw new Error(response.data?.message || 'Failed to delete notification');
        }
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

/**
 * Delete all notifications for the logged-in user
 */
export const deleteAllNotifications = async (categoryKey?: string): Promise<number> => {
    try {
        const response = await apiClient.delete<DeleteAllNotificationsResponse>('/notifications', {
            params: categoryKey ? { category: categoryKey } : undefined,
        });
        if (response.data?.status === 'success' && response.data.data) {
            return response.data.data.deletedCount;
        }
        throw new Error(response.data?.message || 'Failed to delete all notifications');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

