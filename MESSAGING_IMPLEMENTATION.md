# Messaging System Implementation

This document describes the implementation of the messaging system for SwapCircle.

## Features Implemented

### 1. Real-time Messaging
- Connect to actual database instead of mock data
- Users can send and receive messages
- Messages are stored in the database with read/unread status

### 2. New Message Creation
- Users can create new messages to any user
- Search functionality to find users by username, name, or bio
- Automatic trade creation for direct messaging

### 3. User Search
- Search users by typing in the search box
- Debounced search with 300ms delay
- Display user avatars, names, and usernames

### 4. Message Response
- Users can respond to received messages
- Real-time conversation view
- Auto-scroll to latest messages

### 5. Read/Unread Status
- Unread messages show gray indicators
- Read messages show green indicators
- Unread count badges on conversation list
- Visual indicators for message status

## Database Schema

### Messages Table
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  is_system_message BOOLEAN DEFAULT FALSE,
  message_type VARCHAR DEFAULT 'text',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Trades Table (Updated)
Added `trade_type` column to support direct messaging:
```sql
ALTER TABLE trades ADD COLUMN trade_type ENUM('item_trade', 'direct_message', 'swap_credits') DEFAULT 'item_trade' NOT NULL;
```

## API Endpoints

### Messages
- `GET /api/messages/conversations` - Get user's conversations
- `GET /api/messages/trade/:tradeId` - Get messages for a specific trade
- `POST /api/messages` - Send a new message
- `PATCH /api/messages/read` - Mark messages as read
- `GET /api/messages/unread/count` - Get unread message count

### Search
- `GET /api/search/users` - Search for users

## Components

### 1. MessagesPage
Main messaging interface that shows:
- List of conversations
- Unread message indicators
- Trade status chips
- New message button

### 2. NewMessageDialog
Dialog for composing new messages:
- User search with autocomplete
- Message composition
- Error handling

### 3. ConversationView
Full conversation interface:
- Message history
- Real-time message sending
- Read/unread status indicators
- User information header

## Setup Instructions

### 1. Database Migration
Run the new migration to add the trade_type column:
```bash
cd server
npx knex migrate:latest
```

### 2. Dependencies
Ensure these packages are installed:
```bash
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
```

### 3. Environment Variables
Make sure your database connection is properly configured in `server/config/database.js`.

## Usage

### Sending a New Message
1. Click "New Message" button
2. Search for a user by typing their name or username
3. Select the user from the dropdown
4. Type your message
5. Click "Send Message"

### Viewing Conversations
1. Click on any conversation in the list
2. View the full conversation history
3. Send replies using the input field at the bottom
4. Click the back arrow to return to conversations list

### Message Status
- **Gray dot**: Message sent but not read
- **Green dot**: Message has been read
- **Blue circle**: Unread received message
- **Badge number**: Count of unread messages

## Error Handling

The system includes comprehensive error handling for:
- Database connection issues
- Invalid user searches
- Message sending failures
- Authentication errors
- Network timeouts

## Future Enhancements

Potential improvements for the messaging system:
1. Real-time notifications using WebSockets
2. Message encryption
3. File/image attachments
4. Message reactions
5. Typing indicators
6. Message search within conversations
7. Message deletion/editing
8. Block user functionality

## Troubleshooting

### Common Issues

1. **Messages not loading**: Check database connection and ensure migrations are run
2. **User search not working**: Verify search API endpoint is accessible
3. **Messages not sending**: Check authentication token and database permissions
4. **Read status not updating**: Ensure message recipient matches current user

### Debug Mode
Enable console logging by checking browser developer tools for any error messages or failed API calls.
