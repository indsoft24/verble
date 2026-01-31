// File: src/services/moduleAdminService.ts
import apiClient from './apiClient'; 

// Interface for Module data (should match your backend Module model)
export interface Module {
    _id: string;
    title: string;
    description?: string;
    image?: string;
    course: string | { _id: string; title: string }; 
    subscriptionPlans?: string[] | { _id: string; name: string; price: number; currency: string }[];
    order: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface ModuleInput extends Omit<Partial<Module>, '_id' | 'createdAt' | 'updatedAt' | 'course'> {
    title: string; 
}

// API Response Interfaces
interface GetAllModulesAdminResponse {
    status: string;
    results?: number;
    data: {
        modules: Module[];
    };
    message?: string;
}

interface SingleModuleAdminResponse {
    status: string;
    data: {
        module: Module;
    };
    message?: string;
}

interface DeleteModuleAdminResponse {
    status: string;
    data: null;
    message?: string;
}

/**
 * Fetches all modules across all courses (Admin)
 */
export const getAllModulesAdmin = async (): Promise<Module[]> => {
    try {
        const response = await apiClient.get<GetAllModulesAdminResponse>('/admin/modules');
        if (response.data && response.data.status === 'success' && response.data.data?.modules) {
            return response.data.data.modules;
        }
        throw new Error(response.data?.message || 'Failed to fetch modules');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

/**
 * Fetches all modules for a specific course (Admin)
 */
export const getModulesForCourseAdmin = async (courseId: string): Promise<Module[]> => {
    try {
        const response = await apiClient.get<GetAllModulesAdminResponse>(`/admin/courses/${courseId}/modules`);
        if (response.data && response.data.status === 'success' && response.data.data?.modules) {
            return response.data.data.modules;
        }
        throw new Error(response.data?.message || 'Failed to fetch modules for course');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

/**
 * Creates a new module for a specific course (Admin)
 */
export const createModuleAdmin = async (courseId: string, moduleData: ModuleInput | FormData): Promise<Module> => {
    try {
        const response = await apiClient.post<SingleModuleAdminResponse>(`/admin/courses/${courseId}/modules`, moduleData, {
            headers: {
                'Content-Type': moduleData instanceof FormData ? 'multipart/form-data' : 'application/json'
            }
        });
        if (response.data && response.data.status === 'success' && response.data.data.module) {
            return response.data.data.module;
        }
        throw new Error(response.data?.message || 'Failed to create module');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

/**
 * Updates an existing module by its ID (Admin)
 */
export const updateModuleAdmin = async (moduleId: string, moduleData: Partial<ModuleInput> | FormData): Promise<Module> => {
    try {
        const response = await apiClient.patch<SingleModuleAdminResponse>(`/admin/modules/${moduleId}`, moduleData, {
            headers: {
                'Content-Type': moduleData instanceof FormData ? 'multipart/form-data' : 'application/json'
            }
        });
        if (response.data && response.data.status === 'success' && response.data.data.module) {
            return response.data.data.module;
        }
        throw new Error(response.data?.message || 'Failed to update module');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

/**
 * Deletes a module by its ID (Admin)
 */
export const deleteModuleAdmin = async (moduleId: string): Promise<void> => {
    try {
        const response = await apiClient.delete<DeleteModuleAdminResponse | ''>(`/admin/modules/${moduleId}`);
        if (response.status === 204) return; // No content, successful delete
        if (response.data && (response.data as DeleteModuleAdminResponse).status === 'success') return;
        
        if (response.status < 200 || response.status >= 300) {
             throw new Error((response.data as any)?.message || `Failed to delete module with status ${response.status}`);
        }
    } catch (error: any) {
        throw error.response?.data || error;
    }
};

/**
 * Fetches a single module by its ID (Admin) - Useful for pre-filling edit form
 */
export const getModuleByIdAdmin = async (moduleId: string): Promise<Module> => {
    try {
        const response = await apiClient.get<SingleModuleAdminResponse>(`/admin/modules/${moduleId}`);
        if (response.data && response.data.status === 'success' && response.data.data.module) {
            return response.data.data.module;
        }
        throw new Error(response.data?.message || 'Failed to fetch module details');
    } catch (error: any) {
        throw error.response?.data || error;
    }
};