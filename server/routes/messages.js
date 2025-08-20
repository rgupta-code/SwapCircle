const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { db } = require('../config/database');

const router = express.Router();

// Validation middleware
const validateMessage = [
  body('content').trim().isLength({ min: 1, max: 1000 }),
  body('attachments').optional().isArray(),
];

// Get messages for a trade
router.get('/trade/:tradeId', authenticateToken, async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check if user is part of this trade
    const trade = await db('trades')
      .select('initiator_id', 'responder_id')
      .where('id', tradeId)
      .first();

    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    if (trade.initiator_id !== req.user.id && trade.responder_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get messages
    let query = db('messages')
      .select(
        'messages.*',
        'sender.username as sender_username',
        'sender.first_name as sender_first_name',
        'sender.last_name as sender_last_name',
        'sender.avatar_url as sender_avatar'
      )
      .join('users as sender', 'messages.sender_id', 'sender.id')
      .where('messages.trade_id', tradeId)
      .orderBy('messages.created_at', 'asc');

    // Get total count for pagination
    const countQuery = db('messages')
      .join('users as sender', 'messages.sender_id', 'sender.id')
      .where('messages.trade_id', tradeId);
    
    const totalCount = await countQuery.count('messages.id as total').first();

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.offset(offset).limit(limit);

    const messages = await query;

    // Mark messages as read if recipient is current user
    const unreadMessages = messages.filter(msg => 
      msg.recipient_id === req.user.id && !msg.is_read
    );

    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(msg => msg.id);
      await db('messages')
        .whereIn('id', messageIds)
        .update({
          is_read: true,
          read_at: db.fn.now()
        });
    }

    res.json({
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount.total,
        pages: Math.ceil(totalCount.total / limit)
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message
router.post('/', authenticateToken, validateMessage, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tradeId, recipientId, content, attachments } = req.body;

    // Check if trade exists and user is part of it
    const trade = await db('trades')
      .select('initiator_id', 'responder_id', 'status')
      .where('id', tradeId)
      .first();

    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    if (trade.initiator_id !== req.user.id && trade.responder_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if trade is still active
    if (['completed', 'cancelled', 'disputed'].includes(trade.status)) {
      return res.status(400).json({ error: 'Cannot send messages to inactive trades' });
    }

    // Determine recipient ID if not provided
    let finalRecipientId = recipientId;
    if (!finalRecipientId) {
      finalRecipientId = trade.initiator_id === req.user.id 
        ? trade.responder_id 
        : trade.initiator_id;
    }

    // Verify recipient is part of the trade
    if (finalRecipientId !== trade.initiator_id && finalRecipientId !== trade.responder_id) {
      return res.status(400).json({ error: 'Invalid recipient' });
    }

    // Create message
    const [messageId] = await db('messages').insert({
      trade_id: tradeId,
      sender_id: req.user.id,
      recipient_id: finalRecipientId,
      content,
      attachments: attachments || [],
      message_type: 'text'
    }).returning('id');

    // Get created message with sender info
    const message = await db('messages')
      .select(
        'messages.*',
        'sender.username as sender_username',
        'sender.first_name as sender_first_name',
        'sender.last_name as sender_last_name',
        'sender.avatar_url as sender_avatar'
      )
      .join('users as sender', 'messages.sender_id', 'sender.id')
      .where('messages.id', messageId)
      .first();

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark messages as read
router.patch('/read', authenticateToken, async (req, res) => {
  try {
    const { messageIds } = req.body;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ error: 'Message IDs array required' });
    }

    // Verify user owns these messages or is the recipient
    const messages = await db('messages')
      .select('id', 'recipient_id')
      .whereIn('id', messageIds);

    const validMessageIds = messages
      .filter(msg => msg.recipient_id === req.user.id)
      .map(msg => msg.id);

    if (validMessageIds.length === 0) {
      return res.status(400).json({ error: 'No valid messages to mark as read' });
    }

    // Mark messages as read
    await db('messages')
      .whereIn('id', validMessageIds)
      .update({
        is_read: true,
        read_at: db.fn.now()
      });

    res.json({
      message: 'Messages marked as read',
      updatedCount: validMessageIds.length
    });
  } catch (error) {
    console.error('Mark messages read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Get unread message count
router.get('/unread/count', authenticateToken, async (req, res) => {
  try {
    const count = await db('messages')
      .count('* as total')
      .where('recipient_id', req.user.id)
      .where('is_read', false)
      .first();

    res.json({
      unreadCount: parseInt(count.total)
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Get recent conversations
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get trades where user is involved
    const trades = await db('trades')
      .select(
        'trades.id',
        'trades.status',
        'trades.created_at',
        'initiator.username as initiator_username',
        'initiator.first_name as initiator_first_name',
        'initiator.last_name as initiator_last_name',
        'initiator.avatar_url as initiator_avatar',
        'responder.username as responder_username',
        'responder.first_name as responder_first_name',
        'responder.last_name as responder_last_name',
        'responder.avatar_url as responder_avatar'
      )
      .join('users as initiator', 'trades.initiator_id', 'initiator.id')
      .join('users as responder', 'trades.responder_id', 'responder.id')
      .where(function() {
        this.where('trades.initiator_id', req.user.id)
          .orWhere('trades.responder_id', req.user.id);
      })
      .whereNotIn('trades.status', ['completed', 'cancelled'])
      .orderBy('trades.updated_at', 'desc')
      .limit(parseInt(limit));

    // Get last message and unread count for each trade
    const conversations = [];
    for (const trade of trades) {
      const lastMessage = await db('messages')
        .select('content', 'created_at', 'sender_id')
        .where('trade_id', trade.id)
        .orderBy('created_at', 'desc')
        .first();

      const unreadCount = await db('messages')
        .count('* as total')
        .where('trade_id', trade.id)
        .where('recipient_id', req.user.id)
        .where('is_read', false)
        .first();

      // Determine other user in conversation
      const isInitiator = trade.initiator_id === req.user.id;
      const otherUser = isInitiator 
        ? {
            username: trade.responder_username,
            firstName: trade.responder_first_name,
            lastName: trade.responder_last_name,
            avatarUrl: trade.responder_avatar
          }
        : {
            username: trade.initiator_username,
            firstName: trade.initiator_first_name,
            lastName: trade.initiator_last_name,
            avatarUrl: trade.initiator_avatar
          };

      conversations.push({
        tradeId: trade.id,
        status: trade.status,
        otherUser,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          createdAt: lastMessage.created_at,
          isFromMe: lastMessage.sender_id === req.user.id
        } : null,
        unreadCount: parseInt(unreadCount.total),
        updatedAt: trade.created_at
      });
    }

    // Sort by last activity
    conversations.sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(a.updatedAt);
      const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(b.updatedAt);
      return bTime - aTime;
    });

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

module.exports = router;
