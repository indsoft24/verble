import { format, isValid, parseISO } from 'date-fns';
import {
    defaultBrowseFilters,
    type BrowseFilters,
} from '../components/admin/AdminDailyContentBrowsePanel';
import { DAILY_CONTENT_CATALOG } from './dailyContentTypeCatalog';

export type DailyContentViewMode = 'daily' | 'browse';

const ROW_OPTIONS = [10, 25, 50, 100];
const VALID_BROWSE_API_TYPES = new Set<string>(DAILY_CONTENT_CATALOG.map((s) => s.apiType));
const VALID_BROWSE_LEVELS = new Set<string>([
    'FREE',
    'BRONZE',
    'SILVER',
    'GOLD',
    'FULL_COURSE',
    'BONUS',
]);

const parseDateParam = (value: string | null): Date | null => {
    if (!value) return null;
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : null;
};

export function parseDailyContentUrlState(params: URLSearchParams) {
    const view: DailyContentViewMode = params.get('view') === 'browse' ? 'browse' : 'daily';
    const defaults = defaultBrowseFilters();

    const browseFilters: BrowseFilters =
        view === 'browse'
            ? {
                  startDate: parseDateParam(params.get('from')) ?? defaults.startDate,
                  endDate: parseDateParam(params.get('to')) ?? defaults.endDate,
                  level: (() => {
                      const level = params.get('level') || '';
                      return level && VALID_BROWSE_LEVELS.has(level) ? level : '';
                  })(),
                  type: (() => {
                      const type = params.get('type') || '';
                      return type && VALID_BROWSE_API_TYPES.has(type) ? type : '';
                  })(),
                  search: params.get('search') || '',
                  isActive: (() => {
                      const status = params.get('status');
                      return status === 'true' || status === 'false' ? status : '';
                  })(),
                  sortOrder: params.get('sort') === 'asc' ? 'asc' : 'desc',
              }
            : defaults;

    const pageRaw = parseInt(params.get('page') || '1', 10);
    const browsePage = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw - 1 : 0;

    const limitRaw = parseInt(params.get('limit') || '25', 10);
    const browseRowsPerPage = ROW_OPTIONS.includes(limitRaw) ? limitRaw : 25;

    const selectedDate = parseDateParam(params.get('date')) ?? new Date();

    return { view, browseFilters, browsePage, browseRowsPerPage, selectedDate };
}

export function buildDailyContentSearchParams(input: {
    view: DailyContentViewMode;
    browseFilters: BrowseFilters;
    browsePage: number;
    browseRowsPerPage: number;
    selectedDate: Date | null;
}): URLSearchParams {
    const params = new URLSearchParams();
    params.set('view', input.view);

    if (input.view === 'browse') {
        const filters = input.browseFilters;
        if (filters.startDate) params.set('from', format(filters.startDate, 'yyyy-MM-dd'));
        if (filters.endDate) params.set('to', format(filters.endDate, 'yyyy-MM-dd'));
        if (filters.level) params.set('level', filters.level);
        if (filters.type) params.set('type', filters.type);
        if (filters.search.trim()) params.set('search', filters.search.trim());
        if (filters.isActive) params.set('status', filters.isActive);
        if (filters.sortOrder !== 'desc') params.set('sort', filters.sortOrder);
        if (input.browsePage > 0) params.set('page', String(input.browsePage + 1));
        if (input.browseRowsPerPage !== 25) params.set('limit', String(input.browseRowsPerPage));
    } else if (input.selectedDate) {
        params.set('date', format(input.selectedDate, 'yyyy-MM-dd'));
    }

    return params;
}
