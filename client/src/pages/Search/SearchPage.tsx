import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Chip, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Paper,
  CircularProgress,
  Alert,
  Pagination,
  Autocomplete,
  IconButton,
  Tooltip,
  Divider,
  Skeleton
} from '@mui/material';
import { 
  Search as SearchIcon, 
  FilterList as FilterIcon,
  Clear as ClearIcon,
  TrendingUp as TrendingIcon
} from '@mui/icons-material';
import { searchAPI, categoryAPI } from '../../services/api';

interface SearchItem {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  condition: string;
  estimated_value: number;
  category_name: string;
  username: string;
  location_city?: string;
  location_state?: string;
  tags?: string[];
  allows_shipping: boolean;
  allows_pickup: boolean;
  allows_meetup: boolean;
  created_at: string;
}

interface SearchFilters {
  q: string;
  category: string;
  itemType: string;
  condition: string;
  minValue: string;
  maxValue: string;
  location: string;
  sortBy: string;
  sortOrder: string;
}

const SearchPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    q: '',
    category: 'all',
    itemType: 'all',
    condition: 'all',
    minValue: '',
    maxValue: '',
    location: '',
    sortBy: 'relevance',
    sortOrder: 'desc'
  });

  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [popularSearches, setPopularSearches] = useState<{
    popularCategories: Array<{ name: string; slug: string }>;
    popularTags: string[];
  } | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Load popular searches and categories on component mount
  useEffect(() => {
    loadPopularSearches();
    loadCategories();
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (err) {
        console.error('Failed to parse recent searches:', err);
      }
    }
  }, []);

  // Load search suggestions when typing
  useEffect(() => {
    if (searchTerm.length >= 2) {
      loadSuggestions(searchTerm);
    } else {
      setSuggestions([]);
    }
  }, [searchTerm]);

  // Auto-search when filters change (with delay)
  useEffect(() => {
    if (filters.q) {
      const timer = setTimeout(() => {
        performSearch(1);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [filters.category, filters.itemType, filters.condition, filters.minValue, filters.maxValue, filters.location, filters.sortBy]);

  const loadPopularSearches = async () => {
    try {
      const data = await searchAPI.getPopularSearches();
      setPopularSearches(data);
    } catch (err) {
      console.error('Failed to load popular searches:', err);
    }
  };

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const data = await categoryAPI.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const loadSuggestions = async (query: string) => {
    try {
      const data = await searchAPI.getSuggestions(query, 'items');
      const suggestionValues = data.suggestions.map((s: any) => s.value);
      setSuggestions(suggestionValues);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    }
  };

  const performSearch = useCallback(async (page = 1) => {
    if (!searchTerm.trim() && filters.category === 'all' && filters.itemType === 'all') {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const searchParams: any = {
        page,
        limit: pagination.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };

      if (searchTerm.trim()) {
        searchParams.q = searchTerm.trim();
      }

      if (filters.category !== 'all') {
        searchParams.category = filters.category;
      }

      if (filters.itemType !== 'all') {
        searchParams.itemType = filters.itemType;
      }

      if (filters.condition !== 'all') {
        searchParams.condition = filters.condition;
      }

      if (filters.minValue) {
        searchParams.minValue = parseFloat(filters.minValue);
      }

      if (filters.maxValue) {
        searchParams.maxValue = parseFloat(filters.maxValue);
      }

      if (filters.location.trim()) {
        searchParams.location = filters.location.trim();
      }

      const data = await searchAPI.searchItems(searchParams);
      
      setSearchResults(data.items);
      setPagination(data.pagination);
      setFilters(prev => ({ ...prev, q: searchTerm }));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to perform search');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters, pagination.limit]);

  const saveRecentSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    
    saveRecentSearch(searchTerm);
    setPagination(prev => ({ ...prev, page: 1 }));
    performSearch(1);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setPagination(prev => ({ ...prev, page }));
    performSearch(page);
  };

  const handleClearFilters = () => {
    setFilters({
      q: '',
      category: 'all',
      itemType: 'all',
      condition: 'all',
      minValue: '',
      maxValue: '',
      location: '',
      sortBy: 'relevance',
      sortOrder: 'desc'
    });
    setSearchTerm('');
    setSearchResults([]);
    setPagination(prev => ({ ...prev, page: 1, total: 0, pages: 0 }));
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
  };

  const handlePopularCategoryClick = (categoryName: string) => {
    setFilters(prev => ({ ...prev, category: categoryName.toLowerCase().replace(/\s+/g, '-') }));
    setSearchTerm(categoryName);
  };

  const handlePopularTagClick = (tag: string) => {
    setSearchTerm(tag);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Search Items
      </Typography>

      {/* Search Suggestions Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Recent Searches</Typography>
                <Tooltip title="Clear Recent Searches">
                  <IconButton size="small" onClick={handleClearRecentSearches} color="secondary">
                    <ClearIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {recentSearches.map((search, index) => (
                  <Chip
                    key={index}
                    label={search}
                    variant="outlined"
                    clickable
                    onClick={() => setSearchTerm(search)}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Grid>
          )}

          {/* Popular Searches */}
          {popularSearches && (
            <Grid item xs={12} md={recentSearches.length > 0 ? 6 : 12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Popular Searches</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Popular Categories:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {popularSearches.popularCategories.map((category) => (
                    <Chip
                      key={category.slug}
                      label={category.name}
                      variant="outlined"
                      clickable
                      onClick={() => handlePopularCategoryClick(category.name)}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Popular Tags:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {popularSearches.popularTags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      variant="outlined"
                      clickable
                      onClick={() => handlePopularTagClick(tag)}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Quick Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Quick Filters:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Chip
            label="All Items"
            variant={filters.itemType === 'all' ? 'filled' : 'outlined'}
            clickable
            onClick={() => setFilters(prev => ({ ...prev, itemType: 'all' }))}
            color={filters.itemType === 'all' ? 'primary' : 'default'}
          />
          <Chip
            label="Goods Only"
            variant={filters.itemType === 'good' ? 'filled' : 'outlined'}
            clickable
            onClick={() => setFilters(prev => ({ ...prev, itemType: 'good' }))}
            color={filters.itemType === 'good' ? 'primary' : 'default'}
          />
          <Chip
            label="Services Only"
            variant={filters.itemType === 'service' ? 'filled' : 'outlined'}
            clickable
            onClick={() => setFilters(prev => ({ ...prev, itemType: 'service' }))}
            color={filters.itemType === 'service' ? 'primary' : 'default'}
          />
          <Chip
            label="Free Items"
            variant={filters.minValue === '0' && filters.maxValue === '0' ? 'filled' : 'outlined'}
            clickable
            onClick={() => setFilters(prev => ({ ...prev, minValue: '0', maxValue: '0' }))}
            color={filters.minValue === '0' && filters.maxValue === '0' ? 'primary' : 'default'}
          />
          <Chip
            label="Under $50"
            variant={filters.maxValue === '50' ? 'filled' : 'outlined'}
            clickable
            onClick={() => setFilters(prev => ({ ...prev, maxValue: '50' }))}
            color={filters.maxValue === '50' ? 'primary' : 'default'}
          />
        </Box>
      </Paper>

      {/* Search Form */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Autocomplete
              freeSolo
              options={suggestions}
              inputValue={searchTerm}
              onInputChange={(event, newInputValue) => {
                setSearchTerm(newInputValue);
                setShowSuggestions(true);
              }}
              onChange={(event, newValue) => {
                if (typeof newValue === 'string') {
                  setSearchTerm(newValue);
                } else if (newValue) {
                  setSearchTerm(newValue);
                }
                setShowSuggestions(false);
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyPress={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleSearch();
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  label="Search items..."
                  placeholder="e.g., vintage camera, guitar lessons"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loading && <CircularProgress size={20} />}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category}
                label="Category"
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                disabled={categoriesLoading}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categoriesLoading ? (
                  <MenuItem disabled>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    Loading...
                  </MenuItem>
                ) : (
                  categories.map((category) => (
                    <MenuItem key={category.id} value={category.slug}>
                      {category.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Item Type</InputLabel>
              <Select
                value={filters.itemType}
                label="Item Type"
                onChange={(e) => setFilters(prev => ({ ...prev, itemType: e.target.value }))}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="good">Goods</MenuItem>
                <MenuItem value="service">Services</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Condition</InputLabel>
              <Select
                value={filters.condition}
                label="Condition"
                onChange={(e) => setFilters(prev => ({ ...prev, condition: e.target.value }))}
              >
                <MenuItem value="all">All Conditions</MenuItem>
                <MenuItem value="new">New</MenuItem>
                <MenuItem value="like-new">Like New</MenuItem>
                <MenuItem value="good">Good</MenuItem>
                <MenuItem value="fair">Fair</MenuItem>
                <MenuItem value="poor">Poor</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={loading}
            >
              Search
            </Button>
          </Grid>
        </Grid>

        {/* Advanced Filters */}
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 2 }}>
            <Chip label="Advanced Filters" />
          </Divider>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Min Value ($)"
                type="number"
                value={filters.minValue}
                onChange={(e) => setFilters(prev => ({ ...prev, minValue: e.target.value }))}
                placeholder="0"
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Max Value ($)"
                type="number"
                value={filters.maxValue}
                onChange={(e) => setFilters(prev => ({ ...prev, maxValue: e.target.value }))}
                placeholder="1000"
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Location"
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                placeholder="City, State"
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={filters.sortBy}
                  label="Sort By"
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                >
                  <MenuItem value="relevance">Relevance</MenuItem>
                  <MenuItem value="newest">Newest</MenuItem>
                  <MenuItem value="oldest">Oldest</MenuItem>
                  <MenuItem value="value_high">Value (High to Low)</MenuItem>
                  <MenuItem value="value_low">Value (Low to High)</MenuItem>
                  <MenuItem value="popular">Most Popular</MenuItem>
                  <MenuItem value="trust">Trust Score</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={1}>
              <Tooltip title="Clear Filters">
                <IconButton onClick={handleClearFilters} color="secondary">
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Search Results ({pagination.total})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* View Mode Toggle */}
              <Box sx={{ display: 'flex', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Button
                  size="small"
                  variant={viewMode === 'grid' ? 'contained' : 'text'}
                  onClick={() => setViewMode('grid')}
                  sx={{ minWidth: 'auto', px: 2 }}
                >
                  Grid
                </Button>
                <Button
                  size="small"
                  variant={viewMode === 'list' ? 'contained' : 'text'}
                  onClick={() => setViewMode('list')}
                  sx={{ minWidth: 'auto', px: 2 }}
                >
                  List
                </Button>
              </Box>
              
              {/* Active Filters Summary */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {filters.category !== 'all' && (
                  <Chip 
                    label={`Category: ${categories.find(c => c.slug === filters.category)?.name || filters.category}`} 
                    size="small" 
                    onDelete={() => setFilters(prev => ({ ...prev, category: 'all' }))}
                  />
                )}
                {filters.itemType !== 'all' && (
                  <Chip 
                    label={`Type: ${filters.itemType === 'good' ? 'Goods' : 'Services'}`} 
                    size="small" 
                    onDelete={() => setFilters(prev => ({ ...prev, itemType: 'all' }))}
                  />
                )}
                {filters.condition !== 'all' && (
                  <Chip 
                    label={`Condition: ${filters.condition}`} 
                    size="small" 
                    onDelete={() => setFilters(prev => ({ ...prev, condition: 'all' }))}
                  />
                )}
                {filters.minValue && (
                  <Chip 
                    label={`Min: $${filters.minValue}`} 
                    size="small" 
                    onDelete={() => setFilters(prev => ({ ...prev, minValue: '' }))}
                  />
                )}
                {filters.maxValue && (
                  <Chip 
                    label={`Max: $${filters.maxValue}`} 
                    size="small" 
                    onDelete={() => setFilters(prev => ({ ...prev, maxValue: '' }))}
                  />
                )}
                {filters.location && (
                  <Chip 
                    label={`Location: ${filters.location}`} 
                    size="small" 
                    onDelete={() => setFilters(prev => ({ ...prev, location: '' }))}
                  />
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/* Loading State */}
      {loading && (
        <>
          <Box sx={{ mb: 3 }}>
            <Skeleton variant="text" width={200} height={32} />
            <Skeleton variant="text" width={300} height={20} />
          </Box>
          
          <Grid container spacing={3}>
            {Array.from(new Array(6)).map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ height: '100%' }}>
                  <Skeleton variant="rectangular" height={200} />
                  <CardContent>
                    <Skeleton variant="text" height={24} sx={{ mb: 1 }} />
                    <Skeleton variant="text" height={16} sx={{ mb: 1 }} />
                    <Skeleton variant="text" height={16} sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Skeleton variant="rectangular" width={60} height={24} />
                      <Skeleton variant="rectangular" width={80} height={24} />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Skeleton variant="text" width={60} height={24} />
                      <Skeleton variant="text" width={100} height={16} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Search Results Grid */}
      {!loading && searchResults.length > 0 && (
        <>
          <Grid container spacing={viewMode === 'grid' ? 3 : 2}>
            {searchResults.map((item) => (
              <Grid 
                item 
                xs={12} 
                sm={viewMode === 'grid' ? 6 : 12} 
                md={viewMode === 'grid' ? 4 : 12} 
                key={item.id}
              >
                <Card sx={{ 
                  height: viewMode === 'grid' ? '100%' : 'auto',
                  display: 'flex', 
                  flexDirection: viewMode === 'grid' ? 'column' : 'row'
                }}>
                  <CardMedia
                    component="img"
                    height={viewMode === 'grid' ? '200' : '150'}
                    width={viewMode === 'grid' ? 'auto' : '200'}
                    image={item.image_url || 'https://picsum.photos/300/200?random=' + Math.floor(Math.random() * 1000)}
                    alt={item.title}
                    sx={{ 
                      objectFit: 'cover',
                      flexShrink: 0
                    }}
                  />
                  <CardContent sx={{ 
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <Box>
                      <Typography gutterBottom variant="h6" component="h2">
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {item.description}
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Chip label={item.condition} color="primary" size="small" sx={{ mr: 1 }} />
                        <Chip label={item.category_name} variant="outlined" size="small" sx={{ mr: 1 }} />
                        {item.tags && item.tags.slice(0, 2).map((tag, index) => (
                          <Chip key={index} label={tag} variant="outlined" size="small" sx={{ mr: 1 }} />
                        ))}
                      </Box>
                    </Box>
                    
                    <Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Offered by: {item.username}
                        </Typography>
                        {(item.location_city || item.location_state) && (
                          <Typography variant="body2" color="text.secondary">
                            📍 {[item.location_city, item.location_state].filter(Boolean).join(', ')}
                          </Typography>
                        )}
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" color="primary">
                          ${item.estimated_value}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {item.allows_shipping && <Chip label="🚚" size="small" />}
                          {item.allows_pickup && <Chip label="🏠" size="small" />}
                          {item.allows_meetup && <Chip label="🤝" size="small" />}
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={pagination.pages}
                page={pagination.page}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}

      {/* No Results */}
      {!loading && searchResults.length === 0 && filters.q && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No items found for "{filters.q}"
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Try adjusting your search terms or filters
          </Typography>
          
          {/* Suggested alternatives */}
          {popularSearches && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Try these popular searches instead:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                {popularSearches.popularTags.slice(0, 5).map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    variant="outlined"
                    clickable
                    onClick={() => {
                      setSearchTerm(tag);
                      setFilters(prev => ({ ...prev, q: tag }));
                    }}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Initial State */}
      {!loading && searchResults.length === 0 && !filters.q && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Start searching for items
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Use the search form above to find items or browse popular categories and tags
          </Typography>
          
          {/* Search Tips */}
          <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
            <Typography variant="subtitle1" gutterBottom>
              💡 Search Tips:
            </Typography>
            <Box component="ul" sx={{ textAlign: 'left', pl: 2 }}>
              <Typography component="li" variant="body2" color="text.secondary">
                Use specific keywords like "vintage camera" instead of just "camera"
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Try different categories to narrow down your search
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Use location filters to find items near you
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Set price ranges to find items within your budget
              </Typography>
            </Box>
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default SearchPage;

