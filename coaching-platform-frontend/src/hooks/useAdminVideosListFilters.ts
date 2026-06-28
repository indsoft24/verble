import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { GridPaginationModel } from '@mui/x-data-grid';
import {
    ADMIN_VIDEOS_LIST_SEARCH_KEY,
    clearFiltersSessionStorage,
    DEFAULT_ADMIN_VIDEOS_LIST_FILTERS,
    filtersFromSearchParams,
    filtersToSearchParams,
    hasActiveVideoFilters,
    hasFilterParams,
    readFiltersFromSessionStorage,
    searchStringFromFilters,
    writeFiltersToSessionStorage,
    type AdminVideosGroupingMode,
    type AdminVideosListFilterState,
} from '../utils/adminVideosListFilterStorage';

const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

const readInitialFilters = (searchParams: URLSearchParams): AdminVideosListFilterState => {
    if (hasFilterParams(searchParams)) {
        return filtersFromSearchParams(searchParams);
    }
    return readFiltersFromSessionStorage() ?? DEFAULT_ADMIN_VIDEOS_LIST_FILTERS;
};

export function useAdminVideosListFilters() {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialFilters = useMemo(() => readInitialFilters(searchParams), []);
    const skipNextSyncRef = useRef(false);

    const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(initialFilters.selectedCourseIds);
    const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>(initialFilters.selectedModuleIds);
    const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>(initialFilters.selectedPlanIds);
    const [isPublishedFilter, setIsPublishedFilter] = useState<string>(initialFilters.isPublishedFilter);
    const [videoStatusFilter, setVideoStatusFilter] = useState<string>(initialFilters.videoStatusFilter);
    const [searchTerm, setSearchTerm] = useState<string>(initialFilters.searchTerm);
    const [groupingMode, setGroupingMode] = useState<AdminVideosGroupingMode>(initialFilters.groupingMode);
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>(initialFilters.paginationModel);

    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const currentFilters = useMemo<AdminVideosListFilterState>(
        () => ({
            selectedCourseIds,
            selectedModuleIds,
            selectedPlanIds,
            isPublishedFilter,
            videoStatusFilter,
            searchTerm: debouncedSearchTerm,
            groupingMode,
            paginationModel,
        }),
        [
            selectedCourseIds,
            selectedModuleIds,
            selectedPlanIds,
            isPublishedFilter,
            videoStatusFilter,
            debouncedSearchTerm,
            groupingMode,
            paginationModel,
        ]
    );

    useEffect(() => {
        if (skipNextSyncRef.current) {
            skipNextSyncRef.current = false;
            return;
        }

        const nextParams = filtersToSearchParams(currentFilters);
        writeFiltersToSessionStorage(currentFilters);

        if (nextParams.toString() !== searchParams.toString()) {
            setSearchParams(nextParams, { replace: true });
        }
    }, [currentFilters, searchParams, setSearchParams]);

    const resetPagination = useCallback(() => {
        setPaginationModel((prev) => (prev.page === 0 ? prev : { ...prev, page: 0 }));
    }, []);

    const updateSelectedCourseIds = useCallback((ids: string[]) => {
        setSelectedCourseIds(ids);
        if (ids.length === 0) {
            setSelectedModuleIds([]);
        }
        resetPagination();
    }, [resetPagination]);

    const updateSelectedModuleIds = useCallback((ids: string[]) => {
        setSelectedModuleIds(ids);
        resetPagination();
    }, [resetPagination]);

    const updateSelectedPlanIds = useCallback((ids: string[]) => {
        setSelectedPlanIds(ids);
        resetPagination();
    }, [resetPagination]);

    const updateIsPublishedFilter = useCallback((value: string) => {
        setIsPublishedFilter(value);
        resetPagination();
    }, [resetPagination]);

    const updateVideoStatusFilter = useCallback((value: string) => {
        setVideoStatusFilter(value);
        resetPagination();
    }, [resetPagination]);

    const updateSearchTerm = useCallback((value: string) => {
        setSearchTerm(value);
        resetPagination();
    }, [resetPagination]);

    const updateGroupingMode = useCallback((value: AdminVideosGroupingMode) => {
        setGroupingMode(value);
    }, []);

    const clearFilters = useCallback(() => {
        skipNextSyncRef.current = true;
        setSelectedCourseIds([]);
        setSelectedModuleIds([]);
        setSelectedPlanIds([]);
        setIsPublishedFilter('all');
        setVideoStatusFilter('all');
        setSearchTerm('');
        setGroupingMode('flat');
        setPaginationModel(DEFAULT_ADMIN_VIDEOS_LIST_FILTERS.paginationModel);
        clearFiltersSessionStorage();
        setSearchParams(new URLSearchParams(), { replace: true });
    }, [setSearchParams]);

    const getListSearchString = useCallback(
        () => searchStringFromFilters(currentFilters),
        [currentFilters]
    );

    const hasActiveFilters = useMemo(
        () => hasActiveVideoFilters(currentFilters, debouncedSearchTerm),
        [currentFilters, debouncedSearchTerm]
    );

    return {
        selectedCourseIds,
        selectedModuleIds,
        selectedPlanIds,
        isPublishedFilter,
        videoStatusFilter,
        searchTerm,
        debouncedSearchTerm,
        groupingMode,
        paginationModel,
        setSelectedCourseIds: updateSelectedCourseIds,
        setSelectedModuleIds: updateSelectedModuleIds,
        setSelectedPlanIds: updateSelectedPlanIds,
        setIsPublishedFilter: updateIsPublishedFilter,
        setVideoStatusFilter: updateVideoStatusFilter,
        setSearchTerm: updateSearchTerm,
        setGroupingMode: updateGroupingMode,
        setPaginationModel,
        clearFilters,
        getListSearchString,
        hasActiveFilters,
    };
}

export const getStoredVideosListSearch = (): string => {
    try {
        return sessionStorage.getItem(ADMIN_VIDEOS_LIST_SEARCH_KEY) ?? '';
    } catch {
        return '';
    }
};
