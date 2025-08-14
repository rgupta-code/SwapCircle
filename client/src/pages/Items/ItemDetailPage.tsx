import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, Container, Typography, Paper, Grid, Button, Chip } from '@mui/material';
import { ArrowBack, Favorite, Share } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ItemDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock item data
  const mockItem = {
    id: '1',
    title: 'Vintage Gaming Console',
    description: 'Classic gaming console in excellent condition. Perfect for retro gaming enthusiasts. This console comes with two controllers and 5 games. Great for collectors or anyone who loves retro gaming.',
    image: 'https://picsum.photos/600/400?random=12',
    condition: 'Like New',
    estimatedValue: 150,
    category: 'Electronics',
    user: 'gamer123',
    location: 'New York, NY',
    tags: ['gaming', 'retro', 'electronics', 'collector']
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        Back
      </Button>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <img
            src={mockItem.image}
            alt={mockItem.title}
            style={{ width: '100%', borderRadius: '8px' }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {mockItem.title}
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Chip label={mockItem.condition} color="primary" sx={{ mr: 1 }} />
              <Chip label={mockItem.category} variant="outlined" sx={{ mr: 1 }} />
            </Box>
            
            <Typography variant="h5" color="primary" gutterBottom>
              ${mockItem.estimatedValue}
            </Typography>
            
            <Typography variant="body1" paragraph>
              {mockItem.description}
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Location: {mockItem.location}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Shipping: {mockItem.allowsShipping ? 'Yes' : 'No'}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Pickup: {mockItem.allowsPickup ? 'Yes' : 'No'}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Meetup: {mockItem.allowsMeetup ? 'Yes' : 'No'}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              {mockItem.tags.map((tag) => (
                <Chip key={tag} label={tag} size="small" sx={{ mr: 1, mb: 1 }} />
              ))}
            </Box>
            
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
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ItemDetailPage;

