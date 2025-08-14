import React, { useState } from 'react';
import { Box, Container, Typography, Paper, Grid, Card, CardContent, CardMedia, Button, Chip, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { AutoAwesome as AutoAwesomeIcon, Favorite as FavoriteIcon, Share as ShareIcon } from '@mui/icons-material';

const MatchingPage: React.FC = () => {
  const [searchPreferences, setSearchPreferences] = useState({
    interests: '',
    location: '',
    maxDistance: '25',
  });

  // Mock data for demonstration
  const mockMatches = [
    {
      id: '1',
      title: 'Vintage Gaming Console',
      description: 'Classic gaming console in excellent condition. Perfect for retro gaming enthusiasts.',
      image: 'https://picsum.photos/300/200?random=3',
      condition: 'Like New',
      estimatedValue: 150,
      category: 'Electronics',
      user: 'gamer123',
      location: 'New York, NY',
      matchScore: 95
    },
    {
      id: '2',
      title: 'Handmade Wooden Shelf',
      description: 'Beautiful handcrafted wooden shelf unit. Perfect for home organization.',
      image: 'https://picsum.photos/300/200?random=4',
      condition: 'Good',
      estimatedValue: 80,
      category: 'Home & Garden',
      user: 'craftsman',
      location: 'Portland, OR',
      matchScore: 87
    }
  ];

  const handleFindMatches = () => {
    // TODO: Implement actual AI matching logic
    console.log('Finding matches with preferences:', searchPreferences);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <AutoAwesomeIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          AI-Powered Matching
        </Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Let our AI find the perfect items and services that match your interests and preferences.
      </Typography>

      {/* Preferences Form */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Your Preferences
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Interests & Hobbies"
              value={searchPreferences.interests}
              onChange={(e) => setSearchPreferences({ ...searchPreferences, interests: e.target.value })}
              placeholder="e.g., photography, music, cooking"
              multiline
              rows={3}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Location"
              value={searchPreferences.location}
              onChange={(e) => setSearchPreferences({ ...searchPreferences, location: e.target.value })}
              placeholder="City, State or ZIP"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Max Distance</InputLabel>
              <Select
                value={searchPreferences.maxDistance}
                label="Max Distance"
                onChange={(e) => setSearchPreferences({ ...searchPreferences, maxDistance: e.target.value })}
              >
                <MenuItem value="10">10 miles</MenuItem>
                <MenuItem value="25">25 miles</MenuItem>
                <MenuItem value="50">50 miles</MenuItem>
                <MenuItem value="100">100 miles</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<AutoAwesomeIcon />}
            onClick={handleFindMatches}
          >
            Find Matches
          </Button>
        </Box>
      </Paper>

      {/* Matching Results */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recommended Matches ({mockMatches.length})
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {mockMatches.map((match) => (
          <Grid item xs={12} sm={6} md={4} key={match.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              {/* Match Score Badge */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  backgroundColor: 'primary.main',
                  color: 'white',
                  borderRadius: '50%',
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  zIndex: 1,
                }}
              >
                {match.matchScore}%
              </Box>
              
              <CardMedia
                component="img"
                height="200"
                image={match.image}
                alt={match.title}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h6" component="h2">
                  {match.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {match.description}
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Owner: {match.user}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Location: {match.location}
                  </Typography>
                  <Typography variant="h6" color="primary">
                    ${match.estimatedValue}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="contained" size="small" fullWidth>
                    Make Offer
                  </Button>
                  <Button variant="outlined" size="small">
                    <FavoriteIcon />
                  </Button>
                  <Button variant="outlined" size="small">
                    <ShareIcon />
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default MatchingPage;

