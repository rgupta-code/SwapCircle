import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Box, Container, Typography, Paper, Avatar, Button, Grid, Divider, CircularProgress, Alert, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Snackbar } from '@mui/material';
import { Edit as EditIcon, Settings as SettingsIcon, Star as StarIcon, Close as CloseIcon, PhotoCamera as PhotoCameraIcon } from '@mui/icons-material';
import { userAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const ProfilePage: React.FC = () => {
  const { user: authUser, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    phone: '',
    locationCity: '',
    locationState: '',
    locationCountry: '',
    interests: [] as string[],
    skillsOffered: [] as string[]
  });
  const [newInterest, setNewInterest] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('success');

  const queryClient = useQueryClient();

  // Fetch current user's profile data
  const { data: profileData, isLoading, error, refetch } = useQuery(
    ['currentUserProfile'],
    userAPI.getCurrentUser,
    {
      enabled: !!authUser,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Update profile mutation
  const updateProfileMutation = useMutation(
    userAPI.updateProfile,
    {
      onSuccess: (data) => {
        setSnackbarMessage('Profile updated successfully!');
        setSnackbarSeverity('success');
        setShowSnackbar(true);
        setIsEditing(false);
        
        // Update local user state
        if (authUser) {
          updateUser({
            firstName: data.user.first_name,
            lastName: data.user.last_name,
            avatarUrl: data.user.avatar_url
          });
        }
        
        // Refetch profile data
        queryClient.invalidateQueries(['currentUserProfile']);
      },
      onError: (error: any) => {
        console.error('Profile update error:', error);
        console.error('Error response:', error.response);
        
        let errorMessage = 'Failed to update profile';
        
        if (error.response?.data?.errors) {
          // Handle validation errors
          const validationErrors = error.response.data.errors;
          errorMessage = validationErrors.map((err: any) => `${err.param}: ${err.msg}`).join(', ');
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.response?.status === 400) {
          errorMessage = 'Invalid data provided. Please check your input.';
        } else if (error.response?.status === 401) {
          errorMessage = 'Unauthorized. Please log in again.';
        } else if (error.response?.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        setSnackbarMessage(errorMessage);
        setSnackbarSeverity('error');
        setShowSnackbar(true);
      }
    }
  );

  // Initialize edit form when profile data is loaded
  React.useEffect(() => {
    if (profileData?.user) {
      const user = profileData.user;
      setEditForm({
        firstName: user.firstName || user.first_name || '',
        lastName: user.lastName || user.last_name || '',
        bio: user.bio || '',
        phone: user.phone || '',
        locationCity: user.locationCity || user.location_city || '',
        locationState: user.locationState || user.location_state || '',
        locationCountry: user.locationCountry || user.location_country || '',
        interests: Array.isArray(user.interests) ? user.interests : [],
        skillsOffered: Array.isArray(user.skillsOffered) ? user.skillsOffered : (Array.isArray(user.skills_offered) ? user.skills_offered : [])
      });
    }
  }, [profileData]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to original values
    if (profileData?.user) {
      const user = profileData.user;
      setEditForm({
        firstName: user.firstName || user.first_name || '',
        lastName: user.lastName || user.last_name || '',
        bio: user.bio || '',
        phone: user.phone || '',
        locationCity: user.locationCity || user.location_city || '',
        locationState: user.locationState || user.location_state || '',
        locationCountry: user.locationCountry || user.location_country || '',
        interests: Array.isArray(user.interests) ? user.interests : [],
        skillsOffered: Array.isArray(user.skillsOffered) ? user.skillsOffered : (Array.isArray(user.skills_offered) ? user.skills_offered : [])
      });
    }
  };

  const handleSettingsClick = () => {
    // TODO: Implement settings functionality
    setSnackbarMessage('Settings functionality coming soon!');
    setSnackbarSeverity('info');
    setShowSnackbar(true);
  };

  const handleInputChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddInterest = () => {
    if (newInterest.trim() && !(editForm.interests || []).includes(newInterest.trim())) {
      setEditForm(prev => ({
        ...prev,
        interests: [...(prev.interests || []), newInterest.trim()]
      }));
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      interests: (prev.interests || []).filter((_, i) => i !== index)
    }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !(editForm.skillsOffered || []).includes(newSkill.trim())) {
      setEditForm(prev => ({
        ...prev,
        skillsOffered: [...(prev.skillsOffered || []), newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      skillsOffered: (prev.skillsOffered || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    
    // Only append fields that have values (not empty strings)
    if (editForm.firstName.trim()) {
      formData.append('firstName', editForm.firstName.trim());
    }
    if (editForm.lastName.trim()) {
      formData.append('lastName', editForm.lastName.trim());
    }
    if (editForm.bio.trim()) {
      formData.append('bio', editForm.bio.trim());
    }
    if (editForm.phone.trim()) {
      formData.append('phone', editForm.phone.trim());
    }
    if (editForm.locationCity.trim()) {
      formData.append('locationCity', editForm.locationCity.trim());
    }
    if (editForm.locationState.trim()) {
      formData.append('locationState', editForm.locationState.trim());
    }
    if (editForm.locationCountry.trim()) {
      formData.append('locationCountry', editForm.locationCountry.trim());
    }
    
    // Always append arrays (even if empty)
    formData.append('interests', JSON.stringify(editForm.interests || []));
    formData.append('skillsOffered', JSON.stringify(editForm.skillsOffered || []));

    console.log('Submitting profile update with data:', {
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      bio: editForm.bio,
      phone: editForm.phone,
      locationCity: editForm.locationCity,
      locationState: editForm.locationState,
      locationCountry: editForm.locationCountry,
      interests: editForm.interests,
      skillsOffered: editForm.skillsOffered
    });

    updateProfileMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading your profile...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load profile. Please try again.
        </Alert>
        <Button variant="outlined" onClick={() => refetch()}>
          Retry
        </Button>
      </Container>
    );
  }

  const user = profileData?.user;

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">
          No profile data found. Please log in again.
        </Alert>
      </Container>
    );
  }

  const formatLocation = () => {
    const parts = [user.locationCity || user.location_city, user.locationState || user.location_state, user.locationCountry || user.location_country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Location not set';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get the correct user data with fallbacks
  const getUserField = (field: string, fallbackField?: string) => {
    return (user as any)[field] || (fallbackField ? (user as any)[fallbackField] : '') || '';
  };

  const getUserArrayField = (field: string, fallbackField?: string) => {
    const value = (user as any)[field] || (fallbackField ? (user as any)[fallbackField] : []);
    return Array.isArray(value) ? value : [];
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Profile
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Avatar
                src={getUserField('avatarUrl', 'avatar_url') || undefined}
                sx={{ 
                  width: 120, 
                  height: 120, 
                  fontSize: '3rem',
                  bgcolor: 'primary.main'
                }}
              >
                {!getUserField('avatarUrl', 'avatar_url') && (
                  getUserField('firstName', 'first_name').charAt(0) + getUserField('lastName', 'last_name').charAt(0)
                )}
              </Avatar>
            </Box>
            <Typography variant="h6" gutterBottom>
              {getUserField('firstName', 'first_name')} {getUserField('lastName', 'last_name')}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              @{user.username}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {formatLocation()}
            </Typography>
            
            {(user.trustScore || user.trust_score) > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <StarIcon sx={{ color: 'gold', mr: 1 }} />
                <Typography variant="body2">
                  Trust Score: {user.trustScore || user.trust_score}
                </Typography>
              </Box>
            )}
            
            <Box sx={{ mt: 2 }}>
              <Button 
                variant="outlined" 
                startIcon={<EditIcon />} 
                sx={{ mr: 1 }}
                onClick={handleEditClick}
              >
                Edit Profile
              </Button>
              <Button variant="outlined" startIcon={<SettingsIcon />} onClick={handleSettingsClick}>
                Settings
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Profile Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  First Name
                </Typography>
                <Typography variant="body1">{getUserField('firstName', 'first_name')}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Last Name
                </Typography>
                <Typography variant="body1">{getUserField('lastName', 'last_name')}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">{user.email}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Bio
                </Typography>
                <Typography variant="body1">
                  {user.bio || 'No bio added yet.'}
                </Typography>
              </Grid>
              {(user.phone) && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Phone
                  </Typography>
                  <Typography variant="body1">{user.phone}</Typography>
                </Grid>
              )}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Member Since
                </Typography>
                <Typography variant="body1">{formatDate(user.createdAt || user.created_at)}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Trades
                </Typography>
                <Typography variant="body1">
                  {(user.totalTrades || user.total_trades || 0)} trades ({(user.successfulTrades || user.successful_trades || 0)} successful)
                </Typography>
              </Grid>
              {getUserArrayField('interests').length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Interests
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {getUserArrayField('interests').map((interest: string, index: number) => (
                      <Typography key={index} variant="body2" sx={{ 
                        bgcolor: 'primary.light', 
                        color: 'primary.contrastText', 
                        px: 1, 
                        py: 0.5, 
                        borderRadius: 1 
                      }}>
                        {interest}
                      </Typography>
                    ))}
                  </Box>
                </Grid>
              )}
              {getUserArrayField('skillsOffered', 'skills_offered').length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Skills Offered
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {getUserArrayField('skillsOffered', 'skills_offered').map((skill: string, index: number) => (
                      <Typography key={index} variant="body2" sx={{ 
                        bgcolor: 'secondary.light', 
                        color: 'secondary.contrastText', 
                        px: 1, 
                        py: 0.5, 
                        borderRadius: 1 
                      }}>
                        {skill}
                      </Typography>
                    ))}
                  </Box>
                </Grid>
              )}
              {user.swapCredits && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Swap Credits
                  </Typography>
                  <Typography variant="body1">
                    Balance: {user.swapCredits.balance} credits
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Edit Profile Dialog */}
      <Dialog 
        open={isEditing} 
        onClose={handleCancelEdit}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Edit Profile
          <IconButton
            aria-label="close"
            onClick={handleCancelEdit}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={editForm.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={editForm.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bio"
                value={editForm.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                margin="normal"
                multiline
                rows={3}
                helperText="Tell others about yourself (max 500 characters)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                value={editForm.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                margin="normal"
                placeholder="+1 (555) 123-4567"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="City"
                value={editForm.locationCity}
                onChange={(e) => handleInputChange('locationCity', e.target.value)}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="State/Province"
                value={editForm.locationState}
                onChange={(e) => handleInputChange('locationState', e.target.value)}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Country"
                value={editForm.locationCountry}
                onChange={(e) => handleInputChange('locationCountry', e.target.value)}
                margin="normal"
              />
            </Grid>
            
            {/* Interests */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Interests
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  size="small"
                  placeholder="Add interest"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddInterest()}
                />
                <Button variant="outlined" onClick={handleAddInterest}>
                  Add
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {editForm.interests.map((interest, index) => (
                  <Typography key={index} variant="body2" sx={{ 
                    bgcolor: 'primary.light', 
                    color: 'primary.contrastText', 
                    px: 1, 
                    py: 0.5, 
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}>
                    {interest}
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveInterest(index)}
                      sx={{ color: 'inherit', p: 0, minWidth: 'auto' }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Typography>
                ))}
              </Box>
            </Grid>

            {/* Skills */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Skills Offered
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  size="small"
                  placeholder="Add skill"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                />
                <Button variant="outlined" onClick={handleAddSkill}>
                  Add
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {editForm.skillsOffered.map((skill, index) => (
                  <Typography key={index} variant="body2" sx={{ 
                    bgcolor: 'secondary.light', 
                    color: 'secondary.contrastText', 
                    px: 1, 
                    py: 0.5, 
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}>
                    {skill}
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveSkill(index)}
                      sx={{ color: 'inherit', p: 0, minWidth: 'auto' }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Typography>
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCancelEdit} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={updateProfileMutation.isLoading}
          >
            {updateProfileMutation.isLoading ? <CircularProgress size={20} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSnackbar(false)}
      >
        <Alert 
          onClose={() => setShowSnackbar(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProfilePage;

