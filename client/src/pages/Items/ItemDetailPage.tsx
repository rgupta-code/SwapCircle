import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Paper, Grid, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Alert, IconButton, Tooltip } from '@mui/material';
import { ArrowBack, Favorite, Share, Edit, Delete, VisibilityOff, Visibility, Image as ImageIcon, PhotoCamera as PhotoCameraIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { itemsAPI } from '../../services/api';
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
  first_name: string;
  last_name: string;
  avatar_url?: string;
  trust_score: number;
  is_available: boolean;
  allows_shipping: boolean;
  allows_pickup: boolean;
  allows_meetup: boolean;
  meetup_radius: number;
  tags: string[];
  location: {
    city: string;
    state: string;
    country: string;
  };
  created_at: string;
  view_count: number;
  favorite_count: number;
}

const ItemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Image upload state
  const [imageUploadDialogOpen, setImageUploadDialogOpen] = useState(false);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    condition: '',
    estimated_value: '',
    allows_shipping: false,
    allows_pickup: true,
    allows_meetup: true,
    meetup_radius: 25
  });

  useEffect(() => {
    if (id) {
      fetchItem();
    }
  }, [id]);

  const fetchItem = async () => {
    try {
      setLoading(true);
      const response = await itemsAPI.getItem(id!);
      setItem(response.item);
      
      // Initialize edit form
      setEditForm({
        title: response.item.title,
        description: response.item.description,
        condition: response.item.condition,
        estimated_value: response.item.estimated_value?.toString() || '',
        allows_shipping: response.item.allows_shipping,
        allows_pickup: response.item.allows_pickup,
        allows_meetup: response.item.allows_meetup,
        meetup_radius: response.item.meetup_radius
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch item');
      toast.error('Failed to fetch item');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    try {
      setActionLoading(true);
      const formData = new FormData();
      formData.append('title', editForm.title);
      formData.append('description', editForm.description);
      formData.append('condition', editForm.condition);
      formData.append('estimatedValue', editForm.estimated_value);
      formData.append('allowsShipping', editForm.allows_shipping.toString());
      formData.append('allowsPickup', editForm.allows_pickup.toString());
      formData.append('allowsMeetup', editForm.allows_meetup.toString());
      formData.append('meetupRadius', editForm.meetup_radius.toString());

      await itemsAPI.updateItem(id!, formData);
      await fetchItem(); // Refresh item data
      setEditDialogOpen(false);
      toast.success('Item updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update item');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    try {
      setActionLoading(true);
      await itemsAPI.toggleItemAvailability(id!);
      await fetchItem(); // Refresh item data
      toast.success('Item availability updated');
    } catch (err: any) {
      toast.error('Failed to update item availability');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      await itemsAPI.deleteItem(id!);
      toast.success('Item deleted successfully');
      navigate('/items');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete item');
    } finally {
      setActionLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleImageUploadClick = () => {
    setImageUploadDialogOpen(true);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0] || !item) {
      return;
    }

    const file = event.target.files[0];
    setImageUploadLoading(true);

    try {
      const response = await itemsAPI.uploadImages(item.id, [file]);
      console.log('Image upload response:', response);
      
      // Refresh item data to show the new image
      await fetchItem();
      
      toast.success('Image uploaded successfully!');
      setImageUploadDialogOpen(false);
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      toast.error(error.response?.data?.error || 'Failed to upload image');
    } finally {
      setImageUploadLoading(false);
    }
  };

  const isOwner = user && item && user.id === item.user_id;

  const getItemImage = () => {
    if (item?.images && item.images.length > 0) {
      return item.images[0];
    }
    return null;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (error || !item) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Item not found'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
        variant="text"
      >
        Back
      </Button>

      {/* Owner Actions */}
      {isOwner && (
        <Box sx={{ mb: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={item.is_available ? <VisibilityOff /> : <Visibility />}
            onClick={handleToggleAvailability}
            disabled={actionLoading}
          >
            {item.is_available ? 'Mark Unavailable' : 'Mark Available'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<PhotoCameraIcon />}
            onClick={handleImageUploadClick}
          >
            Upload Image
          </Button>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={handleEdit}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete
          </Button>
        </Box>
      )}

      {/* Item Content */}
      <Grid container spacing={4}>
                 {/* Image Section */}
         <Grid item xs={12} md={6}>
           <Paper sx={{ p: 2, textAlign: 'center' }}>
             {getItemImage() ? (
               <img
                 src={getItemImage()!}
                 alt={item.title}
                 style={{ 
                   width: '100%', 
                   maxHeight: '500px', 
                   objectFit: 'cover',
                   borderRadius: '8px' 
                 }}
               />
             ) : (
               <Box
                 sx={{
                   height: '400px',
                   display: 'flex',
                   flexDirection: 'column',
                   alignItems: 'center',
                   justifyContent: 'center',
                   bgcolor: 'grey.100',
                   borderRadius: '8px',
                   gap: 2
                 }}
               >
                 <ImageIcon sx={{ fontSize: '6rem', color: 'text.secondary' }} />
                 <Typography variant="body2" color="text.secondary">
                   No image available
                 </Typography>
                 {isOwner && (
                   <Button
                     variant="outlined"
                     startIcon={<PhotoCameraIcon />}
                     onClick={handleImageUploadClick}
                     size="small"
                   >
                     Add Image
                   </Button>
                 )}
               </Box>
             )}
           </Paper>
         </Grid>
        
        {/* Details Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            {/* Title and Status */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                {item.title}
              </Typography>
              {!item.is_available && (
                <Chip label="Unavailable" color="error" sx={{ mb: 1 }} />
              )}
            </Box>
            
            {/* Condition and Category */}
            <Box sx={{ mb: 2 }}>
              <Chip 
                label={item.condition.replace('_', ' ')} 
                color="primary" 
                sx={{ mr: 1 }} 
              />
              <Chip 
                label={item.category_name} 
                variant="outlined" 
                sx={{ mr: 1 }} 
              />
            </Box>
            
            {/* Price */}
            <Typography variant="h5" color="primary" gutterBottom>
              ${item.estimated_value}
            </Typography>
            
            {/* Description */}
            <Typography variant="body1" paragraph sx={{ mb: 3 }}>
              {item.description}
            </Typography>
            
            {/* Location and Shipping Info */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                📍 {item.location.city}, {item.location.state}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                🚚 Shipping: {item.allows_shipping ? 'Yes' : 'No'}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                🚗 Pickup: {item.allows_pickup ? 'Yes' : 'No'}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                🤝 Meetup: {item.allows_meetup ? 'Yes' : 'No'}
              </Typography>
              {item.allows_meetup && (
                <Typography variant="subtitle2" gutterBottom>
                  📍 Meetup radius: {item.meetup_radius} miles
                </Typography>
              )}
            </Box>
            
            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <Box sx={{ mb: 3 }}>
                {item.tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" sx={{ mr: 1, mb: 1 }} />
                ))}
              </Box>
            )}
            
            {/* Owner Info */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Listed by: {item.first_name} {item.last_name} (@{item.username})
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Trust Score: {item.trust_score} • Views: {item.view_count} • Favorites: {item.favorite_count}
              </Typography>
            </Box>
            
            {/* Action Buttons */}
            {!isOwner && item.is_available && (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained" size="large" fullWidth>
                  Make Offer
                </Button>
                <Button variant="outlined" size="large">
                  <Favorite />
                </Button>
                                 <Button variant="outlined" size="large">
                   <Share />
                 </Button>
               </Box>
             )}
           </Paper>
         </Grid>
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Item</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Title"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              margin="normal"
              multiline
              rows={4}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Condition</InputLabel>
              <Select
                value={editForm.condition}
                onChange={(e) => setEditForm({ ...editForm, condition: e.target.value })}
                label="Condition"
              >
                <MenuItem value="new">New</MenuItem>
                <MenuItem value="like_new">Like New</MenuItem>
                <MenuItem value="good">Good</MenuItem>
                <MenuItem value="fair">Fair</MenuItem>
                <MenuItem value="poor">Poor</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Estimated Value ($)"
              type="number"
              value={editForm.estimated_value}
              onChange={(e) => setEditForm({ ...editForm, estimated_value: e.target.value })}
              margin="normal"
            />
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Shipping Options</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant={editForm.allows_shipping ? "contained" : "outlined"}
                  onClick={() => setEditForm({ ...editForm, allows_shipping: !editForm.allows_shipping })}
                  size="small"
                >
                  Shipping
                </Button>
                <Button
                  variant={editForm.allows_pickup ? "contained" : "outlined"}
                  onClick={() => setEditForm({ ...editForm, allows_pickup: !editForm.allows_pickup })}
                  size="small"
                >
                  Pickup
                </Button>
                <Button
                  variant={editForm.allows_meetup ? "contained" : "outlined"}
                  onClick={() => setEditForm({ ...editForm, allows_meetup: !editForm.allows_meetup })}
                  size="small"
                >
                  Meetup
                </Button>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained" disabled={actionLoading}>
            {actionLoading ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Item</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{item.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={actionLoading}>
            {actionLoading ? 'Deleting...' : 'Delete'}
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
              Upload an image for "{item.title}"
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

export default ItemDetailPage;


