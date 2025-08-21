import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Autocomplete,
  Box,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { Send as SendIcon, Search as SearchIcon } from '@mui/icons-material';
import { searchAPI } from '../../services/api';

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

interface NewMessageDialogProps {
  open: boolean;
  onClose: () => void;
  onSend: (recipientId: string, content: string) => Promise<void>;
}

const NewMessageDialog: React.FC<NewMessageDialogProps> = ({
  open,
  onClose,
  onSend
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Search users when query changes
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      try {
        const response = await searchAPI.searchUsers({
          q: searchQuery,
          limit: 10
        });
        setSearchResults(response.users || []);
      } catch (error) {
        console.error('Error searching users:', error);
        setError('Failed to search users');
      } finally {
        setSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSend = async () => {
    if (!selectedUser || !messageContent.trim()) {
      setError('Please select a user and enter a message');
      return;
    }

    setSending(true);
    setError('');

    try {
      await onSend(selectedUser.id, messageContent.trim());
      // Reset form and close dialog
      setSelectedUser(null);
      setMessageContent('');
      setSearchQuery('');
      onClose();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      setSelectedUser(null);
      setMessageContent('');
      setSearchQuery('');
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>New Message</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Search for a user to send a message to:
          </Typography>
          <Autocomplete
            options={searchResults}
            getOptionLabel={(option) => `${option.username} (${option.firstName} ${option.lastName})`}
            value={selectedUser}
            onChange={(_, newValue) => setSelectedUser(newValue)}
            onInputChange={(_, newInputValue) => setSearchQuery(newInputValue)}
            loading={searching}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search users..."
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {searching ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {option.avatarUrl && (
                    <img
                      src={option.avatarUrl}
                      alt={option.username}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        marginRight: 12
                      }}
                    />
                  )}
                  <Box>
                    <Typography variant="body1">{option.username}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.firstName} {option.lastName}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Type your message..."
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            disabled={!selectedUser}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={sending}>
          Cancel
        </Button>
        <Button
          onClick={handleSend}
          variant="contained"
          disabled={!selectedUser || !messageContent.trim() || sending}
          startIcon={sending ? <CircularProgress size={20} /> : <SendIcon />}
        >
          {sending ? 'Sending...' : 'Send Message'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewMessageDialog;
