# Trades Implementation

This document describes the implementation of the trade functionality in SwapCircle, which allows users to exchange goods and services directly from the database.

## Features Implemented

### 1. Database Integration
- **TradesPage.tsx**: Displays all user trades with real-time data from the database
- **TradeDetailPage.tsx**: Shows detailed trade information and allows status updates
- **Real-time updates**: All changes are immediately reflected in the database and UI

### 2. Trade Status Management
- **Pending**: Initial state when a trade is initiated
- **Accepted**: When the responder accepts the trade
- **In Progress**: When both parties are actively exchanging
- **Completed**: When the trade is successfully finished
- **Cancelled**: When either party cancels the trade
- **Disputed**: When there's a disagreement (future feature)

### 3. User Actions
- **Accept Trade**: Responders can accept pending trades
- **Decline Trade**: Responders can decline with a reason
- **Mark In Progress**: Both parties can mark accepted trades as in progress
- **Mark Complete**: Both parties can mark in-progress trades as completed
- **Cancel Trade**: Either party can cancel with a reason

### 4. Database Schema
The trades table includes:
- Trade participants (initiator and responder)
- Item references (optional)
- Status tracking
- Timestamps for all status changes
- Messages between parties
- Swap credits for value-based trades
- Cancellation reasons

## API Endpoints

### GET /api/trades
- Fetches all trades for the authenticated user
- Supports filtering by status
- Includes pagination
- Returns trade details with user and item information

### GET /api/trades/:id
- Fetches detailed information for a specific trade
- Includes all trade metadata and messages
- Validates user access (only trade participants can view)

### PATCH /api/trades/:id/status
- Updates trade status
- Validates status transitions
- Updates item availability automatically
- Records timestamps for status changes

### POST /api/trades
- Initiates new trades
- Validates user and item availability
- Prevents duplicate pending trades

## Frontend Components

### TradesPage.tsx
- Lists all user trades with status indicators
- Shows trade items and partner information
- Provides action buttons based on trade status
- Includes cancellation dialog with reason input
- Real-time status updates

### TradeDetailPage.tsx
- Detailed view of individual trades
- Shows both items with images and descriptions
- Displays trade timeline and messages
- Action buttons for status updates
- Responsive design for mobile and desktop

## Usage Examples

### Viewing Trades
1. Navigate to `/trades` to see all your trades
2. Click on any trade to view details
3. Use status filters to find specific trades

### Accepting a Trade
1. Find a pending trade in your list
2. Click "Accept" button
3. Trade status automatically updates to "Accepted"
4. Items become unavailable for other trades

### Cancelling a Trade
1. Click "Decline" or "Cancel" button
2. Enter a reason for cancellation
3. Confirm the cancellation
4. Trade status updates and items become available again

## Technical Implementation

### State Management
- Uses React Query for server state management
- Automatic cache invalidation on updates
- Optimistic updates for better UX

### Error Handling
- Comprehensive error messages
- Toast notifications for user feedback
- Graceful fallbacks for missing data

### Security
- JWT authentication required for all endpoints
- User can only access their own trades
- Status update validation prevents unauthorized changes

### Performance
- Efficient database queries with proper indexing
- Pagination for large trade lists
- Optimized re-renders with React Query

## Future Enhancements

1. **Real-time messaging**: WebSocket integration for instant communication
2. **Trade disputes**: Resolution system for problematic trades
3. **Rating system**: User feedback after completed trades
4. **Trade history**: Detailed logs of all status changes
5. **Notifications**: Email/SMS alerts for trade updates
6. **Mobile app**: Native mobile application support

## Database Migrations

Run the following command to set up the trades table:
```bash
npm run db:migrate
```

## Testing

To test the trade functionality:
1. Start the server: `npm run server:dev`
2. Start the client: `npm run client:dev`
3. Create test users and items
4. Initiate trades between users
5. Test status updates and cancellations

## Troubleshooting

### Common Issues
1. **Trade not loading**: Check authentication token
2. **Status update failed**: Verify user permissions
3. **Items not showing**: Ensure items exist and are available
4. **Database errors**: Check migration status and database connection

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in your environment variables.
