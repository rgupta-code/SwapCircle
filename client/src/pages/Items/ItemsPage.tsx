import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Pagination,
  Stack,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Search as SearchIcon, 
  FilterList as FilterIcon, 
  Image as ImageIcon,
  PhotoCamera as PhotoCameraIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { searchAPI, categoryAPI, itemsAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface Item {
  id: string;
  title: string;
  description: string;
  images: string[];
  condition: string;
  estimated_value: number;
  category_name: string;
  user_id: string;
  username: string;
  location: any;
  created_at: string;
  view_count: number;
  favorite_count: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const ItemsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State for items and loading
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCondition, setSelectedCondition] = useState<string>('');
  const [minValue, setMinValue] = useState<string>('');
  const [maxValue, setMaxValue] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  
  // State for filter modal
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // State for categories
  const [categories, setCategories] = useState<Category[]>([]);
  
  // State for search suggestions
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // State for image upload
  const [imageUploadDialogOpen, setImageUploadDialogOpen] = useState(false);
  const [selectedItemForImageUpload, setSelectedItemForImageUpload] = useState<Item | null>(null);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  
  // Debounced search
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Reset to first page on new search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
      
      // Escape to clear search
      if (event.key === 'Escape' && searchQuery) {
        setSearchQuery('');
        setShowSuggestions(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch items when filters change
  useEffect(() => {
    fetchItems();
  }, [debouncedSearchQuery, selectedCategory, selectedCondition, minValue, maxValue, sortBy, currentPage]);

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getCategories();
      setCategories(response);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchSearchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await searchAPI.getSuggestions(query, 'items');
      const suggestions = response.suggestions?.map((s: any) => s.value) || [];
      setSearchSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const fetchItems = async () => {
    // Only show full loading on initial load or when clearing filters
    if (items.length === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);
    
    try {
      const params: any = {
        page: currentPage,
        limit: 12
      };

      if (debouncedSearchQuery) {
        params.q = debouncedSearchQuery;
      }
      
      if (selectedCategory) {
        params.category = selectedCategory;
      }
      
      if (selectedCondition) {
        params.condition = selectedCondition;
      }
      
      if (minValue) {
        params.minValue = parseFloat(minValue);
      }
      
      if (maxValue) {
        params.maxValue = parseFloat(maxValue);
      }

      // Map our sortBy values to the API's expected values
      let apiSortBy = 'newest';
      let apiSortOrder = 'desc';
      
      switch (sortBy) {
        case 'newest':
          apiSortBy = 'newest';
          apiSortOrder = 'desc';
          break;
        case 'oldest':
          apiSortBy = 'newest';
          apiSortOrder = 'asc';
          break;
        case 'value_high':
          apiSortBy = 'value_high';
          apiSortOrder = 'desc';
          break;
        case 'value_low':
          apiSortBy = 'value_low';
          apiSortOrder = 'asc';
          break;
        case 'popular':
          apiSortBy = 'popular';
          apiSortOrder = 'desc';
          break;
        default:
          apiSortBy = 'newest';
          apiSortOrder = 'desc';
      }

      params.sortBy = apiSortBy;
      params.sortOrder = apiSortOrder;

      const response = await searchAPI.searchItems(params);
      
      setItems(response.items || []);
      setTotalPages(response.pagination?.pages || 1);
      setTotalItems(response.pagination?.total || 0);
    } catch (error: any) {
      console.error('Failed to fetch items:', error);
      setError(error.response?.data?.error || 'Failed to fetch items');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    fetchSearchSuggestions(event.target.value);
  };

  const handleCategoryChange = (event: any) => {
    setSelectedCategory(event.target.value);
    setCurrentPage(1);
  };

  const handleConditionChange = (event: any) => {
    setSelectedCondition(event.target.value);
    setCurrentPage(1);
  };

  const handleMinValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMinValue(event.target.value);
    setCurrentPage(1);
  };

  const handleMaxValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMaxValue(event.target.value);
    setCurrentPage(1);
  };

  const handleSortByChange = (event: any) => {
    setSortBy(event.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedCondition('');
    setMinValue('');
    setMaxValue('');
    setSortBy('newest');
    setCurrentPage(1);
    setFilterModalOpen(false);
  };

  const clearFiltersFromModal = () => {
    setSelectedCategory('');
    setSelectedCondition('');
    setMinValue('');
    setMaxValue('');
    setCurrentPage(1);
  };

  const hasActiveFilters = () => {
    return selectedCategory || selectedCondition || minValue || maxValue;
  };

  const getItemImage = (item: Item) => {
    if (item.images && item.images.length > 0) {
      return item.images[0];
    }
    // Return null to indicate no image, we'll handle this in the UI
    return null;
  };

  const getCategoryIcon = () => {
    // Return the ImageIcon component for consistent Material-UI styling
    return <ImageIcon sx={{ fontSize: '4rem', color: 'text.secondary' }} />;
  };

  const formatCondition = (condition: string) => {
    return condition.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatLocation = (location: any) => {
    if (location?.city && location?.state) {
      return `${location.city}, ${location.state}`;
    }
    return 'Location not specified';
  };

  const isItemOwner = (item: Item) => {
    return user && item.user_id === user.id;
  };

  const handleImageUploadClick = (item: Item) => {
    setSelectedItemForImageUpload(item);
    setImageUploadDialogOpen(true);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0] || !selectedItemForImageUpload) {
      console.log('No file selected or no item selected');
      return;
    }

    const file = event.target.files[0];
    console.log('File selected:', file.name, file.size, file.type);
    setImageUploadLoading(true);

    try {
      console.log('Uploading image for item:', selectedItemForImageUpload.id);
      const response = await itemsAPI.uploadImages(selectedItemForImageUpload.id, [file]);
      console.log('Upload response:', response);
      
      // Refresh the items to show the new image
      await fetchItems();
      
      toast.success('Image uploaded successfully!');
      setImageUploadDialogOpen(false);
      setSelectedItemForImageUpload(null);
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      console.error('Error response:', error.response);
      toast.error(error.response?.data?.error || 'Failed to upload image');
    } finally {
      setImageUploadLoading(false);
    }
  };

  if (loading && items.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Browse Items
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/create-item')}
        >
          Add Item
        </Button>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ mb: 4 }}>
        {/* Search Bar */}
        <Box sx={{ position: 'relative', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1, position: 'relative' }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search items by title or description..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              
              {/* Search Suggestions Dropdown */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    bgcolor: 'background.paper',
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    mt: 0.5,
                    zIndex: 1000,
                    maxHeight: 200,
                    overflow: 'auto',
                    boxShadow: 3,
                  }}
                >
                  {searchSuggestions.map((suggestion, index) => (
                    <Box
                      key={index}
                      sx={{
                        px: 2,
                        py: 1.5,
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                        borderBottom: index < searchSuggestions.length - 1 ? 0 : 0,
                        borderColor: 'divider',
                      }}
                      onClick={() => {
                        setSearchQuery(suggestion);
                        setShowSuggestions(false);
                      }}
                    >
                      <Typography variant="body2">
                        {suggestion}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            {/* Sort and Filter Controls */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>
              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={handleSortByChange}
                  size="small"
                >
                  <MenuItem value="newest">Date Listed (Newest to Oldest)</MenuItem>
                  <MenuItem value="oldest">Date Listed (Oldest to Newest)</MenuItem>
                  <MenuItem value="value_high">Value (High to Low)</MenuItem>
                  <MenuItem value="value_low">Value (Low to High)</MenuItem>
                  <MenuItem value="popular">Most Popular (Views)</MenuItem>
                </Select>
              </FormControl>

              <Button
                variant={hasActiveFilters() ? "contained" : "outlined"}
                startIcon={<FilterIcon />}
                onClick={() => setFilterModalOpen(true)}
                size="small"
                color={hasActiveFilters() ? 'primary' : 'inherit'}
              >
                Filters {hasActiveFilters() && `(${[
                  selectedCategory ? 1 : 0,
                  selectedCondition ? 1 : 0,
                  minValue ? 1 : 0,
                  maxValue ? 1 : 0
                ].reduce((a, b) => a + b, 0)})`}
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Active Filters Summary */}
        {hasActiveFilters() && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Active Filters:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {selectedCategory && (
                <Chip
                  label={`Category: ${categories.find(c => c.id === selectedCategory)?.name}`}
                  size="small"
                  onDelete={() => setSelectedCategory('')}
                  color="primary"
                  variant="outlined"
                />
              )}
              {selectedCondition && (
                <Chip
                  label={`Condition: ${formatCondition(selectedCondition)}`}
                  size="small"
                  onDelete={() => setSelectedCondition('')}
                  color="secondary"
                  variant="outlined"
                />
              )}
              {minValue && (
                <Chip
                  label={`Min: $${minValue}`}
                  size="small"
                  onDelete={() => setMinValue('')}
                  color="info"
                  variant="outlined"
                />
              )}
              {maxValue && (
                <Chip
                  label={`Max: $${maxValue}`}
                  size="small"
                  onDelete={() => setMaxValue('')}
                  color="info"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        )}

        {/* Clear All Button */}
        {hasActiveFilters() && (
          <Box sx={{ mb: 3 }}>
            <Button
              variant="outlined"
              onClick={clearFilters}
              size="small"
            >
              Clear All Filters
            </Button>
          </Box>
        )}
      </Box>

      {/* Results Summary */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Showing {items.length} of {totalItems} items
        </Typography>
        {totalPages > 1 && (
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
          />
        )}
      </Box>

      {/* Loading More Indicator */}
      {loadingMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Items Grid */}
      {items.length > 0 ? (
        <Grid container spacing={3}>
          {items.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 6,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease-in-out'
                  }
                }}
                onClick={() => navigate(`/items/${item.id}`)}
              >
                {/* Image Section with Upload Option for Owners */}
                <Box sx={{ position: 'relative' }}>
                  {getItemImage(item) ? (
                    <CardMedia
                      component="img"
                      height="200"
                      image={getItemImage(item)!}
                      alt={item.title}
                      sx={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'grey.100',
                        fontSize: '4rem',
                        color: 'text.secondary'
                      }}
                    >
                      {getCategoryIcon()}
                    </Box>
                  )}
                  
                  {/* Image Upload Button for Item Owners */}
                  {isItemOwner(item) && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 1
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageUploadClick(item);
                      }}
                    >
                      <Tooltip title="Upload Image">
                        <IconButton
                          size="small"
                          sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.9)',
                            '&:hover': {
                              bgcolor: 'rgba(255, 255, 255, 1)',
                            }
                          }}
                        >
                          <PhotoCameraIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Box>

                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h6" component="h2" noWrap>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }} noWrap>
                    {item.description}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Chip 
                      label={item.category_name} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                      sx={{ mr: 1, mb: 1 }}
                    />
                    <Chip 
                      label={formatCondition(item.condition)} 
                      size="small" 
                      color="secondary" 
                      variant="outlined"
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      by {item.username}
                    </Typography>
                    <Typography variant="h6" color="primary">
                      ${item.estimated_value}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {formatLocation(item.location)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(item.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      {item.view_count || 0} views
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.favorite_count || 0} favorites
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : !loading && !error ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No items found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {debouncedSearchQuery || selectedCategory || selectedCondition || minValue || maxValue
              ? 'Try adjusting your search criteria or filters'
              : 'There are currently no items available. Be the first to add one!'
            }
          </Typography>
          {!debouncedSearchQuery && !selectedCategory && !selectedCondition && !minValue && !maxValue && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/create-item')}
            >
              Add First Item
            </Button>
          )}
        </Box>
      ) : null}

      {/* Pagination at bottom */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            size="large"
          />
        </Box>
      )}

      {/* Filter Modal */}
      <Dialog 
        open={filterModalOpen} 
        onClose={() => setFilterModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon />
            Filters
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="h6" gutterBottom>
              Category
            </Typography>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Select Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Select Category"
                onChange={handleCategoryChange}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Condition
            </Typography>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Select Condition</InputLabel>
              <Select
                value={selectedCondition}
                label="Select Condition"
                onChange={handleConditionChange}
              >
                <MenuItem value="">All Conditions</MenuItem>
                <MenuItem value="new">New</MenuItem>
                <MenuItem value="like_new">Like New</MenuItem>
                <MenuItem value="good">Good</MenuItem>
                <MenuItem value="fair">Fair</MenuItem>
                <MenuItem value="poor">Poor</MenuItem>
              </Select>
            </FormControl>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Price Range
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                label="Min Value ($)"
                type="number"
                value={minValue}
                onChange={handleMinValueChange}
                fullWidth
                placeholder="0"
              />
              <TextField
                label="Max Value ($)"
                type="number"
                value={maxValue}
                onChange={handleMaxValueChange}
                fullWidth
                placeholder="1000"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={clearFiltersFromModal} color="error">
            Clear All
          </Button>
          <Button onClick={() => setFilterModalOpen(false)} variant="contained">
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Upload Dialog */}
      <Dialog
        open={imageUploadDialogOpen}
        onClose={() => setImageUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhotoCameraIcon />
            Upload Image
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body1" gutterBottom>
              Upload an image for "{selectedItemForImageUpload?.title}"
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Supported formats: JPG, PNG, GIF. Max size: 5MB.
            </Typography>
            
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="image-upload-input"
                type="file"
                onChange={handleImageUpload}
                disabled={imageUploadLoading}
              />
              <label htmlFor="image-upload-input">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<PhotoCameraIcon />}
                  disabled={imageUploadLoading}
                  size="large"
                >
                  {imageUploadLoading ? 'Uploading...' : 'Choose Image'}
                </Button>
              </label>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageUploadDialogOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ItemsPage;

