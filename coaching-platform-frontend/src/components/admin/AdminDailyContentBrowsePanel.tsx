import React from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    FormControl,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, parseISO, subDays } from 'date-fns';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import type { DailyContent } from '../../services/dailyContentService';
import type { DailyContentPagination } from '../../services/dailyContentAdminService';
import { getContentTypeConfig, type ContentType } from '../../utils/contentTypeConfig';
import {
    DAILY_CONTENT_CATALOG,
    getAdminContentPreview,
    resolveAdminKeyFromContent,
    getCatalogEntry,
} from '../../utils/dailyContentTypeCatalog';
import { getDisplayTag } from '../../utils/dailyContentDisplayNumber';

const LEVELS = ['FREE', 'BRONZE', 'SILVER', 'GOLD', 'FULL_COURSE', 'BONUS'] as const;
const API_TYPES = [...new Set(DAILY_CONTENT_CATALOG.map((s) => s.apiType))];

export type BrowseFilters = {
    startDate: Date | null;
    endDate: Date | null;
    level: string;
    type: string;
    search: string;
    isActive: '' | 'true' | 'false';
    sortOrder: 'asc' | 'desc';
};

export const defaultBrowseFilters = (): BrowseFilters => ({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
    level: '',
    type: '',
    search: '',
    isActive: '',
    sortOrder: 'desc',
});

type Props = {
    content: DailyContent[];
    pagination: DailyContentPagination | null;
    isLoading: boolean;
    error: string | null;
    filters: BrowseFilters;
    page: number;
    rowsPerPage: number;
    onFiltersChange: (patch: Partial<BrowseFilters>) => void;
    onPageChange: (page: number) => void;
    onRowsPerPageChange: (rows: number) => void;
    onApplyFilters: (patch?: Partial<BrowseFilters>) => void;
    onResetFilters: () => void;
    onEdit: (item: DailyContent) => void;
    onDelete: (id: string) => void;
};

const AdminDailyContentBrowsePanel: React.FC<Props> = ({
    content,
    pagination,
    isLoading,
    error,
    filters,
    page,
    rowsPerPage,
    onFiltersChange,
    onPageChange,
    onRowsPerPageChange,
    onApplyFilters,
    onResetFilters,
    onEdit,
    onDelete,
}) => {
    const applyPreset = (preset: '7d' | '30d' | '90d' | 'all') => {
        const end = new Date();
        const patch: Partial<BrowseFilters> =
            preset === 'all'
                ? { startDate: null, endDate: null }
                : {
                      startDate: subDays(end, preset === '7d' ? 7 : preset === '30d' ? 30 : 90),
                      endDate: end,
                  };
        onFiltersChange(patch);
        onApplyFilters(patch);
    };

    return (
        <Box>
            <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <FilterListIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle1" fontWeight={700}>
                        Filters &amp; date range
                    </Typography>
                </Stack>
                <Grid container spacing={2} alignItems="flex-end">
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="From date"
                                value={filters.startDate}
                                onChange={(v) => onFiltersChange({ startDate: v })}
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                        </LocalizationProvider>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="To date"
                                value={filters.endDate}
                                onChange={(v) => onFiltersChange({ endDate: v })}
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                        </LocalizationProvider>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Type</InputLabel>
                            <Select
                                value={filters.type}
                                label="Type"
                                onChange={(e) => onFiltersChange({ type: e.target.value })}
                            >
                                <MenuItem value="">All types</MenuItem>
                                {API_TYPES.map((t) => (
                                    <MenuItem key={t} value={t}>
                                        {t}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Level</InputLabel>
                            <Select
                                value={filters.level}
                                label="Level"
                                onChange={(e) => onFiltersChange({ level: e.target.value })}
                            >
                                <MenuItem value="">All levels</MenuItem>
                                {LEVELS.map((l) => (
                                    <MenuItem key={l} value={l}>
                                        {l}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={filters.isActive}
                                label="Status"
                                onChange={(e) =>
                                    onFiltersChange({ isActive: e.target.value as BrowseFilters['isActive'] })
                                }
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="true">Active only</MenuItem>
                                <MenuItem value="false">Inactive only</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Search"
                            placeholder="Title or display #"
                            value={filters.search}
                            onChange={(e) => onFiltersChange({ search: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && onApplyFilters()}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Sort by date</InputLabel>
                            <Select
                                value={filters.sortOrder}
                                label="Sort by date"
                                onChange={(e) =>
                                    onFiltersChange({ sortOrder: e.target.value as 'asc' | 'desc' })
                                }
                            >
                                <MenuItem value="desc">Newest first</MenuItem>
                                <MenuItem value="asc">Oldest first</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
                            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                                Quick range:
                            </Typography>
                            <Chip label="Last 7 days" size="small" onClick={() => applyPreset('7d')} clickable />
                            <Chip label="Last 30 days" size="small" onClick={() => applyPreset('30d')} clickable />
                            <Chip label="Last 90 days" size="small" onClick={() => applyPreset('90d')} clickable />
                            <Chip label="All time" size="small" onClick={() => applyPreset('all')} clickable variant="outlined" />
                            <Box sx={{ flexGrow: 1 }} />
                            <Button size="small" onClick={onResetFilters}>
                                Reset
                            </Button>
                            <Button size="small" variant="contained" onClick={onApplyFilters}>
                                Apply filters
                            </Button>
                        </Stack>
                    </Grid>
                </Grid>
            </Paper>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {pagination && !isLoading && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Showing {content.length} of {pagination.total} items
                    {filters.startDate && filters.endDate
                        ? ` · ${format(filters.startDate, 'MMM d, yyyy')} – ${format(filters.endDate, 'MMM d, yyyy')}`
                        : ''}
                </Typography>
            )}

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress />
                </Box>
            ) : content.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">No content matches your filters.</Typography>
                </Paper>
            ) : (
                <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.50' }}>
                                    <TableCell sx={{ fontWeight: 700 }}>Scheduled date</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Level</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Display #</TableCell>
                                    <TableCell sx={{ fontWeight: 700, minWidth: 220 }}>Content</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                                        Actions
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {content.map((item) => {
                                    const contentType = item.type as ContentType;
                                    const config = getContentTypeConfig(contentType);
                                    const IconComponent = config.icon;
                                    const slotLabel = getCatalogEntry(resolveAdminKeyFromContent(item)).label;
                                    return (
                                        <TableRow key={item._id} hover>
                                            <TableCell>
                                                {format(parseISO(item.date), 'EEE, MMM d, yyyy')}
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" alignItems="center" spacing={0.75}>
                                                    <IconComponent sx={{ fontSize: 18, color: config.color }} />
                                                    <Typography variant="body2">{slotLabel}</Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={item.level} size="small" variant="outlined" />
                                            </TableCell>
                                            <TableCell>
                                                <Typography
                                                    variant="body2"
                                                    sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                                                >
                                                    {getDisplayTag(item.sequenceNumber) || '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 420, minWidth: 220 }}>
                                                <Typography
                                                    variant="body2"
                                                    title={getAdminContentPreview(item)}
                                                    sx={{
                                                        lineHeight: 1.5,
                                                        color: 'text.primary',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    {getAdminContentPreview(item)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={item.isActive !== false ? 'Active' : 'Inactive'}
                                                    size="small"
                                                    color={item.isActive !== false ? 'success' : 'default'}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" color="text.secondary">
                                                    {format(parseISO(item.createdAt), 'MMM d, yyyy')}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton size="small" onClick={() => onEdit(item)}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" color="error" onClick={() => onDelete(item._id)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {pagination && (
                        <TablePagination
                            component="div"
                            count={pagination.total}
                            page={page}
                            onPageChange={(_, next) => onPageChange(next)}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={(e) => {
                                onRowsPerPageChange(parseInt(e.target.value, 10));
                                onPageChange(0);
                            }}
                            rowsPerPageOptions={[10, 25, 50, 100]}
                        />
                    )}
                </Paper>
            )}
        </Box>
    );
};

export default AdminDailyContentBrowsePanel;
