import type { GridPaginationModel } from '@mui/x-data-grid';

export type AdminVideosGroupingMode = 'flat' | 'course-module' | 'module';

export interface AdminVideosListFilterState {
    selectedCourseIds: string[];
    selectedModuleIds: string[];
    selectedPlanIds: string[];
    isPublishedFilter: string;
    videoStatusFilter: string;
    searchTerm: string;
    groupingMode: AdminVideosGroupingMode;
    paginationModel: GridPaginationModel;
}

export const ADMIN_VIDEOS_LIST_FILTERS_KEY = 'adminVideosListFilters';
export const ADMIN_VIDEOS_LIST_SEARCH_KEY = 'adminVideosListFiltersSearch';

export const DEFAULT_ADMIN_VIDEOS_LIST_FILTERS: AdminVideosListFilterState = {
    selectedCourseIds: [],
    selectedModuleIds: [],
    selectedPlanIds: [],
    isPublishedFilter: 'all',
    videoStatusFilter: 'all',
    searchTerm: '',
    groupingMode: 'flat',
    paginationModel: { page: 0, pageSize: 10 },
};

const GROUPING_MODES: AdminVideosGroupingMode[] = ['flat', 'course-module', 'module'];

const splitIds = (value: string | null): string[] =>
    value?.split(',').map((id) => id.trim()).filter(Boolean) ?? [];

const parsePage = (value: string | null, fallback: number): number => {
    const parsed = Number.parseInt(value ?? '', 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const parsePageSize = (value: string | null, fallback: number): number => {
    const parsed = Number.parseInt(value ?? '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const parseGroupingMode = (value: string | null): AdminVideosGroupingMode =>
    GROUPING_MODES.includes(value as AdminVideosGroupingMode)
        ? (value as AdminVideosGroupingMode)
        : 'flat';

export const filtersFromSearchParams = (params: URLSearchParams): AdminVideosListFilterState => ({
    selectedCourseIds: splitIds(params.get('courseIds')),
    selectedModuleIds: splitIds(params.get('moduleIds')),
    selectedPlanIds: splitIds(params.get('planIds')),
    isPublishedFilter: params.get('published') || 'all',
    videoStatusFilter: params.get('status') || 'all',
    searchTerm: params.get('q') || '',
    groupingMode: parseGroupingMode(params.get('groupBy')),
    paginationModel: {
        page: parsePage(params.get('page'), 0),
        pageSize: parsePageSize(params.get('pageSize'), 10),
    },
});

export const hasFilterParams = (params: URLSearchParams): boolean =>
    Boolean(
        params.get('courseIds')
        || params.get('moduleIds')
        || params.get('planIds')
        || params.get('published')
        || params.get('status')
        || params.get('q')
        || params.get('groupBy')
        || params.get('page')
        || params.get('pageSize')
    );

export const filtersToSearchParams = (filters: AdminVideosListFilterState): URLSearchParams => {
    const params = new URLSearchParams();

    if (filters.selectedCourseIds.length > 0) {
        params.set('courseIds', filters.selectedCourseIds.join(','));
    }
    if (filters.selectedModuleIds.length > 0) {
        params.set('moduleIds', filters.selectedModuleIds.join(','));
    }
    if (filters.selectedPlanIds.length > 0) {
        params.set('planIds', filters.selectedPlanIds.join(','));
    }
    if (filters.isPublishedFilter !== 'all') {
        params.set('published', filters.isPublishedFilter);
    }
    if (filters.videoStatusFilter !== 'all') {
        params.set('status', filters.videoStatusFilter);
    }
    if (filters.searchTerm.trim()) {
        params.set('q', filters.searchTerm.trim());
    }
    if (filters.groupingMode !== 'flat') {
        params.set('groupBy', filters.groupingMode);
    }
    if (filters.paginationModel.page > 0) {
        params.set('page', String(filters.paginationModel.page));
    }
    if (filters.paginationModel.pageSize !== 10) {
        params.set('pageSize', String(filters.paginationModel.pageSize));
    }

    return params;
};

export const searchStringFromFilters = (filters: AdminVideosListFilterState): string =>
    filtersToSearchParams(filters).toString();

export const readFiltersFromSessionStorage = (): AdminVideosListFilterState | null => {
    try {
        const raw = sessionStorage.getItem(ADMIN_VIDEOS_LIST_FILTERS_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<AdminVideosListFilterState>;
        return {
            ...DEFAULT_ADMIN_VIDEOS_LIST_FILTERS,
            ...parsed,
            paginationModel: {
                ...DEFAULT_ADMIN_VIDEOS_LIST_FILTERS.paginationModel,
                ...(parsed.paginationModel ?? {}),
            },
        };
    } catch {
        return null;
    }
};

export const writeFiltersToSessionStorage = (filters: AdminVideosListFilterState): void => {
    try {
        sessionStorage.setItem(ADMIN_VIDEOS_LIST_FILTERS_KEY, JSON.stringify(filters));
        sessionStorage.setItem(ADMIN_VIDEOS_LIST_SEARCH_KEY, searchStringFromFilters(filters));
    } catch {
        // ignore quota / private mode errors
    }
};

export const clearFiltersSessionStorage = (): void => {
    try {
        sessionStorage.removeItem(ADMIN_VIDEOS_LIST_FILTERS_KEY);
        sessionStorage.removeItem(ADMIN_VIDEOS_LIST_SEARCH_KEY);
    } catch {
        // ignore
    }
};

export const hasActiveVideoFilters = (
    filters: Pick<
        AdminVideosListFilterState,
        | 'selectedCourseIds'
        | 'selectedModuleIds'
        | 'selectedPlanIds'
        | 'isPublishedFilter'
        | 'videoStatusFilter'
        | 'searchTerm'
    >,
    debouncedSearchTerm: string
): boolean =>
    filters.selectedCourseIds.length > 0
    || filters.selectedModuleIds.length > 0
    || filters.selectedPlanIds.length > 0
    || filters.isPublishedFilter !== 'all'
    || filters.videoStatusFilter !== 'all'
    || debouncedSearchTerm.trim().length > 0;
