import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Container, Typography, Paper, Grid, Chip, Button, Divider, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { ArrowBack, Message as MessageIcon, CheckCircle, Cancel, PlayArrow, Done } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import { tradesAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface TradeItem {
  id: string;
  title: string;
  description: string;
  images: string[];
  condition: string;
  estimated_value?: number;
  user: string;
}

interface Trade {
  id: string;
  status: string;
  initiator_id: string;
  responder_id: string;
  initiator_username: string;
  responder_username: string;
  initiator_first_name: string;
  initiator_last_name: string;
  responder_first_name: string;
  responder_last_name: string;
  initiator_item_title?: string;
  initiator_item_description?: string;
  initiator_item_images?: string[];
  initiator_item_condition?: string;
  responder_item_title?: string;
  responder_item_description?: string;
  responder_item_images?: string[];
  responder_item_condition?: string;
  created_at: string;
  accepted_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  initiator_message?: string;
  responder_message?: string;
  swap_credits: number;
}

const TradeDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  // Fetch trade details from database
  const { data: tradeData, isLoading, error } = useQuery(
    ['trade', id],
    () => tradesAPI.getTrade(id!),
    {
      enabled: !!id,
      refetchOnWindowFocus: false,
    }
  );

  // Update trade status mutation
  const updateTradeStatusMutation = useMutation(
    (data: { status: 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'disputed'; cancellationReason?: string }) =>
      tradesAPI.updateTradeStatus(id!, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['trade', id]);
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

  const handleAcceptTrade = () => {
    updateTradeStatusMutation.mutate({ status: 'accepted' });
  };

  const handleDeclineTrade = () => {
    setShowCancelDialog(true);
  };

  const handleCancelTrade = () => {
    if (cancellationReason.trim()) {
      updateTradeStatusMutation.mutate({ 
        status: 'cancelled',
        cancellationReason: cancellationReason.trim()
      });
    }
  };

  const handleMarkInProgress = () => {
    updateTradeStatusMutation.mutate({ status: 'in_progress' });
  };

  const handleMarkComplete = () => {
    updateTradeStatusMutation.mutate({ status: 'completed' });
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPartnerName = (trade: Trade) => {
    if (user?.id === trade.initiator_id) {
      return `${trade.responder_first_name} ${trade.responder_last_name}`;
    }
    return `${trade.initiator_first_name} ${trade.initiator_last_name}`;
  };

  const getMyItem = (trade: Trade) => {
    if (user?.id === trade.initiator_id) {
      return {
        title: trade.initiator_item_title || 'No item specified',
        description: trade.initiator_item_description || 'No description available',
        images: trade.initiator_item_images || [],
        condition: trade.initiator_item_condition || 'Unknown'
      };
    }
    return {
      title: trade.responder_item_title || 'No item specified',
      description: trade.responder_item_description || 'No description available',
      images: trade.responder_item_images || [],
      condition: trade.responder_item_condition || 'Unknown'
    };
  };

  const getTheirItem = (trade: Trade) => {
    if (user?.id === trade.initiator_id) {
      return {
        title: trade.responder_item_title || 'No item specified',
        description: trade.responder_item_description || 'No description available',
        images: trade.responder_item_images || [],
        condition: trade.responder_item_condition || 'Unknown'
      };
    }
    return {
      title: trade.initiator_item_title || 'No item specified',
      description: trade.initiator_item_description || 'No description available',
      images: trade.initiator_item_images || [],
      condition: trade.initiator_item_condition || 'Unknown'
    };
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

  if (error || !tradeData?.trade) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Failed to load trade details. Please try again later.
        </Alert>
      </Container>
    );
  }

  const trade: Trade = tradeData.trade;
  const myItem = getMyItem(trade);
  const theirItem = getTheirItem(trade);

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
          Trade #{trade.id.slice(0, 8)}
        </Typography>
        <Chip 
          label={getStatusLabel(trade.status)} 
          color={getStatusColor(trade.status) as any}
          variant="outlined"
        />
      </Box>

      {/* Trade Status Actions */}
      {canUpdateStatus(trade) && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Trade Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {trade.status === 'pending' && user?.id === trade.responder_id && (
              <>
                <Button 
                  variant="contained" 
                  color="success"
                  startIcon={<CheckCircle />}
                  onClick={handleAcceptTrade}
                  disabled={updateTradeStatusMutation.isLoading}
                >
                  Accept Trade
                </Button>
                <Button 
                  variant="outlined" 
                  color="error"
                  startIcon={<Cancel />}
                  onClick={handleDeclineTrade}
                  disabled={updateTradeStatusMutation.isLoading}
                >
                  Decline Trade
                </Button>
              </>
            )}
            {trade.status === 'accepted' && (
              <Button 
                variant="contained" 
                color="info"
                startIcon={<PlayArrow />}
                onClick={handleMarkInProgress}
                disabled={updateTradeStatusMutation.isLoading}
              >
                Mark In Progress
              </Button>
            )}
            {trade.status === 'in_progress' && (
              <Button 
                variant="contained" 
                color="success"
                startIcon={<Done />}
                onClick={handleMarkComplete}
                disabled={updateTradeStatusMutation.isLoading}
              >
                Mark Complete
              </Button>
            )}
          </Box>
        </Paper>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Your Item
            </Typography>
            {myItem.images && myItem.images.length > 0 ? (
              <img
                src={myItem.images[0]}
                alt={myItem.title}
                style={{ width: '100%', borderRadius: '8px', marginBottom: '16px' }}
              />
            ) : (
              <Box 
                sx={{ 
                  width: '100%', 
                  height: 200, 
                  bgcolor: 'grey.200', 
                  borderRadius: '8px', 
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography color="text.secondary">No image available</Typography>
              </Box>
            )}
            <Typography variant="h6" gutterBottom>
              {myItem.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {myItem.description}
            </Typography>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Condition: {myItem.condition}
            </Typography>
            {trade.swap_credits > 0 && (
              <Typography variant="subtitle2" color="primary">
                Swap Credits: {trade.swap_credits}
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Their Item
            </Typography>
            {theirItem.images && theirItem.images.length > 0 ? (
              <img
                src={theirItem.images[0]}
                alt={theirItem.title}
                style={{ width: '100%', borderRadius: '8px', marginBottom: '16px' }}
              />
            ) : (
              <Box 
                sx={{ 
                  width: '100%', 
                  height: 200, 
                  bgcolor: 'grey.200', 
                  borderRadius: '8px', 
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography color="text.secondary">No image available</Typography>
              </Box>
            )}
            <Typography variant="h6" gutterBottom>
              {theirItem.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {theirItem.description}
            </Typography>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Condition: {theirItem.condition}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Trade Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Partner
                </Typography>
                <Typography variant="body1">
                  {getPartnerName(trade)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body1">
                  {formatDate(trade.created_at)}
                </Typography>
              </Grid>
              {trade.accepted_at && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Accepted
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(trade.accepted_at)}
                  </Typography>
                </Grid>
              )}
              {trade.completed_at && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Completed
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(trade.completed_at)}
                  </Typography>
                </Grid>
              )}
            </Grid>

            {/* Messages */}
            {(trade.initiator_message || trade.responder_message) && (
              <>
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Messages
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {trade.initiator_message && (
                  <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2" color="primary">
                        {trade.initiator_username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(trade.created_at)}
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      {trade.initiator_message}
                    </Typography>
                  </Box>
                )}
                
                {trade.responder_message && (
                  <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2" color="primary">
                        {trade.responder_username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {trade.accepted_at ? formatDate(trade.accepted_at) : 'Recently'}
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      {trade.responder_message}
                    </Typography>
                  </Box>
                )}
              </>
            )}
            
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" startIcon={<MessageIcon />}>
                Send Message
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

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

export default TradeDetailPage;

