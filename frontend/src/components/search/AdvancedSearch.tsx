import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Grid,
  Typography,
  IconButton,
  Collapse,
  FormControlLabel,
  Switch,
  Slider,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { useLocalization } from '../../contexts/LocalizationContext';

export interface SearchFilters {
  query: string;
  type?: string;
  status?: string;
  priority?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  tags?: string[];
  ageRange?: [number, number];
  weightRange?: [number, number];
  isCompleted?: boolean;
  hasImage?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onClear: () => void;
  searchType: 'pets' | 'tasks';
  initialFilters?: Partial<SearchFilters>;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  onClear,
  searchType,
  initialFilters = {}
}) => {
  const { t } = useLocalization();
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    ...initialFilters
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Update active filters
    const newActiveFilters = Object.entries(newFilters)
      .filter(([k, v]) => {
        if (k === 'query') return v && v.length > 0;
        if (k === 'dateRange') return v && (v.start || v.end);
        if (k === 'tags') return v && v.length > 0;
        if (k === 'ageRange') return v && (v[0] > 0 || v[1] < 100);
        if (k === 'weightRange') return v && (v[0] > 0 || v[1] < 1000);
        return v !== undefined && v !== '';
      })
      .map(([k]) => k);
    
    setActiveFilters(newActiveFilters);
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleClear = () => {
    const clearedFilters: SearchFilters = { query: '' };
    setFilters(clearedFilters);
    setActiveFilters([]);
    onClear();
  };

  const removeFilter = (filterKey: string) => {
    const newFilters = { ...filters };
    if (filterKey === 'query') {
      newFilters.query = '';
    } else if (filterKey === 'dateRange') {
      delete newFilters.dateRange;
    } else if (filterKey === 'tags') {
      newFilters.tags = [];
    } else if (filterKey === 'ageRange') {
      delete newFilters.ageRange;
    } else if (filterKey === 'weightRange') {
      delete newFilters.weightRange;
    } else {
      delete newFilters[filterKey as keyof SearchFilters];
    }
    
    setFilters(newFilters);
    setActiveFilters(activeFilters.filter(f => f !== filterKey));
  };

  const getFilterLabel = (key: string): string => {
    const labels: Record<string, string> = {
      query: t('search.query', 'Search'),
      type: t('search.type', 'Type'),
      status: t('search.status', 'Status'),
      priority: t('search.priority', 'Priority'),
      dateRange: t('search.dateRange', 'Date Range'),
      tags: t('search.tags', 'Tags'),
      ageRange: t('search.ageRange', 'Age Range'),
      weightRange: t('search.weightRange', 'Weight Range'),
      isCompleted: t('search.completed', 'Completed'),
      hasImage: t('search.hasImage', 'Has Image'),
      sortBy: t('search.sortBy', 'Sort By'),
    };
    return labels[key] || key;
  };

  const getFilterValue = (key: string): string => {
    const value = filters[key as keyof SearchFilters];
    if (key === 'dateRange' && value) {
      const range = value as { start: string; end: string };
      return `${range.start} - ${range.end}`;
    }
    if (key === 'ageRange' && value) {
      const range = value as [number, number];
      return `${range[0]} - ${range[1]} years`;
    }
    if (key === 'weightRange' && value) {
      const range = value as [number, number];
      return `${range[0]} - ${range[1]} kg`;
    }
    if (key === 'tags' && value) {
      return (value as string[]).join(', ');
    }
    return String(value || '');
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        title={t('search.advancedSearch', 'Advanced Search')}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={() => setIsExpanded(!isExpanded)}
              color="primary"
            >
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {t('search.filters', 'Filters')} ({activeFilters.length})
            </Button>
          </Box>
        }
      />
      <CardContent>
        {/* Basic Search */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            placeholder={t('search.searchPlaceholder', 'Search...')}
            value={filters.query}
            onChange={(e) => handleFilterChange('query', e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            startIcon={<SearchIcon />}
          >
            {t('search.search', 'Search')}
          </Button>
          <Button
            variant="outlined"
            onClick={handleClear}
            startIcon={<ClearIcon />}
          >
            {t('search.clear', 'Clear')}
          </Button>
        </Box>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('search.activeFilters', 'Active Filters')}:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {activeFilters.map((filterKey) => (
                <Chip
                  key={filterKey}
                  label={`${getFilterLabel(filterKey)}: ${getFilterValue(filterKey)}`}
                  onDelete={() => removeFilter(filterKey)}
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Advanced Filters */}
        <Collapse in={isExpanded}>
          <Grid container spacing={2}>
            {/* Type Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>{t('search.type', 'Type')}</InputLabel>
                <Select
                  value={filters.type || ''}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  label={t('search.type', 'Type')}
                >
                  <MenuItem value="">{t('search.all', 'All')}</MenuItem>
                  {searchType === 'pets' ? (
                    <>
                      <MenuItem value="dog">{t('pets.dog', 'Dog')}</MenuItem>
                      <MenuItem value="cat">{t('pets.cat', 'Cat')}</MenuItem>
                      <MenuItem value="bird">{t('pets.bird', 'Bird')}</MenuItem>
                      <MenuItem value="rabbit">{t('pets.rabbit', 'Rabbit')}</MenuItem>
                      <MenuItem value="other">{t('pets.other', 'Other')}</MenuItem>
                    </>
                  ) : (
                    <>
                      <MenuItem value="feeding">{t('tasks.feeding', 'Feeding')}</MenuItem>
                      <MenuItem value="walking">{t('tasks.walking', 'Walking')}</MenuItem>
                      <MenuItem value="grooming">{t('tasks.grooming', 'Grooming')}</MenuItem>
                      <MenuItem value="medical">{t('tasks.medical', 'Medical')}</MenuItem>
                      <MenuItem value="vaccination">{t('tasks.vaccination', 'Vaccination')}</MenuItem>
                    </>
                  )}
                </Select>
              </FormControl>
            </Grid>

            {/* Status Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>{t('search.status', 'Status')}</InputLabel>
                <Select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label={t('search.status', 'Status')}
                >
                  <MenuItem value="">{t('search.all', 'All')}</MenuItem>
                  {searchType === 'tasks' ? (
                    <>
                      <MenuItem value="pending">{t('tasks.pending', 'Pending')}</MenuItem>
                      <MenuItem value="completed">{t('tasks.completed', 'Completed')}</MenuItem>
                      <MenuItem value="overdue">{t('tasks.overdue', 'Overdue')}</MenuItem>
                    </>
                  ) : (
                    <>
                      <MenuItem value="active">{t('pets.active', 'Active')}</MenuItem>
                      <MenuItem value="inactive">{t('pets.inactive', 'Inactive')}</MenuItem>
                    </>
                  )}
                </Select>
              </FormControl>
            </Grid>

            {/* Priority Filter (for tasks) */}
            {searchType === 'tasks' && (
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>{t('search.priority', 'Priority')}</InputLabel>
                  <Select
                    value={filters.priority || ''}
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                    label={t('search.priority', 'Priority')}
                  >
                    <MenuItem value="">{t('search.all', 'All')}</MenuItem>
                    <MenuItem value="low">{t('tasks.low', 'Low')}</MenuItem>
                    <MenuItem value="medium">{t('tasks.medium', 'Medium')}</MenuItem>
                    <MenuItem value="high">{t('tasks.high', 'High')}</MenuItem>
                    <MenuItem value="urgent">{t('tasks.urgent', 'Urgent')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Date Range Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label={t('search.from', 'From')}
                  type="date"
                  value={filters.dateRange?.start || ''}
                  onChange={(e) => handleFilterChange('dateRange', {
                    ...filters.dateRange,
                    start: e.target.value
                  })}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label={t('search.to', 'To')}
                  type="date"
                  value={filters.dateRange?.end || ''}
                  onChange={(e) => handleFilterChange('dateRange', {
                    ...filters.dateRange,
                    end: e.target.value
                  })}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </Grid>

            {/* Age Range (for pets) */}
            {searchType === 'pets' && (
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography gutterBottom>
                  {t('search.ageRange', 'Age Range')}: {filters.ageRange?.[0] || 0} - {filters.ageRange?.[1] || 20} {t('pets.years', 'years')}
                </Typography>
                <Slider
                  value={filters.ageRange || [0, 20]}
                  onChange={(_, value) => handleFilterChange('ageRange', value)}
                  valueLabelDisplay="auto"
                  min={0}
                  max={20}
                  step={0.5}
                />
              </Grid>
            )}

            {/* Weight Range (for pets) */}
            {searchType === 'pets' && (
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography gutterBottom>
                  {t('search.weightRange', 'Weight Range')}: {filters.weightRange?.[0] || 0} - {filters.weightRange?.[1] || 100} kg
                </Typography>
                <Slider
                  value={filters.weightRange || [0, 100]}
                  onChange={(_, value) => handleFilterChange('weightRange', value)}
                  valueLabelDisplay="auto"
                  min={0}
                  max={100}
                  step={0.5}
                />
              </Grid>
            )}

            {/* Boolean Filters */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {searchType === 'tasks' && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={filters.isCompleted || false}
                        onChange={(e) => handleFilterChange('isCompleted', e.target.checked)}
                      />
                    }
                    label={t('search.completed', 'Completed')}
                  />
                )}
                {searchType === 'pets' && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={filters.hasImage || false}
                        onChange={(e) => handleFilterChange('hasImage', e.target.checked)}
                      />
                    }
                    label={t('search.hasImage', 'Has Image')}
                  />
                )}
              </Box>
            </Grid>

            {/* Sort Options */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControl fullWidth>
                  <InputLabel>{t('search.sortBy', 'Sort By')}</InputLabel>
                  <Select
                    value={filters.sortBy || ''}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    label={t('search.sortBy', 'Sort By')}
                  >
                    <MenuItem value="name">{t('search.name', 'Name')}</MenuItem>
                    <MenuItem value="date">{t('search.date', 'Date')}</MenuItem>
                    <MenuItem value="priority">{t('search.priority', 'Priority')}</MenuItem>
                    {searchType === 'pets' && (
                      <>
                        <MenuItem value="age">{t('search.age', 'Age')}</MenuItem>
                        <MenuItem value="weight">{t('search.weight', 'Weight')}</MenuItem>
                      </>
                    )}
                  </Select>
                </FormControl>
                <FormControl>
                  <InputLabel>{t('search.order', 'Order')}</InputLabel>
                  <Select
                    value={filters.sortOrder || 'asc'}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                    label={t('search.order', 'Order')}
                  >
                    <MenuItem value="asc">{t('search.ascending', 'Ascending')}</MenuItem>
                    <MenuItem value="desc">{t('search.descending', 'Descending')}</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Grid>
          </Grid>
        </Collapse>
      </CardContent>
    </Card>
  );
};
