// src/pages/admin/AdminVideosListPage.tsx

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminLayoutPage } from '../contexts/AdminLayoutConfigContext';
import { useAdminVideosListFilters } from '../hooks/useAdminVideosListFilters';
import {
    Container, Typography, Button, CircularProgress, Alert, Box, Paper, Tooltip, Chip,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
    TextField, FormControl, InputLabel, Select, MenuItem, Autocomplete, Grid,
    Checkbox, OutlinedInput
} from '@mui/material';
import {
    DataGrid,
    type GridColDef,
    GridActionsCellItem,
    type GridRowId,
    type GridRenderCellParams,
} from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import ErrorIcon from '@mui/icons-material/Error';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import NoSimIcon from '@mui/icons-material/NoSim';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import LinkIcon from '@mui/icons-material/Link';
import SelectAllIcon from '@mui/icons-material/SelectAll';

import {
    getAllVideosAdmin,
    deleteVideoAdmin,
    bulkLinkVideosAdmin,
    type VideoMetadata,
    type VideoFilters
} from '../services/adminService';
import { getAllCoursesAdmin, type Course } from '../services/courseAdminService';
import { getAllModulesAdmin, type Module } from '../services/moduleAdminService';
import { getAllSubscriptionPlansAdmin, type SubscriptionPlan } from '../services/subscriptionPlanAdminService';

interface VideoDataGridRow extends VideoMetadata {
    id: string;
}

// Date formatter
const gridDateFormatter = (value: string | undefined | null): string => {
    if (!value) return '';
    try {
        const date = new Date(value);
        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
    } catch (e) { return 'Invalid Date'; }
};

const AdminVideosListPage: React.FC = () => {
    useAdminLayoutPage({ title: 'Videos' });
    const navigate = useNavigate();

    // Data states
    const [videosForGrid, setVideosForGrid] = useState<VideoDataGridRow[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    // Filter options (dropdown data)
    const [courses, setCourses] = useState<Course[]>([]);
    const [modules, setModules] = useState<Module[]>([]);
    const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
    const [isLoadingOptions, setIsLoadingOptions] = useState<boolean>(true);

    const {
        selectedCourseIds,
        selectedModuleIds,
        selectedPlanIds,
        isPublishedFilter,
        videoStatusFilter,
        searchTerm,
        debouncedSearchTerm,
        groupingMode,
        paginationModel,
        setSelectedCourseIds,
        setSelectedModuleIds,
        setSelectedPlanIds,
        setIsPublishedFilter,
        setVideoStatusFilter,
        setSearchTerm,
        setGroupingMode,
        setPaginationModel,
        clearFilters,
        getListSearchString,
        hasActiveFilters,
    } = useAdminVideosListFilters();

    // Delete dialog
    const [deleteVideoId, setDeleteVideoId] = useState<GridRowId | null>(null);
    const [openDeleteConfirm, setOpenDeleteConfirm] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    // Bulk linking
    const [selectedVideoIds, setSelectedVideoIds] = useState<GridRowId[]>([]);
    const [openBulkLinkDialog, setOpenBulkLinkDialog] = useState<boolean>(false);
    const [bulkLinkCourseIds, setBulkLinkCourseIds] = useState<string[]>([]);
    const [bulkLinkModuleIds, setBulkLinkModuleIds] = useState<string[]>([]);
    const [bulkLinkPlanIds, setBulkLinkPlanIds] = useState<string[]>([]);
    const [isBulkLinking, setIsBulkLinking] = useState<boolean>(false);

    // Load filter options
    const loadFilterOptions = useCallback(async () => {
        setIsLoadingOptions(true);
        try {
            const [coursesData, modulesData, plansData] = await Promise.all([
                getAllCoursesAdmin(),
                getAllModulesAdmin(),
                getAllSubscriptionPlansAdmin()
            ]);
            setCourses(coursesData || []);
            setModules(modulesData || []);
            setSubscriptionPlans(plansData || []);
        } catch (err: any) {
            console.error('Failed to load filter options:', err);
        } finally {
            setIsLoadingOptions(false);
        }
    }, []);

    useEffect(() => {
        loadFilterOptions();
    }, [loadFilterOptions]);

    // Get filtered modules based on selected courses
    const filteredModules = useMemo(() => {
        if (selectedCourseIds.length === 0) return modules;
        return modules.filter(module => 
            typeof module.course === 'object' && module.course && 
            selectedCourseIds.includes(module.course._id)
        );
    }, [modules, selectedCourseIds]);

    // Build filters object
    const buildFilters = useCallback((): VideoFilters => {
        const filters: VideoFilters = {};

        if (selectedCourseIds.length > 0) {
            filters.courseIds = selectedCourseIds;
        }
        if (selectedModuleIds.length > 0) {
            filters.moduleIds = selectedModuleIds;
        }
        if (selectedPlanIds.length > 0) {
            filters.planIds = selectedPlanIds;
        }
        if (isPublishedFilter !== 'all') {
            filters.isPublished = isPublishedFilter === 'published';
        }
        if (videoStatusFilter !== 'all') {
            filters.videoStatus = videoStatusFilter;
        }
        if (debouncedSearchTerm.trim()) {
            filters.search = debouncedSearchTerm.trim();
        }
        filters.sortBy = 'order';
        filters.sortOrder = 'asc';

        return filters;
    }, [selectedCourseIds, selectedModuleIds, selectedPlanIds, isPublishedFilter, videoStatusFilter, debouncedSearchTerm]);

    // Fetch videos with filters
    const fetchVideos = useCallback(async (filters: VideoFilters) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getAllVideosAdmin(1, 1000, filters);
            const videosWithId = data.videos.map(video => ({
                ...video,
                id: video._id,
            })) as VideoDataGridRow[];
            setVideosForGrid(videosWithId || []);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to load videos.');
            setVideosForGrid([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const filters = buildFilters();
        fetchVideos(filters);
    }, [buildFilters, fetchVideos]);

    const handleClearFilters = () => {
        clearFilters();
        setSelectedVideoIds([]);
    };

    const handleEditVideo = (id: GridRowId) => {
        navigate(`/admin/videos/edit/${id}`, {
            state: { videosListSearch: getListSearchString() },
        });
    };

    // Sort videos based on grouping mode (client-side sorting for current page only)
    // Note: Full grouping across all pages requires client-side pagination, which we don't use
    // This sorting only affects the current page of results
    const sortedVideos = useMemo(() => {
        if (groupingMode === 'flat') {
            return videosForGrid;
        }

        // Sort by course/module for visual grouping within current page
        return [...videosForGrid].sort((a, b) => {
            if (groupingMode === 'course-module') {
                // Sort by course first, then module
                const aCourse = Array.isArray(a.courses) && a.courses.length > 0
                    ? (typeof a.courses[0] === 'object' ? a.courses[0].title : '')
                    : 'ZZZ';
                const bCourse = Array.isArray(b.courses) && b.courses.length > 0
                    ? (typeof b.courses[0] === 'object' ? b.courses[0].title : '')
                    : 'ZZZ';
                const courseCompare = aCourse.localeCompare(bCourse);
                if (courseCompare !== 0) return courseCompare;

                const aModule = Array.isArray(a.modules) && a.modules.length > 0
                    ? (typeof a.modules[0] === 'object' ? a.modules[0].title : '')
                    : 'ZZZ';
                const bModule = Array.isArray(b.modules) && b.modules.length > 0
                    ? (typeof b.modules[0] === 'object' ? b.modules[0].title : '')
                    : 'ZZZ';
                return aModule.localeCompare(bModule);
            } else if (groupingMode === 'module') {
                // Sort by module only
                const aModule = Array.isArray(a.modules) && a.modules.length > 0
                    ? (typeof a.modules[0] === 'object' ? a.modules[0].title : '')
                    : 'ZZZ';
                const bModule = Array.isArray(b.modules) && b.modules.length > 0
                    ? (typeof b.modules[0] === 'object' ? b.modules[0].title : '')
                    : 'ZZZ';
                return aModule.localeCompare(bModule);
            }
            return 0;
        });
    }, [videosForGrid, groupingMode]);

    useEffect(() => {
        setPaginationModel(prev => {
            const maxPage = Math.max(0, Math.ceil(sortedVideos.length / prev.pageSize) - 1);
            if (prev.page > maxPage) {
                return { ...prev, page: maxPage };
            }
            return prev;
        });
    }, [sortedVideos]);

    const handleAddVideo = () => {
        navigate('/admin/videos/new');
    };

    const handleDeleteVideo = async () => {
        if (!deleteVideoId) return;
        setIsDeleting(true);
        setError(null);
        try {
            await deleteVideoAdmin(deleteVideoId.toString());
            setOpenDeleteConfirm(false);
            setDeleteVideoId(null);
            const filters = buildFilters();
            fetchVideos(filters);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to delete video.');
            setOpenDeleteConfirm(false);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSelectAll = () => {
        if (selectedVideoIds.length === sortedVideos.length) {
            // If all are selected, deselect all
            setSelectedVideoIds([]);
        } else {
            // Select all videos
            setSelectedVideoIds(sortedVideos.map(v => v.id));
        }
    };

    const handleOpenBulkLinkDialog = () => {
        if (selectedVideoIds.length === 0) return;
        setBulkLinkCourseIds([]);
        setBulkLinkModuleIds([]);
        setBulkLinkPlanIds([]);
        setOpenBulkLinkDialog(true);
    };

    const handleCloseBulkLinkDialog = () => {
        setOpenBulkLinkDialog(false);
        setBulkLinkCourseIds([]);
        setBulkLinkModuleIds([]);
        setBulkLinkPlanIds([]);
    };

    const handleBulkLinkVideos = async () => {
        if (selectedVideoIds.length === 0) return;
        if (bulkLinkCourseIds.length === 0 && bulkLinkModuleIds.length === 0 && bulkLinkPlanIds.length === 0) {
            setError('Please select at least one course, module, or subscription plan.');
            return;
        }

        setIsBulkLinking(true);
        setError(null);
        try {
            await bulkLinkVideosAdmin({
                videoIds: selectedVideoIds.map(id => id.toString()),
                courseIds: bulkLinkCourseIds.length > 0 ? bulkLinkCourseIds : undefined,
                moduleIds: bulkLinkModuleIds.length > 0 ? bulkLinkModuleIds : undefined,
                planIds: bulkLinkPlanIds.length > 0 ? bulkLinkPlanIds : undefined,
            });
            handleCloseBulkLinkDialog();
            setSelectedVideoIds([]);
            const filters = buildFilters();
            fetchVideos(filters);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to bulk link videos.');
        } finally {
            setIsBulkLinking(false);
        }
    };

    // Enhanced columns with Course/Module badges
    const columns = useMemo((): GridColDef<VideoDataGridRow>[] => [
        {
            field: 'checkbox',
            headerName: '',
            width: 50,
            sortable: false,
            filterable: false,
            renderHeader: () => (
                <Checkbox
                    indeterminate={selectedVideoIds.length > 0 && selectedVideoIds.length < sortedVideos.length}
                    checked={sortedVideos.length > 0 && selectedVideoIds.length === sortedVideos.length}
                    onChange={(e) => {
                        if (e.target.checked) {
                            setSelectedVideoIds(sortedVideos.map(v => v.id));
                        } else {
                            setSelectedVideoIds([]);
                        }
                    }}
                />
            ),
            renderCell: (params: GridRenderCellParams<VideoDataGridRow>) => (
                <Checkbox
                    checked={selectedVideoIds.includes(params.id)}
                    onChange={(e) => {
                        if (e.target.checked) {
                            setSelectedVideoIds(prev => [...prev, params.id]);
                        } else {
                            setSelectedVideoIds(prev => prev.filter(id => id !== params.id));
                        }
                    }}
                />
            ),
        },
        {
            field: 'title',
            headerName: 'Title',
            width: 280,
            flex: 0.4,
            renderCell: (params: GridRenderCellParams<VideoDataGridRow>) => {
                const video = params.row;
                const courseNames = Array.isArray(video.courses) && video.courses.length > 0
                    ? video.courses.map(c => typeof c === 'object' ? c.title : 'Unknown')
                    : [];

                return (
                    <Box>
                        <Typography variant="body2" fontWeight={500}>
                            {video.title}
                        </Typography>
                        {courseNames.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                {courseNames.slice(0, 2).map((name, idx) => (
                                    <Chip
                                        key={idx}
                                        label={name}
                                        size="small"
                                        variant="outlined"
                                        color="primary"
                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                    />
                                ))}
                                {courseNames.length > 2 && (
                                    <Chip
                                        label={`+${courseNames.length - 2}`}
                                        size="small"
                                        variant="outlined"
                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                    />
                                )}
                            </Box>
                        )}
                    </Box>
                );
            }
        },
        {
            field: 'modules',
            headerName: 'Modules',
            width: 200,
            flex: 0.3,
            renderCell: (params: GridRenderCellParams<VideoDataGridRow>) => {
                const modules = Array.isArray(params.row.modules) ? params.row.modules : [];
                if (modules.length === 0) {
                    return <Chip label="Unassigned" size="small" variant="outlined" color="default" />;
                }
                const moduleNames = modules.map(m => typeof m === 'object' ? m.title : 'Unknown');
                return (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {moduleNames.slice(0, 2).map((name, idx) => (
                            <Chip
                                key={idx}
                                label={name}
                                size="small"
                                variant="outlined"
                                color="secondary"
                                sx={{ fontSize: '0.75rem' }}
                            />
                        ))}
                        {moduleNames.length > 2 && (
                            <Tooltip title={moduleNames.slice(2).join(', ')}>
                                <Chip
                                    label={`+${moduleNames.length - 2}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: '0.75rem' }}
                                />
                            </Tooltip>
                        )}
                    </Box>
                );
            }
        },
        {
            field: 'videoStatus',
            headerName: 'Status',
            width: 160,
            renderCell: (params: GridRenderCellParams<VideoDataGridRow>) => {
                const status = params.row?.videoStatus as string | undefined;
                let chipColor: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" = "default";
                let icon = <HourglassTopIcon fontSize="small" />;
                let label = 'N/A';

                switch (status) {
                    case 'AVAILABLE':
                    case 'PROCESSED_SUCCESS':
                        chipColor = 'success';
                        icon = <CheckCircleIcon fontSize="small" />;
                        label = 'Available';
                        break;
                    case 'PROCESSING_ERROR':
                    case 'FAILED':
                        chipColor = 'error';
                        icon = <ErrorIcon fontSize="small" />;
                        label = 'Error';
                        break;
                    case 'UPLOADED_RAW_LOCALLY':
                        chipColor = 'info';
                        icon = <CloudUploadIcon fontSize="small" />;
                        label = 'Uploaded';
                        break;
                    case 'PROCESSING_ACTIVE':
                    case 'PROCESSING':
                        chipColor = 'warning';
                        icon = <CircularProgress size={16} color="inherit" />;
                        label = 'Processing';
                        break;
                    case 'PENDING_UPLOAD':
                        chipColor = 'default';
                        icon = <HourglassTopIcon fontSize="small" />;
                        label = 'Pending';
                        break;
                    case 'NO_FILE':
                        chipColor = 'default';
                        icon = <NoSimIcon fontSize="small" />;
                        label = 'No File';
                        break;
                    default:
                        label = status ? status.replace(/_/g, ' ') : 'N/A';
                }
                return <Chip icon={icon} label={label} color={chipColor} size="small" variant="outlined" />;
            }
        },
        {
            field: 'isPublished',
            headerName: 'Published',
            width: 100,
            renderCell: (params: GridRenderCellParams<VideoDataGridRow, boolean>) =>
                params.value ? <CheckCircleIcon color="success" /> : <CancelIcon color="action" />
        },
        {
            field: 'requiredPlans',
            headerName: 'Plans',
            width: 180,
            flex: 0.25,
            renderCell: (params: GridRenderCellParams<VideoDataGridRow>) => {
                if (!params.row || !Array.isArray(params.row.requiredPlans) || params.row.requiredPlans.length === 0) {
                    return <Chip label="None" size="small" variant="outlined" />;
                }
                const planNames = params.row.requiredPlans.map(plan => {
                    if (typeof plan === 'string') return `ID: ${plan.slice(-4)}`;
                    if (typeof plan === 'object' && plan !== null && plan.name) return plan.name;
                    return 'Unknown Plan';
                });

                if (planNames.length > 1) {
                    return (
                        <Tooltip title={planNames.join(', ')}>
                            <Chip
                                label={`${planNames[0]}${planNames.length > 1 ? ` +${planNames.length - 1}` : ''}`}
                                size="small"
                                variant="outlined"
                                color="info"
                            />
                        </Tooltip>
                    );
                }
                return <Chip label={planNames[0]} size="small" variant="outlined" color="info" />;
            }
        },
        {
            field: 'order',
            headerName: 'Order',
            type: 'number',
            width: 80
        },
        {
            field: 'createdAt',
            headerName: 'Created',
            width: 160,
            type: 'dateTime',
            valueFormatter: (params) => gridDateFormatter(params)
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Actions',
            width: 100,
            getActions: ({ id }) => [
                <GridActionsCellItem
                    icon={<EditIcon />}
                    label="Edit"
                    onClick={() => handleEditVideo(id)}
                    color="inherit"
                />,
                <GridActionsCellItem
                    icon={<DeleteIcon />}
                    label="Delete"
                    onClick={() => { setDeleteVideoId(id); setOpenDeleteConfirm(true); }}
                    color="inherit"
                />,
            ],
        },
    ], [handleEditVideo]);

    if (isLoading && videosForGrid.length === 0) {
        return (                <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Loading videos...</Typography>
                </Container>
        );
    }

    return (            <Container maxWidth="xl">
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" component="h1" fontWeight={600}>
                        Manage Videos
                        {selectedVideoIds.length > 0 && (
                            <Chip
                                label={`${selectedVideoIds.length} selected`}
                                color="primary"
                                sx={{ ml: 2 }}
                                onDelete={() => setSelectedVideoIds([])}
                            />
                        )}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {sortedVideos.length > 0 && (
                            <Button
                                variant="outlined"
                                color="primary"
                                startIcon={<SelectAllIcon />}
                                onClick={handleSelectAll}
                            >
                                {selectedVideoIds.length === sortedVideos.length ? 'Deselect All' : 'Select All'}
                            </Button>
                        )}
                        {selectedVideoIds.length > 0 && (
                            <Button
                                variant="contained"
                                color="secondary"
                                startIcon={<LinkIcon />}
                                onClick={handleOpenBulkLinkDialog}
                            >
                                Bulk Link ({selectedVideoIds.length})
                            </Button>
                        )}
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={handleAddVideo}
                        >
                            Add New Video
                        </Button>
                    </Box>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {/* Filters Section */}
                <Paper sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <FilterListIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                            Filters & Search
                        </Typography>
                        {hasActiveFilters && (
                            <Button
                                size="small"
                                startIcon={<ClearIcon />}
                                onClick={handleClearFilters}
                                color="inherit"
                            >
                                Clear All
                            </Button>
                        )}
                    </Box>

                    <Grid container spacing={2}>
                        {/* Search */}
                        <Grid sx={{ width: { xs: '100%', md: '32%' } }}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search by title, description, tags..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                                }}
                            />
                        </Grid>

                        {/* Course Filter */}
                        <Grid sx={{ width: { xs: '100%', md: '32%' } }}>
                            <Autocomplete
                                multiple
                                size="small"
                                options={courses}
                                getOptionLabel={(option) => option.title}
                                value={courses.filter(c => selectedCourseIds.includes(c._id))}
                                onChange={(_, newValue) => {
                                    setSelectedCourseIds(newValue.map(c => c._id));
                                }}
                                renderInput={(params) => (
                                    <TextField {...params} label="Filter by Course" placeholder="Select courses" />
                                )}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip
                                            {...getTagProps({ index })}
                                            key={option._id}
                                            label={option.title}
                                            size="small"
                                        />
                                    ))
                                }
                                loading={isLoadingOptions}
                                disabled={isLoadingOptions}
                            />
                        </Grid>

                        {/* Module Filter */}
                        <Grid sx={{ width: { xs: '100%', md: '32%' } }}>
                            <Autocomplete
                                multiple
                                size="small"
                                options={filteredModules}
                                getOptionLabel={(option) => {
                                    const courseName = typeof option.course === 'object' && option.course
                                        ? option.course.title
                                        : 'Unknown Course';
                                    return `${option.title} (${courseName})`;
                                }}
                                value={modules.filter(m => selectedModuleIds.includes(m._id))}
                                onChange={(_, newValue) => {
                                    setSelectedModuleIds(newValue.map(m => m._id));
                                }}
                                renderInput={(params) => (
                                    <TextField {...params} label="Filter by Module" placeholder="Select modules" />
                                )}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip
                                            {...getTagProps({ index })}
                                            key={option._id}
                                            label={option.title}
                                            size="small"
                                        />
                                    ))
                                }
                                disabled={isLoadingOptions || filteredModules.length === 0}
                            />
                        </Grid>

                        {/* Plan Filter */}
                        <Grid sx={{ width: { xs: '100%', md: '24%' } }}>
                            <Autocomplete
                                multiple
                                size="small"
                                options={subscriptionPlans}
                                getOptionLabel={(option) => option.name}
                                value={subscriptionPlans.filter(p => selectedPlanIds.includes(p._id))}
                                onChange={(_, newValue) => {
                                    setSelectedPlanIds(newValue.map(p => p._id));
                                }}
                                renderInput={(params) => (
                                    <TextField {...params} label="Filter by Plan" placeholder="Select plans" />
                                )}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip
                                            {...getTagProps({ index })}
                                            key={option._id}
                                            label={option.name}
                                            size="small"
                                        />
                                    ))
                                }
                                loading={isLoadingOptions}
                                disabled={isLoadingOptions}
                            />
                        </Grid>

                        {/* Published Status Filter */}
                        <Grid sx={{ width: { xs: '100%', md: '24%' } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Published Status</InputLabel>
                                <Select
                                    value={isPublishedFilter}
                                    label="Published Status"
                                    onChange={(e) => setIsPublishedFilter(e.target.value)}
                                >
                                    <MenuItem value="all">All</MenuItem>
                                    <MenuItem value="published">Published</MenuItem>
                                    <MenuItem value="unpublished">Unpublished</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Video Status Filter */}
                        <Grid sx={{ width: { xs: '100%', md: '24%' } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Video Status</InputLabel>
                                <Select
                                    value={videoStatusFilter}
                                    label="Video Status"
                                    onChange={(e) => setVideoStatusFilter(e.target.value)}
                                >
                                    <MenuItem value="all">All</MenuItem>
                                    <MenuItem value="AVAILABLE">Available</MenuItem>
                                    <MenuItem value="PENDING_UPLOAD">Pending Upload</MenuItem>
                                    <MenuItem value="PROCESSING">Processing</MenuItem>
                                    <MenuItem value="PROCESSING_ERROR">Error</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Grouping Toggle */}
                        <Grid sx={{ width: { xs: '100%', md: '24%' } }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Group By</InputLabel>
                                <Select
                                    value={groupingMode}
                                    label="Group By"
                                    onChange={(e) => setGroupingMode(e.target.value as typeof groupingMode)}
                                >
                                    <MenuItem value="flat">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <ViewListIcon fontSize="small" />
                                            Flat List
                                        </Box>
                                    </MenuItem>
                                    <MenuItem value="module">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <ViewModuleIcon fontSize="small" />
                                            By Module
                                        </Box>
                                    </MenuItem>
                                    <MenuItem value="course-module">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <AccountTreeIcon fontSize="small" />
                                            Course → Module
                                        </Box>
                                    </MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>

                    {/* Active Filter Chips */}
                    {hasActiveFilters && (
                        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {courses
                                .filter((course) => selectedCourseIds.includes(course._id))
                                .map((course) => (
                                    <Chip
                                        key={course._id}
                                        label={`Course: ${course.title}`}
                                        onDelete={() => setSelectedCourseIds(selectedCourseIds.filter((id) => id !== course._id))}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                    />
                                ))}
                            {modules
                                .filter((module) => selectedModuleIds.includes(module._id))
                                .map((module) => (
                                    <Chip
                                        key={module._id}
                                        label={`Module: ${module.title}`}
                                        onDelete={() => setSelectedModuleIds(selectedModuleIds.filter((id) => id !== module._id))}
                                        size="small"
                                        color="secondary"
                                        variant="outlined"
                                    />
                                ))}
                            {subscriptionPlans
                                .filter((plan) => selectedPlanIds.includes(plan._id))
                                .map((plan) => (
                                    <Chip
                                        key={plan._id}
                                        label={`Plan: ${plan.name}`}
                                        onDelete={() => setSelectedPlanIds(selectedPlanIds.filter((id) => id !== plan._id))}
                                        size="small"
                                        color="info"
                                        variant="outlined"
                                    />
                                ))}
                            {isPublishedFilter !== 'all' && (
                                <Chip
                                    label={`Published: ${isPublishedFilter === 'published' ? 'Yes' : 'No'}`}
                                    onDelete={() => setIsPublishedFilter('all')}
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                            {videoStatusFilter !== 'all' && (
                                <Chip
                                    label={`Status: ${videoStatusFilter}`}
                                    onDelete={() => setVideoStatusFilter('all')}
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                            {debouncedSearchTerm.trim() && (
                                <Chip
                                    label={`Search: "${debouncedSearchTerm}"`}
                                    onDelete={() => setSearchTerm('')}
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                        </Box>
                    )}
                </Paper>

                {/* Results Count */}
                <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        {hasActiveFilters
                            ? `${sortedVideos.length} video${sortedVideos.length === 1 ? '' : 's'} match your filters`
                            : `${sortedVideos.length} video${sortedVideos.length === 1 ? '' : 's'} total`}
                        {' · '}
                        Showing {Math.min(
                            sortedVideos.length - paginationModel.page * paginationModel.pageSize,
                            paginationModel.pageSize
                        )} on this page
                    </Typography>
                </Box>

                {/* Data Grid */}
                <Paper sx={{ height: 650, width: '100%' }}>
                    <DataGrid
                        rows={sortedVideos}
                        columns={columns}
                        paginationModel={paginationModel}
                        onPaginationModelChange={setPaginationModel}
                        pageSizeOptions={[10, 25, 50, 100]}
                        loading={isLoading}
                        disableRowSelectionOnClick
                        checkboxSelection={false}
                        sx={{
                            '& .MuiDataGrid-cell': {
                                display: 'flex',
                                alignItems: 'center',
                            },
                        }}
                    />
                </Paper>

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={openDeleteConfirm}
                    onClose={() => setOpenDeleteConfirm(false)}
                >
                    <DialogTitle>Confirm Video Deletion</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Are you sure you want to delete this video metadata?
                            This action will only remove the metadata entry. Actual video files
                            (raw, processed, thumbnails) will need to be managed separately from your storage.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenDeleteConfirm(false)} color="inherit" disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button onClick={handleDeleteVideo} color="error" variant="contained" autoFocus disabled={isDeleting}>
                            {isDeleting ? <CircularProgress size={24} color="inherit" /> : "Delete Metadata"}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Bulk Link Dialog */}
                <Dialog
                    open={openBulkLinkDialog}
                    onClose={handleCloseBulkLinkDialog}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        Bulk Link Videos ({selectedVideoIds.length} selected)
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText sx={{ mb: 3 }}>
                            Select courses, modules, and/or subscription plans to link to the selected videos.
                            You can select multiple options for each category.
                        </DialogContentText>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {/* Courses Selection */}
                            <FormControl fullWidth>
                                <InputLabel id="bulk-link-courses-label">Courses</InputLabel>
                                <Select
                                    labelId="bulk-link-courses-label"
                                    multiple
                                    value={bulkLinkCourseIds}
                                    onChange={(e) => setBulkLinkCourseIds(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                                    input={<OutlinedInput label="Courses" />}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map((value) => {
                                                const course = courses.find(c => c._id === value);
                                                return <Chip key={value} label={course?.title || value} size="small" />;
                                            })}
                                        </Box>
                                    )}
                                >
                                    {courses.map((course) => (
                                        <MenuItem key={course._id} value={course._id}>
                                            <Checkbox checked={bulkLinkCourseIds.indexOf(course._id) > -1} />
                                            {course.title}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Modules Selection */}
                            <FormControl fullWidth>
                                <InputLabel id="bulk-link-modules-label">Modules</InputLabel>
                                <Select
                                    labelId="bulk-link-modules-label"
                                    multiple
                                    value={bulkLinkModuleIds}
                                    onChange={(e) => setBulkLinkModuleIds(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                                    input={<OutlinedInput label="Modules" />}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map((value) => {
                                                const module = modules.find(m => m._id === value);
                                                return <Chip key={value} label={module?.title || value} size="small" />;
                                            })}
                                        </Box>
                                    )}
                                >
                                    {modules.map((module) => {
                                        // Get subscription plan names for this module
                                        let planNames: string[] = [];
                                        if (module.subscriptionPlans && Array.isArray(module.subscriptionPlans)) {
                                            planNames = module.subscriptionPlans.map(plan => {
                                                if (typeof plan === 'object' && plan !== null && 'name' in plan) {
                                                    return plan.name;
                                                } else if (typeof plan === 'string') {
                                                    const foundPlan = subscriptionPlans.find(p => p._id === plan);
                                                    return foundPlan?.name || '';
                                                }
                                                return '';
                                            }).filter(name => name !== '');
                                        }
                                        
                                        const planDisplay = planNames.length > 0 
                                            ? ` (${planNames.join(', ')})` 
                                            : '';
                                        
                                        return (
                                            <MenuItem key={module._id} value={module._id}>
                                                <Checkbox checked={bulkLinkModuleIds.indexOf(module._id) > -1} />
                                                {module.title}{planDisplay}
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            </FormControl>

                            {/* Subscription Plans Selection */}
                            <FormControl fullWidth>
                                <InputLabel id="bulk-link-plans-label">Subscription Plans</InputLabel>
                                <Select
                                    labelId="bulk-link-plans-label"
                                    multiple
                                    value={bulkLinkPlanIds}
                                    onChange={(e) => setBulkLinkPlanIds(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                                    input={<OutlinedInput label="Subscription Plans" />}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map((value) => {
                                                const plan = subscriptionPlans.find(p => p._id === value);
                                                return <Chip key={value} label={plan?.name || value} size="small" />;
                                            })}
                                        </Box>
                                    )}
                                >
                                    {subscriptionPlans.map((plan) => (
                                        <MenuItem key={plan._id} value={plan._id}>
                                            <Checkbox checked={bulkLinkPlanIds.indexOf(plan._id) > -1} />
                                            {plan.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseBulkLinkDialog} disabled={isBulkLinking}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleBulkLinkVideos}
                            variant="contained"
                            color="primary"
                            disabled={isBulkLinking || (bulkLinkCourseIds.length === 0 && bulkLinkModuleIds.length === 0 && bulkLinkPlanIds.length === 0)}
                        >
                            {isBulkLinking ? <CircularProgress size={24} /> : 'Link Videos'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
    );
};

export default AdminVideosListPage;
