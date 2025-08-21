import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Chip
} from '@mui/material';
import { Send as SendIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { messagesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
  is_read: boolean;
  sender_username: string;
  sender_first_name: string;
  sender_last_name: string;
  sender_avatar?: string;
}

interface ConversationViewProps {
  tradeId: string;
  otherUser: {
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  onBack: () => void;
}

const ConversationView: React.FC<ConversationViewProps> = ({
  tradeId,
  otherUser,
  onBack
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages
  useEffect(() => {
    loadMessages();
  }, [tradeId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await messagesAPI.getMessages(tradeId);
      setMessages(response.messages || []);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setSending(true);
    try {
      const response = await messagesAPI.sendMessage({
        tradeId,
        content: newMessage.trim()
      });

      // Add new message to the list
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={onBack} size="small">
            <ArrowBackIcon />
          </IconButton>
          <Avatar src={otherUser.avatarUrl} sx={{ width: 40, height: 40 }}>
            {otherUser.firstName?.[0]}{otherUser.lastName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="h6">
              {otherUser.firstName} {otherUser.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              @{otherUser.username}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Divider />

      {/* Messages */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {messages.map((message) => {
          const isFromMe = message.sender_id === user?.id;
          const isRead = message.is_read;

          return (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: isFromMe ? 'flex-end' : 'flex-start',
                mb: 1
              }}
            >
              <Box
                sx={{
                  maxWidth: '70%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isFromMe ? 'flex-end' : 'flex-start'
                }}
              >
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: isFromMe ? 'primary.main' : 'grey.100',
                    color: isFromMe ? 'white' : 'text.primary',
                    borderRadius: 2,
                    position: 'relative'
                  }}
                >
                  <Typography variant="body1">{message.content}</Typography>
                  
                  {/* Read status indicator */}
                  {isFromMe && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        {formatTimestamp(message.created_at)}
                      </Typography>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: isRead ? 'success.main' : 'grey.400'
                        }}
                      />
                    </Box>
                  )}
                </Paper>
                
                {!isFromMe && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    {formatTimestamp(message.created_at)}
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
        
        <div ref={messagesEndRef} />
      </Box>

      <Divider />

      {/* Message input */}
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            multiline
            maxRows={4}
            disabled={sending}
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            sx={{ minWidth: 56 }}
          >
            {sending ? <CircularProgress size={20} /> : <SendIcon />}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ConversationView;
