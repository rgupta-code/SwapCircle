import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Divider,
  Button,
  Fab,
  Badge,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Message as MessageIcon, 
  Add as AddIcon,
  Circle as CircleIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { messagesAPI } from '../../services/api';
import NewMessageDialog from '../../components/Messages/NewMessageDialog';
import ConversationView from '../../components/Messages/ConversationView';

interface Conversation {
  tradeId: string;
  status: string;
  tradeType: string;
  otherUser: {
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    isFromMe: boolean;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMessageDialogOpen, setNewMessageDialogOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await messagesAPI.getConversations();
      setConversations(response.conversations || []);
    } catch (error: any) {
      console.error('Error loading conversations:', error);
      setError(error.response?.data?.error || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = async (recipientId: string, content: string) => {
    try {
      // For new messages, we need to create a trade first
      // This is a simplified approach - in a real app, you might want to handle this differently
      const response = await messagesAPI.sendMessage({
        tradeId: 'new', // This will need to be handled on the backend
        recipientId,
        content
      });
      
      // Refresh conversations after sending
      await loadConversations();
    } catch (error: any) {
      throw error; // Let the dialog handle the error
    }
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleBackToConversations = () => {
    setSelectedConversation(null);
    // Refresh conversations to get updated unread counts
    loadConversations();
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getStatusColor = (status: string, tradeType: string) => {
    // For direct messages, show a different status
    if (tradeType === 'direct_message') {
      return 'info';
    }
    
    switch (status) {
      case 'pending':
        return 'warning';
      case 'accepted':
        return 'info';
      case 'in_progress':
        return 'primary';
      case 'completed':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string, tradeType: string) => {
    if (tradeType === 'direct_message') {
      return 'Direct Message';
    }
    
    return status.replace('_', ' ');
  };

  // If a conversation is selected, show the conversation view
  if (selectedConversation) {
    return (
      <ConversationView
        tradeId={selectedConversation.tradeId}
        otherUser={selectedConversation.otherUser}
        onBack={handleBackToConversations}
      />
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <MessageIcon sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h4" component="h1">
            Messages
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setNewMessageDialogOpen(true)}
        >
          New Message
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Conversations List */}
      <Paper sx={{ flex: 1, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : conversations.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <MessageIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No conversations yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Start a conversation by sending a message to another user
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setNewMessageDialogOpen(true)}
              sx={{ mt: 2 }}
            >
              Send First Message
            </Button>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {conversations.map((conversation, index) => (
              <React.Fragment key={conversation.tradeId}>
                <ListItem 
                  button 
                  onClick={() => handleConversationSelect(conversation)}
                  sx={{ 
                    py: 2,
                    backgroundColor: conversation.unreadCount > 0 ? 'action.hover' : 'transparent'
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      badgeContent={conversation.unreadCount}
                      color="primary"
                      invisible={conversation.unreadCount === 0}
                    >
                      <Avatar src={conversation.otherUser.avatarUrl}>
                        {conversation.otherUser.firstName?.[0]}{conversation.otherUser.lastName?.[0]}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography
                          variant="subtitle1"
                          sx={{ 
                            fontWeight: conversation.unreadCount > 0 ? 'bold' : 'normal',
                            color: conversation.unreadCount > 0 ? 'text.primary' : 'text.primary'
                          }}
                        >
                          {conversation.otherUser.firstName} {conversation.otherUser.lastName}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={getStatusLabel(conversation.status, conversation.tradeType)}
                            size="small"
                            color={getStatusColor(conversation.status, conversation.tradeType) as any}
                            variant="outlined"
                          />
                          <Typography variant="caption" color="text.secondary">
                            {conversation.lastMessage 
                              ? formatTimestamp(conversation.lastMessage.createdAt)
                              : formatTimestamp(conversation.updatedAt)
                            }
                          </Typography>
                        </Box>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ 
                            fontWeight: conversation.unreadCount > 0 ? 'bold' : 'normal',
                            fontStyle: conversation.lastMessage ? 'normal' : 'italic'
                          }}
                        >
                          {conversation.lastMessage 
                            ? (conversation.lastMessage.isFromMe ? 'You: ' : '') + conversation.lastMessage.content
                            : 'No messages yet'
                          }
                        </Typography>
                        
                        {/* Read/Unread indicator */}
                        {conversation.lastMessage && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {conversation.lastMessage.isFromMe ? (
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  backgroundColor: conversation.unreadCount > 0 ? 'grey.400' : 'success.main'
                                }}
                              />
                            ) : conversation.unreadCount > 0 ? (
                              <CircleIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                            ) : null}
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                {index < conversations.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* New Message Dialog */}
      <NewMessageDialog
        open={newMessageDialogOpen}
        onClose={() => setNewMessageDialogOpen(false)}
        onSend={handleNewMessage}
      />
    </Container>
  );
};

export default MessagesPage;

