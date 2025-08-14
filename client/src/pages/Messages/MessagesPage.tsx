import React from 'react';
import { Box, Container, Typography, Paper, List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider } from '@mui/material';
import { Message as MessageIcon } from '@mui/icons-material';

const MessagesPage: React.FC = () => {
  // Mock data for demonstration
  const mockConversations = [
    {
      id: '1',
      user: 'gamer123',
      lastMessage: 'Is the gaming console still available?',
      timestamp: '2 hours ago',
      unread: true,
      avatar: 'https://picsum.photos/40/40?random=7'
    },
    {
      id: '2',
      user: 'craftsman',
      lastMessage: 'I can meet you tomorrow at 3 PM',
      timestamp: '1 day ago',
      unread: false,
      avatar: 'https://picsum.photos/40/40?random=8'
    },
    {
      id: '3',
      user: 'booklover',
      lastMessage: 'Thanks for the trade!',
      timestamp: '3 days ago',
      unread: false,
      avatar: 'https://picsum.photos/40/40?random=9'
    }
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <MessageIcon sx={{ mr: 2, fontSize: 32 }} />
        <Typography variant="h4" component="h1">
          Messages
        </Typography>
      </Box>

      <Paper>
        <List>
          {mockConversations.map((conversation, index) => (
            <React.Fragment key={conversation.id}>
              <ListItem button>
                <ListItemAvatar>
                  <Avatar src={conversation.avatar} />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: conversation.unread ? 'bold' : 'normal' }}
                      >
                        {conversation.user}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {conversation.timestamp}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontWeight: conversation.unread ? 'bold' : 'normal' }}
                    >
                      {conversation.lastMessage}
                    </Typography>
                  }
                />
              </ListItem>
              {index < mockConversations.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Container>
  );
};

export default MessagesPage;

