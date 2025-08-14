import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, CardMedia, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ItemsPage: React.FC = () => {
  const navigate = useNavigate();

  // Mock data for demonstration
  const mockItems = [
    {
      id: '1',
      title: 'Vintage Gaming Console',
      description: 'Classic gaming console in excellent condition. Perfect for retro gaming enthusiasts.',
      image: 'https://picsum.photos/300/200?random=1',
      condition: 'Like New',
      estimatedValue: 150,
      category: 'Electronics',
      user: 'gamer123',
      location: 'New York, NY'
    },
    {
      id: '2',
      title: 'Handmade Wooden Shelf',
      description: 'Beautiful handcrafted wooden shelf unit. Perfect for home organization.',
      image: 'https://picsum.photos/300/200?random=2',
      condition: 'Good',
      estimatedValue: 80,
      category: 'Home & Garden',
      user: 'craftsman',
      location: 'Portland, OR'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
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

      <Grid container spacing={3}>
        {mockItems.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="200"
                image={item.image}
                alt={item.title}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h6" component="h2">
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {item.description}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="primary">
                    {item.condition}
                  </Typography>
                  <Typography variant="h6" color="primary">
                    ${item.estimatedValue}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default ItemsPage;

