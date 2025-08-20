import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Grid, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Select,
  Chip,
  FormHelperText,
  Alert,
  CircularProgress,
  IconButton,
  Card,
  CardMedia,
  CardContent,
  Divider,
  Switch,
  FormControlLabel,
  Slider,
  InputAdornment,
  Tooltip
} from '@mui/material';
import { 
  Save as SaveIcon, 
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { itemsAPI, categoryAPI } from '../../services/api';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

interface CreateItemForm {
  title: string;
  description: string;
  categoryId: string;
  itemType: 'good' | 'service';
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  estimatedValue: string;
  tags: string[];
  allowsShipping: boolean;
  allowsPickup: boolean;
  allowsMeetup: boolean;
  meetupRadius: number;
  tradePreferences: string;
}

const CreateItemPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const [formData, setFormData] = useState<CreateItemForm>({
    title: '',
    description: '',
    categoryId: '',
    itemType: 'good',
    condition: 'good',
    estimatedValue: '',
    tags: [],
    allowsShipping: false,
    allowsPickup: true,
    allowsMeetup: true,
    meetupRadius: 25,
    tradePreferences: ''
  });

  const [errors, setErrors] = useState<Partial<CreateItemForm>>({});

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const data = await categoryAPI.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setError('Failed to load categories. Please try again.');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateItemForm> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    } else if (!formData.categoryId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      newErrors.categoryId = 'Invalid category ID format';
    }

    if (formData.estimatedValue && parseFloat(formData.estimatedValue) < 0) {
      newErrors.estimatedValue = 'Value must be positive';
    }

    if (formData.tags && formData.tags.length > 10) {
      newErrors.tags = ['Maximum 10 tags allowed'];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CreateItemForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages = Array.from(files);
      
      // Check file count limit
      if (images.length + newImages.length > 5) {
        setError('Maximum 5 images allowed');
        return;
      }

      // Validate file types and sizes
      const validFiles = newImages.filter(file => {
        if (!file.type.startsWith('image/')) {
          setError('Only image files are allowed');
          return false;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB
          setError('Image size must be less than 5MB');
          return false;
        }
        return true;
      });

      if (validFiles.length > 0) {
        setImages(prev => [...prev, ...validFiles]);
        
        // Create preview URLs
        validFiles.forEach(file => {
          const url = URL.createObjectURL(file);
          setImageUrls(prev => [...prev, url]);
        });
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim()) && formData.tags.length < 10) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to create an item');
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);


    try {
      const formDataToSend = new FormData();
      
      // Add form fields
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('categoryId', formData.categoryId);
      formDataToSend.append('itemType', formData.itemType);
      formDataToSend.append('condition', formData.condition);
      formDataToSend.append('estimatedValue', formData.estimatedValue || '0');
      formDataToSend.append('tags', JSON.stringify(formData.tags || []));
      // Fix boolean fields - send as proper boolean values
      formDataToSend.append('allowsShipping', formData.allowsShipping ? 'true' : 'false');
      formDataToSend.append('allowsPickup', formData.allowsPickup ? 'true' : 'false');
      formDataToSend.append('allowsMeetup', formData.allowsMeetup ? 'true' : 'false');
      formDataToSend.append('meetupRadius', formData.meetupRadius.toString());
      formDataToSend.append('tradePreferences', formData.tradePreferences || '');

      // Add images
      images.forEach((image, index) => {
        formDataToSend.append('images', image);
      });

      // Debug: Log the form data being sent
      console.log('Form data being sent:', {
        title: formData.title.trim(),
        description: formData.description.trim(),
        categoryId: formData.categoryId,
        itemType: formData.itemType,
        condition: formData.condition,
        estimatedValue: formData.estimatedValue || '0',
        tags: formData.tags || [],
        allowsShipping: formData.allowsShipping,
        allowsPickup: formData.allowsPickup,
        allowsMeetup: formData.allowsMeetup,
        meetupRadius: formData.meetupRadius,
        tradePreferences: formData.tradePreferences,
        imageCount: images.length
      });

      // Debug: Log FormData contents
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`FormData ${key}:`, value);
      }

      const response = await itemsAPI.createItem(formDataToSend);
      
      setSuccess('Item created successfully!');
      
      // Redirect to the new item page after a short delay
      setTimeout(() => {
        navigate(`/items/${response.item.id}`);
      }, 2000);

    } catch (err: any) {
      console.error('Failed to create item:', err);
      
      // Enhanced error logging
      if (err.response) {
        console.error('Error response:', {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data,
          headers: err.response.headers
        });
        
        // Log validation errors if they exist
        if (err.response.data && err.response.data.errors) {
          console.error('Validation errors:', err.response.data.errors);
        }
      } else if (err.request) {
        console.error('Error request:', err.request);
      } else {
        console.error('Error message:', err.message);
      }
      
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to create item. Please try again.');
      
      // Show detailed validation errors if available
      if (err.response?.data?.errors) {
        const validationErrors = err.response.data.errors.map((err: any) => `${err.param}: ${err.msg}`).join(', ');
        setError(`Validation errors: ${validationErrors}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && newTag.trim()) {
      event.preventDefault();
      addTag();
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      categoryId: '',
      itemType: 'good',
      condition: 'good',
      estimatedValue: '',
      tags: [],
      allowsShipping: false,
      allowsPickup: true,
      allowsMeetup: true,
      meetupRadius: 25,
      tradePreferences: ''
    });
    setImages([]);
    setImageUrls([]);
    setErrors({});
    setError(null);
    setSuccess(null);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Create New Item
      </Typography>
      
      {/* Success Message */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 4 }}>
        {/* Form Progress */}
        {/* <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Form Progress
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              label="Basic Info" 
              color={formData.title && formData.description && formData.categoryId ? 'success' : 'default'}
              size="small"
            />
            <Chip 
              label="Details" 
              color={formData.condition && formData.estimatedValue !== undefined ? 'success' : 'default'}
              size="small"
            />
            <Chip 
              label="Images" 
              color={images.length > 0 ? 'success' : 'default'}
              size="small"
            />
            <Chip 
              label="Options" 
              color={formData.allowsPickup || formData.allowsMeetup || formData.allowsShipping ? 'success' : 'default'}
              size="small"
            />
          </Box>
        </Box> */}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Title */}
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Item Title"
                placeholder="e.g., Vintage Camera, Guitar Lessons"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                error={!!errors.title}
                helperText={errors.title || 'Give your item a clear, descriptive title'}
                inputProps={{ maxLength: 100 }}
              />
              {/* <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                💡 Use specific keywords that people would search for
              </Typography> */}
            </Grid>
            
            {/* Description */}
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={4}
                label="Description"
                placeholder="Describe your item or service in detail..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                error={!!errors.description}
                helperText={errors.description || 'Be specific about what you\'re offering'}
                inputProps={{ maxLength: 1000 }}
              />
              {/*
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                💡 Include details like brand, model, size, color, and any imperfections
              </Typography>
              */}
            </Grid>

            {/* Category and Item Type */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errors.categoryId}>
                <InputLabel>Category</InputLabel>
                <Select
                  label="Category"
                  value={formData.categoryId}
                  onChange={(e) => handleInputChange('categoryId', e.target.value)}
                  disabled={categoriesLoading}
                >
                  {categoriesLoading ? (
                    <MenuItem disabled>
                      <CircularProgress size={16} sx={{ mr: 1 }} />
                      Loading categories...
                    </MenuItem>
                  ) : (
                    categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
                {errors.categoryId && (
                  <FormHelperText>{errors.categoryId}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Item Type</InputLabel>
                <Select
                  label="Item Type"
                  value={formData.itemType}
                  onChange={(e) => handleInputChange('itemType', e.target.value)}
                >
                  <MenuItem value="good">Good</MenuItem>
                  <MenuItem value="service">Service</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Condition and Estimated Value */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Condition</InputLabel>
                <Select
                  label="Condition"
                  value={formData.condition}
                  onChange={(e) => handleInputChange('condition', e.target.value)}
                >
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="like_new">Like New</MenuItem>
                  <MenuItem value="good">Good</MenuItem>
                  <MenuItem value="fair">Fair</MenuItem>
                  <MenuItem value="poor">Poor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Estimated Value ($)"
                type="number"
                placeholder="0.00"
                value={formData.estimatedValue}
                onChange={(e) => handleInputChange('estimatedValue', e.target.value)}
                error={!!errors.estimatedValue}
                helperText={errors.estimatedValue || 'Leave empty if free'}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            {/* Tags */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags"
                placeholder="Add tags to help people find your item (press Enter to add)"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                error={!!errors.tags}
                helperText={errors.tags || `Add relevant tags (${formData.tags.length}/10)`}
                InputProps={{
                  endAdornment: (
                    <Button
                      onClick={addTag}
                      disabled={!newTag.trim() || formData.tags.length >= 10}
                      startIcon={<AddIcon />}
                      size="small"
                    >
                      Add
                    </Button>
                  ),
                }}
              />
              {formData.tags.length > 0 && (
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      onDelete={() => removeTag(tag)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              )}
            </Grid>

            {/* Image Upload */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Images
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload up to 5 images to showcase your item (JPG, PNG, GIF - max 5MB each)
              </Typography>
              
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="image-upload"
                multiple
                type="file"
                onChange={handleImageUpload}
              />
              <label htmlFor="image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                  disabled={images.length >= 5}
                >
                  Upload Images ({images.length}/5)
                </Button>
              </label>
              
              {images.length === 0 && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  💡 Adding images increases your item's visibility by 3x!
                </Typography>
              )}

              {/* Image Previews */}
              {imageUrls.length > 0 && (
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  {imageUrls.map((url, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card>
                        <CardMedia
                          component="img"
                          height="140"
                          image={url}
                          alt={`Preview ${index + 1}`}
                        />
                        <CardContent sx={{ p: 1 }}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeImage(index)}
                            sx={{ float: 'right' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>
                <Typography variant="h6">Delivery & Meeting Options</Typography>
              </Divider>
            </Grid>

            {/* Shipping and Pickup Options */}
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.allowsShipping}
                    onChange={(e) => handleInputChange('allowsShipping', e.target.checked)}
                  />
                }
                label="Allow Shipping"
              />
              <Typography variant="caption" color="text.secondary" display="block">
                Ship items to other users
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.allowsPickup}
                    onChange={(e) => handleInputChange('allowsPickup', e.target.checked)}
                  />
                }
                label="Allow Pickup"
              />
              <Typography variant="caption" color="text.secondary" display="block">
                Users can pick up from your location
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.allowsMeetup}
                    onChange={(e) => handleInputChange('allowsMeetup', e.target.checked)}
                  />
                }
                label="Allow Meetup"
              />
              <Typography variant="caption" color="text.secondary" display="block">
                Meet users at a public location
              </Typography>
            </Grid>

            {/* Meetup Radius */}
            {formData.allowsMeetup && (
              <Grid item xs={12}>
                <Typography gutterBottom>
                  Meetup Radius: {formData.meetupRadius} miles
                </Typography>
                <Slider
                  value={formData.meetupRadius}
                  onChange={(_, value) => handleInputChange('meetupRadius', value)}
                  min={1}
                  max={100}
                  marks={[
                    { value: 1, label: '1 mi' },
                    { value: 25, label: '25 mi' },
                    { value: 50, label: '50 mi' },
                    { value: 100, label: '100 mi' }
                  ]}
                  valueLabelDisplay="auto"
                />
              </Grid>
            )}

            {/* Trade Preferences */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Trade Preferences (Optional)"
                placeholder="What would you like to trade for? Any specific items or services you're looking for?"
                value={formData.tradePreferences}
                onChange={(e) => handleInputChange('tradePreferences', e.target.value)}
                helperText="Let others know what you're interested in trading for"
              />
            </Grid>

            {/* Submit Buttons */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  sx={{ flex: 1 }}
                  disabled={loading || categoriesLoading}
                >
                  {loading ? 'Creating Item...' : 'Create Item'}
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  size="large"
                  onClick={resetForm}
                  disabled={loading || categoriesLoading}
                >
                  Reset Form
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
    </Container>
  );
};

export default CreateItemPage;

