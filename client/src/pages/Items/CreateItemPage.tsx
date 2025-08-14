import React from 'react';
import { Box, Container, Typography, Paper, TextField, Button, Grid, MenuItem, FormControl, InputLabel, Select } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

const CreateItemPage: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Create New Item
      </Typography>
      
      <Paper sx={{ p: 4 }}>
        <Box component="form">
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Item Title"
                placeholder="e.g., Vintage Camera, Guitar Lessons"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={4}
                label="Description"
                placeholder="Describe your item or service..."
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Item Type</InputLabel>
                <Select label="Item Type" defaultValue="good">
                  <MenuItem value="good">Good</MenuItem>
                  <MenuItem value="service">Service</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Condition</InputLabel>
                <Select label="Condition" defaultValue="good">
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
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                placeholder="City, State"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags"
                placeholder="vintage, camera, photography (comma separated)"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={<SaveIcon />}
                fullWidth
              >
                Create Item
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateItemPage;

