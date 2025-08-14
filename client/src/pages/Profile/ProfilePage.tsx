import React from 'react';
import { Box, Container, Typography, Paper, Avatar, Button, Grid, Divider } from '@mui/material';
import { Edit as EditIcon, Settings as SettingsIcon } from '@mui/icons-material';

const ProfilePage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Profile
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              src="https://picsum.photos/120/120?random=10"
              sx={{ width: 120, height: 120, mb: 2 }}
            />
            <Typography variant="h6" gutterBottom>
              John Doe
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              @johndoe
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              New York, NY
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" startIcon={<EditIcon />} sx={{ mr: 1 }}>
                Edit Profile
              </Button>
              <Button variant="outlined" startIcon={<SettingsIcon />}>
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
                <Typography variant="body1">John</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Last Name
                </Typography>
                <Typography variant="body1">Doe</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">john.doe@example.com</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Bio
                </Typography>
                <Typography variant="body1">
                  Passionate about sustainable living and community building through bartering.
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProfilePage;

