import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, Container, Typography, Paper, Grid, Chip, Button, Divider } from '@mui/material';
import { ArrowBack, Message as MessageIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const TradeDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock trade data
  const mockTrade = {
    id: '1',
    status: 'pending',
    items: [
      {
        id: '1',
        title: 'Vintage Gaming Console',
        description: 'Classic gaming console in excellent condition.',
        image: 'https://picsum.photos/300/200?random=13',
        condition: 'Like New',
        estimatedValue: 150,
        user: 'gamer123'
      },
      {
        id: '2',
        title: 'Handmade Wooden Shelf',
        description: 'Beautiful handcrafted wooden shelf unit.',
        image: 'https://picsum.photos/300/200?random=14',
        condition: 'Good',
        estimatedValue: 80,
        user: 'craftsman'
      }
    ],
    createdAt: '2024-01-15T10:00:00Z',
    lastUpdated: '2024-01-16T14:30:00Z'
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        Back to Trades
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Trade #{mockTrade.id}
        </Typography>
        <Chip 
          label={mockTrade.status} 
          color={getStatusColor(mockTrade.status) as any}
          variant="outlined"
        />
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Your Item
            </Typography>
            <img
              src={mockTrade.items[0].image}
              alt={mockTrade.items[0].title}
              style={{ width: '100%', borderRadius: '8px', marginBottom: '16px' }}
            />
            <Typography variant="h6" gutterBottom>
              {mockTrade.items[0].title}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {mockTrade.items[0].description}
            </Typography>
            <Typography variant="subtitle2" color="primary">
              Estimated Value: ${mockTrade.items[0].estimatedValue}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Their Item
            </Typography>
            <img
              src={mockTrade.items[1].image}
              alt={mockTrade.items[1].title}
              style={{ width: '100%', borderRadius: '8px', marginBottom: '16px' }}
            />
            <Typography variant="h6" gutterBottom>
              {mockTrade.items[1].title}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {mockTrade.items[1].description}
            </Typography>
            <Typography variant="subtitle2" color="primary">
              Estimated Value: ${mockTrade.items[1].estimatedValue}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Messages
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {/* Mock messages */}
            <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" color="primary">
                  User123
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  2024-01-20 10:30
                </Typography>
              </Box>
              <Typography variant="body2">
                Hi! I'm interested in your guitar lessons.
              </Typography>
            </Box>
            <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" color="primary">
                  User456
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  2024-01-20 11:15
                </Typography>
              </Box>
              <Typography variant="body2">
                Great! I love your camera. When can we meet?
              </Typography>
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" startIcon={<MessageIcon />}>
                Send Message
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TradeDetailPage;

