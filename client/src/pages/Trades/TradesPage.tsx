import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Chip, Button } from '@mui/material';
import { History as HistoryIcon } from '@mui/icons-material';

const TradesPage: React.FC = () => {
  // Mock data for now
  const mockTrades = [
    {
      id: 1,
      status: 'completed',
      item1: 'Vintage Camera',
      item2: 'Guitar Lessons',
      date: '2024-01-15',
      partner: 'Jane Smith',
    },
    {
      id: 2,
      status: 'pending',
      item1: 'Book Collection',
      item2: 'Handmade Jewelry',
      date: '2024-01-20',
      partner: 'Mike Johnson',
    },
  ];

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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <HistoryIcon sx={{ mr: 2, fontSize: 32 }} />
        <Typography variant="h4" component="h1">
          My Trades
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {mockTrades.map((trade) => (
          <Grid item xs={12} key={trade.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Trade #{trade.id}
                  </Typography>
                  <Chip 
                    label={trade.status} 
                    color={getStatusColor(trade.status) as any}
                    variant="outlined"
                  />
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body1" sx={{ flex: 1 }}>
                    {trade.item1}
                  </Typography>
                  <Typography variant="h6" sx={{ mx: 2 }}>
                    ↔
                  </Typography>
                  <Typography variant="body1" sx={{ flex: 1 }}>
                    {trade.item2}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Partner: {trade.partner}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Date: {trade.date}
                  </Typography>
                </Box>
                
                {trade.status === 'pending' && (
                  <Box sx={{ mt: 2 }}>
                    <Button variant="contained" size="small" sx={{ mr: 1 }}>
                      Accept
                    </Button>
                    <Button variant="outlined" size="small" color="error">
                      Decline
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default TradesPage;

