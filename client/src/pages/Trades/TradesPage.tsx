import React, { useState } from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Chip, Button, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { History as HistoryIcon, CheckCircle, Cancel } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import { tradesAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface Trade {
  id: string;
  status: string;
  initiator_item_title?: string;
  responder_item_title?: string;
  initiator_username: string;
  responder_username: string;
  created_at: string;
  initiator_id: string;
  responder_id: string;
}

const TradesPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Fetch trades from database
  const { data: tradesData, isLoading, error } = useQuery(
    ['trades'],
    () => tradesAPI.getTrades(),
    {
      refetchOnWindowFocus: false,
    }
  );

  // Update trade status mutation
  const updateTradeStatusMutation = useMutation(
    (data: { id: string; status: string; cancellationReason?: string }) =>
      tradesAPI.updateTradeStatus(data.id, { 
        status: data.status as any, 
        cancellationReason: data.cancellationReason 
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['trades']);
        toast.success('Trade status updated successfully');
        setShowCancelDialog(false);
        setCancellationReason('');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update trade status');
      },
    }
  );

  const handleAcceptTrade = (trade: Trade) => {
    updateTradeStatusMutation.mutate({ id: trade.id, status: 'accepted' });
  };

  const handleDeclineTrade = (trade: Trade) => {
    setSelectedTrade(trade);
    setShowCancelDialog(true);
  };

  const handleCancelTrade = () => {
    if (selectedTrade && cancellationReason.trim()) {
      updateTradeStatusMutation.mutate({ 
        id: selectedTrade.id, 
        status: 'cancelled',
        cancellationReason: cancellationReason.trim()
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'accepted':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      case 'disputed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'accepted':
        return 'Accepted';
      case 'in_progress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      case 'disputed':
        return 'Disputed';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getPartnerName = (trade: Trade) => {
    if (user?.id === trade.initiator_id) {
      return trade.responder_username;
    }
    return trade.initiator_username;
  };

  const getMyItem = (trade: Trade) => {
    if (user?.id === trade.initiator_id) {
      return trade.initiator_item_title || 'No item specified';
    }
    return trade.responder_item_title || 'No item specified';
  };

  const getTheirItem = (trade: Trade) => {
    if (user?.id === trade.initiator_id) {
      return trade.responder_item_title || 'No item specified';
    }
    return trade.initiator_item_title || 'No item specified';
  };

  const canUpdateStatus = (trade: Trade) => {
    if (trade.status === 'completed' || trade.status === 'cancelled' || trade.status === 'disputed') {
      return false;
    }
    
    if (trade.status === 'pending') {
      // Only responder can accept/decline pending trades
      return user?.id === trade.responder_id;
    }
    
    // Both participants can update accepted/in_progress trades
    return true;
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Failed to load trades. Please try again later.
        </Alert>
      </Container>
    );
  }

  const trades = tradesData?.trades || [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <HistoryIcon sx={{ mr: 2, fontSize: 32 }} />
        <Typography variant="h4" component="h1">
          My Trades
        </Typography>
      </Box>

      {trades.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No trades found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You haven't made any trades yet. Start by browsing items or creating your own listings.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {trades.map((trade: Trade) => (
            <Grid item xs={12} key={trade.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Trade #{trade.id.slice(0, 8)}
                    </Typography>
                    <Chip 
                      label={getStatusLabel(trade.status)} 
                      color={getStatusColor(trade.status) as any}
                      variant="outlined"
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body1" sx={{ flex: 1 }}>
                      {getMyItem(trade)}
                    </Typography>
                    <Typography variant="h6" sx={{ mx: 2 }}>
                      ↔
                    </Typography>
                    <Typography variant="body1" sx={{ flex: 1 }}>
                      {getTheirItem(trade)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Partner: {getPartnerName(trade)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Date: {formatDate(trade.created_at)}
                    </Typography>
                  </Box>
                  
                  {canUpdateStatus(trade) && (
                    <Box sx={{ mt: 2 }}>
                      {trade.status === 'pending' && user?.id === trade.responder_id && (
                        <>
                          <Button 
                            variant="contained" 
                            size="small" 
                            sx={{ mr: 1 }}
                            startIcon={<CheckCircle />}
                            onClick={() => handleAcceptTrade(trade)}
                            disabled={updateTradeStatusMutation.isLoading}
                          >
                            Accept
                          </Button>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            color="error"
                            startIcon={<Cancel />}
                            onClick={() => handleDeclineTrade(trade)}
                            disabled={updateTradeStatusMutation.isLoading}
                          >
                            Decline
                          </Button>
                        </>
                      )}
                      {trade.status === 'accepted' && (
                        <Button 
                          variant="contained" 
                          size="small" 
                          sx={{ mr: 1 }}
                          onClick={() => updateTradeStatusMutation.mutate({ 
                            id: trade.id, 
                            status: 'in_progress' 
                          })}
                          disabled={updateTradeStatusMutation.isLoading}
                        >
                          Mark In Progress
                        </Button>
                      )}
                      {trade.status === 'in_progress' && (
                        <Button 
                          variant="contained" 
                          size="small" 
                          color="success"
                          onClick={() => updateTradeStatusMutation.mutate({ 
                            id: trade.id, 
                            status: 'completed' 
                          })}
                          disabled={updateTradeStatusMutation.isLoading}
                        >
                          Mark Complete
                        </Button>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Cancellation Dialog */}
      <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)}>
        <DialogTitle>Cancel Trade</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for cancellation"
            type="text"
            fullWidth
            variant="outlined"
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            placeholder="Please provide a reason for cancelling this trade"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCancelDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCancelTrade} 
            color="error" 
            variant="contained"
            disabled={!cancellationReason.trim() || updateTradeStatusMutation.isLoading}
          >
            Confirm Cancellation
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TradesPage;

