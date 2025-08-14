import React, { useState } from 'react';
import { Box, Container, Typography, TextField, Button, Grid, Card, CardContent, CardMedia, Chip, FormControl, InputLabel, Select, MenuItem, Paper } from '@mui/material';
import { Search as SearchIcon, FilterList as FilterIcon } from '@mui/icons-material';

const SearchPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [itemType, setItemType] = useState('all');

  // Mock search results
  const mockResults = [
    {
      id: '1',
      title: 'Vintage Gaming Console',
      description: 'Classic gaming console in excellent condition. Perfect for retro gaming enthusiasts.',
      image: 'https://picsum.photos/300/200?random=5',
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
      image: 'https://picsum.photos/300/200?random=6',
      condition: 'Good',
      estimatedValue: 80,
      category: 'Home & Garden',
      user: 'craftsman',
      location: 'Portland, OR'
    }
  ];

  const handleSearch = () => {
    // TODO: Implement actual search logic
    console.log('Searching for:', { searchTerm, category, itemType });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Search Items
      </Typography>

      {/* Search Form */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="e.g., vintage camera, guitar lessons"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                onChange={(e) => setCategory(e.target.value)}
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="electronics">Electronics</MenuItem>
                <MenuItem value="books">Books</MenuItem>
                <MenuItem value="clothing">Clothing</MenuItem>
                <MenuItem value="education">Education</MenuItem>
                <MenuItem value="services">Services</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Item Type</InputLabel>
              <Select
                value={itemType}
                label="Item Type"
                onChange={(e) => setItemType(e.target.value)}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="good">Goods</MenuItem>
                <MenuItem value="service">Services</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<SearchIcon />}
              onClick={handleSearch}
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Search Results */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Search Results ({mockResults.length})
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {mockResults.map((item) => (
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
                
                <Box sx={{ mb: 2 }}>
                  <Chip label={item.condition} color="primary" size="small" sx={{ mr: 1 }} />
                  <Chip label={item.category} variant="outlined" size="small" sx={{ mr: 1 }} />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" color="primary">
                    ${item.estimatedValue}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.location}
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

export default SearchPage;

