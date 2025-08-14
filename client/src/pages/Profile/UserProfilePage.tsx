import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, Container, Typography, Paper, Avatar, Button, Grid, Divider, Chip } from '@mui/material';
import { Message as MessageIcon, Star as StarIcon } from '@mui/icons-material';

const UserProfilePage: React.FC = () => {
  const { username } = useParams();

  // Mock data for now
  const mockUser = {
    username: username || 'johndoe',
    firstName: 'John',
    lastName: 'Doe',
    bio: 'Passionate about sustainable living and community building through bartering.',
    location: 'New York, NY',
    joinDate: '2023',
    rating: 4.8,
    reviewCount: 24,
    avatar: 'https://via.placeholder.com/120',
    tags: ['reliable', 'friendly', 'punctual'],
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              src="https://picsum.photos/120/120?random=11"
              sx={{ width: 120, height: 120, mb: 2 }}
            />
            <Typography variant="h5" gutterBottom>
              {mockUser.firstName} {mockUser.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              @{mockUser.username}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {mockUser.location}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <StarIcon sx={{ color: 'gold', mr: 1 }} />
              <Typography variant="body2">
                {mockUser.rating} ({mockUser.reviewCount} reviews)
              </Typography>
            </Box>
            
            <Button variant="contained" startIcon={<MessageIcon />} fullWidth>
              Send Message
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              About
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body1" paragraph>
              {mockUser.bio}
            </Typography>
            
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Member since {mockUser.joinDate}
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Tags
              </Typography>
              {mockUser.tags.map((tag) => (
                <Chip key={tag} label={tag} sx={{ mr: 1, mb: 1 }} />
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UserProfilePage;

