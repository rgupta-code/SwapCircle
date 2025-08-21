import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Box, Container, Typography, Paper, Avatar, Button, Grid, Divider, Chip, CircularProgress, Alert, Card, CardMedia, CardContent } from '@mui/material';
import { Message as MessageIcon, Star as StarIcon, LocationOn as LocationIcon, CalendarToday as CalendarIcon } from '@mui/icons-material';
import { userAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const UserProfilePage: React.FC = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();

  // Fetch user profile data
  const { data: profileData, isLoading, error, refetch } = useQuery(
    ['userProfile', username],
    () => userAPI.getUserProfile(username!),
    {
      enabled: !!username,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Fetch user's items
  const { data: itemsData } = useQuery(
    ['userItems', username],
    () => userAPI.getUserItems(username!, { limit: 6 }),
    {
      enabled: !!username,
      staleTime: 5 * 60 * 1000,
    }
  );

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading profile...
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

  if (!profileData?.user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">
          User not found.
        </Alert>
      </Container>
    );
  }

  const { user, items, reviews, totalReviews } = profileData;
  const userItems = itemsData?.items || items || [];

  const formatLocation = () => {
    const parts = [user.locationCity, user.locationState, user.locationCountry].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Location not set';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const isOwnProfile = currentUser?.username === username;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&size=120&background=random`}
              sx={{ width: 120, height: 120, mb: 2 }}
            />
            <Typography variant="h5" gutterBottom>
              {user.firstName} {user.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              @{user.username}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
              <LocationIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 'small' }} />
              <Typography variant="body2" color="text.secondary">
                {formatLocation()}
              </Typography>
            </Box>
            
            {user.averageRating > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <StarIcon sx={{ color: 'gold', mr: 1 }} />
                <Typography variant="body2">
                  {user.averageRating} ({totalReviews} reviews)
                </Typography>
              </Box>
            )}
            
            {user.trustScore > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <StarIcon sx={{ color: 'blue', mr: 1 }} />
                <Typography variant="body2">
                  Trust Score: {user.trustScore}
                </Typography>
              </Box>
            )}
            
            {!isOwnProfile && (
              <Button variant="contained" startIcon={<MessageIcon />} fullWidth>
                Send Message
              </Button>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              About
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body1" paragraph>
              {user.bio || 'No bio added yet.'}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CalendarIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 'small' }} />
              <Typography variant="subtitle2" color="text.secondary">
                Member since {formatDate(user.createdAt)}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <StarIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 'small' }} />
              <Typography variant="subtitle2" color="text.secondary">
                {user.totalTrades || 0} total trades ({user.successfulTrades || 0} successful)
              </Typography>
            </Box>
            
            {user.interests && user.interests.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Interests
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {user.interests.map((interest: string, index: number) => (
                    <Chip key={index} label={interest} size="small" />
                  ))}
                </Box>
              </Box>
            )}
            
            {user.skillsOffered && user.skillsOffered.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Skills Offered
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {user.skillsOffered.map((skill: string, index: number) => (
                    <Chip key={index} label={skill} size="small" color="primary" />
                  ))}
                </Box>
              </Box>
            )}
          </Paper>

          {/* User's Items */}
          {userItems.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Available Items
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {userItems.slice(0, 6).map((item: any) => (
                  <Grid item xs={12} sm={6} md={4} key={item.id}>
                    <Card sx={{ height: '100%' }}>
                      <CardMedia
                        component="img"
                        height="140"
                        image={item.images?.[0] || 'https://via.placeholder.com/300x200?text=No+Image'}
                        alt={item.title}
                      />
                      <CardContent>
                        <Typography variant="subtitle2" noWrap>
                          {item.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {item.categoryName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.condition} • ${item.estimatedValue}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {/* Recent Reviews */}
          {reviews && reviews.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Reviews
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {reviews.slice(0, 3).map((review: any, index: number) => (
                  <Box key={index} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar 
                        src={review.reviewerAvatar} 
                        sx={{ width: 24, height: 24, mr: 1 }}
                      />
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        {review.reviewerUsername}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {[...Array(5)].map((_, i) => (
                          <StarIcon 
                            key={i} 
                            sx={{ 
                              color: i < review.rating ? 'gold' : 'grey.300',
                              fontSize: 'small'
                            }} 
                          />
                        ))}
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {review.comment}
                    </Typography>
                    {review.tags && review.tags.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                        {review.tags.map((tag: string, tagIndex: number) => (
                          <Chip key={tagIndex} label={tag} size="small" variant="outlined" />
                        ))}
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default UserProfilePage;

