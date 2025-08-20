const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { db } = require('../config/database');

const router = express.Router();

// Validation middleware
const validateTradeInitiation = [
  body('responderId').isUUID().notEmpty(),
  body('initiatorItemId').optional().isUUID(),
  body('responderItemId').optional().isUUID(),
  body('initiatorMessage').optional().trim().isLength({ max: 500 }),
  body('swapCredits').optional().isFloat({ min: 0 }),
];

const validateTradeUpdate = [
  body('status').isIn(['accepted', 'in_progress', 'completed', 'cancelled', 'disputed']),
  body('message').optional().trim().isLength({ max: 500 }),
  body('cancellationReason').optional().trim().isLength({ max: 200 }),
];

// Get user's trades
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let query = db('trades')
      .select(
        'trades.*',
        'initiator.username as initiator_username',
        'initiator.first_name as initiator_first_name',
        'initiator.last_name as initiator_last_name',
        'initiator.avatar_url as initiator_avatar',
        'initiator.trust_score as initiator_trust_score',
        'responder.username as responder_username',
        'responder.first_name as responder_first_name',
        'responder.last_name as responder_last_name',
        'responder.avatar_url as responder_avatar',
        'responder.trust_score as responder_trust_score',
        'initiator_item.title as initiator_item_title',
        'initiator_item.images as initiator_item_images',
        'responder_item.title as responder_item_title',
        'responder_item.images as responder_item_images'
      )
      .join('users as initiator', 'trades.initiator_id', 'initiator.id')
      .join('users as responder', 'trades.responder_id', 'responder.id')
      .leftJoin('items as initiator_item', 'trades.initiator_item_id', 'initiator_item.id')
      .leftJoin('items as responder_item', 'trades.responder_item_id', 'responder_item.id')
      .where(function() {
        this.where('trades.initiator_id', req.user.id)
          .orWhere('trades.responder_id', req.user.id);
      });

    // Apply status filter
    if (status) {
      query = query.where('trades.status', status);
    }

    // Get total count for pagination
    const countQuery = db('trades')
      .join('users as initiator', 'trades.initiator_id', 'initiator.id')
      .join('users as responder', 'trades.responder_id', 'responder.id')
      .leftJoin('items as initiator_item', 'trades.initiator_item_id', 'initiator_item.id')
      .leftJoin('items as responder_item', 'trades.responder_item_id', 'responder_item.id')
      .where(function() {
        this.where('trades.initiator_id', req.user.id)
          .orWhere('trades.responder_id', req.user.id);
      });
    
    // Apply status filter to count query
    if (status) {
      countQuery.where('trades.status', status);
    }
    
    const totalCount = await countQuery.count('trades.id as total').first();

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.orderBy('trades.created_at', 'desc')
      .offset(offset)
      .limit(limit);

    const trades = await query;

    res.json({
      trades,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount.total,
        pages: Math.ceil(totalCount.total / limit)
      }
    });
  } catch (error) {
    console.error('Get trades error:', error);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

// Get single trade by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const trade = await db('trades')
      .select(
        'trades.*',
        'initiator.username as initiator_username',
        'initiator.first_name as initiator_first_name',
        'initiator.last_name as initiator_last_name',
        'initiator.avatar_url as initiator_avatar',
        'initiator.trust_score as initiator_trust_score',
        'responder.username as responder_username',
        'responder.first_name as responder_first_name',
        'responder.last_name as responder_last_name',
        'responder.avatar_url as responder_avatar',
        'responder.trust_score as responder_trust_score',
        'initiator_item.title as initiator_item_title',
        'initiator_item.description as initiator_item_description',
        'initiator_item.images as initiator_item_images',
        'initiator_item.condition as initiator_item_condition',
        'responder_item.title as responder_item_title',
        'responder_item.description as responder_item_description',
        'responder_item.images as responder_item_images',
        'responder_item.condition as responder_item_condition'
      )
      .join('users as initiator', 'trades.initiator_id', 'initiator.id')
      .join('users as responder', 'trades.responder_id', 'responder.id')
      .leftJoin('items as initiator_item', 'trades.initiator_item_id', 'initiator_item.id')
      .leftJoin('items as responder_item', 'trades.responder_item_id', 'responder_item.id')
      .where('trades.id', id)
      .first();

    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    // Check if user is part of this trade
    if (trade.initiator_id !== req.user.id && trade.responder_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ trade });
  } catch (error) {
    console.error('Get trade error:', error);
    res.status(500).json({ error: 'Failed to fetch trade' });
  }
});

// Initiate a new trade
router.post('/', authenticateToken, validateTradeInitiation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      responderId,
      initiatorItemId,
      responderItemId,
      initiatorMessage,
      swapCredits
    } = req.body;

    // Check if responder exists and is not banned
    const responder = await db('users')
      .select('id', 'is_banned')
      .where('id', responderId)
      .first();

    if (!responder) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (responder.is_banned) {
      return res.status(400).json({ error: 'Cannot trade with banned user' });
    }

    // Check if items exist and are available
    if (initiatorItemId) {
      const initiatorItem = await db('items')
        .select('id', 'is_available', 'user_id')
        .where('id', initiatorItemId)
        .first();

      if (!initiatorItem) {
        return res.status(404).json({ error: 'Initiator item not found' });
      }

      if (initiatorItem.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Item does not belong to you' });
      }

      if (!initiatorItem.is_available) {
        return res.status(400).json({ error: 'Item is not available' });
      }
    }

    if (responderItemId) {
      const responderItem = await db('items')
        .select('id', 'is_available', 'user_id')
        .where('id', responderItemId)
        .first();

      if (!responderItem) {
        return res.status(404).json({ error: 'Responder item not found' });
      }

      if (responderItem.user_id !== responderId) {
        return res.status(400).json({ error: 'Item does not belong to responder' });
      }

      if (!responderItem.is_available) {
        return res.status(400).json({ error: 'Item is not available' });
      }
    }

    // Check if there's already a pending trade between these users
    const existingTrade = await db('trades')
      .where(function() {
        this.where('initiator_id', req.user.id)
          .andWhere('responder_id', responderId)
          .andWhere('status', 'pending');
      })
      .orWhere(function() {
        this.where('initiator_id', responderId)
          .andWhere('responder_id', req.user.id)
          .andWhere('status', 'pending');
      })
      .first();

    if (existingTrade) {
      return res.status(400).json({ error: 'A pending trade already exists with this user' });
    }

    // Create the trade
    const [tradeId] = await db('trades').insert({
      initiator_id: req.user.id,
      responder_id: responderId,
      initiator_item_id: initiatorItemId,
      responder_item_id: responderItemId,
      initiator_message: initiatorMessage,
      swap_credits: swapCredits || 0,
      status: 'pending'
    }).returning('id');

    // Get the created trade
    const trade = await db('trades')
      .select(
        'trades.*',
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
      .where('trades.id', tradeId)
      .first();

    res.status(201).json({
      message: 'Trade initiated successfully',
      trade
    });
  } catch (error) {
    console.error('Initiate trade error:', error);
    res.status(500).json({ error: 'Failed to initiate trade' });
  }
});

// Update trade status
router.patch('/:id/status', authenticateToken, validateTradeUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, message, cancellationReason } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Get the trade
    const trade = await db('trades')
      .where('id', id)
      .first();

    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    // Check if user is part of this trade
    if (trade.initiator_id !== req.user.id && trade.responder_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if user can update the status
    const canUpdate = checkStatusUpdatePermission(trade, req.user.id, status);
    if (!canUpdate.allowed) {
      return res.status(400).json({ error: canUpdate.reason });
    }

    // Prepare update data
    const updateData = { status };
    
    if (status === 'accepted') {
      updateData.accepted_at = db.fn.now();
      if (message) {
        updateData.responder_message = message;
      }
    } else if (status === 'completed') {
      updateData.completed_at = db.fn.now();
    } else if (status === 'cancelled') {
      updateData.cancelled_at = db.fn.now();
      updateData.cancelled_by = req.user.id;
      if (cancellationReason) {
        updateData.cancellation_reason = cancellationReason;
      }
    }

    // Update the trade
    await db('trades')
      .where('id', id)
      .update(updateData);

    // Handle item availability changes
    if (status === 'accepted') {
      // Mark items as unavailable
      if (trade.initiator_item_id) {
        await db('items')
          .where('id', trade.initiator_item_id)
          .update({ is_available: false });
      }
      if (trade.responder_item_id) {
        await db('items')
          .where('id', trade.responder_item_id)
          .update({ is_available: false });
      }
    } else if (status === 'cancelled' && trade.status === 'accepted') {
      // Mark items as available again if cancelling an accepted trade
      if (trade.initiator_item_id) {
        await db('items')
          .where('id', trade.initiator_item_id)
          .update({ is_available: true });
      }
      if (trade.responder_item_id) {
        await db('items')
          .where('id', trade.responder_item_id)
          .update({ is_available: true });
      }
    }

    // Get updated trade
    const updatedTrade = await db('trades')
      .select(
        'trades.*',
        'initiator.username as initiator_username',
        'initiator.first_name as initiator_first_name',
        'initiator.last_name as initiator_last_name',
        'responder.username as responder_username',
        'responder.first_name as responder_first_name',
        'responder.last_name as responder_last_name'
      )
      .join('users as initiator', 'trades.initiator_id', 'initiator.id')
      .join('users as responder', 'trades.responder_id', 'responder.id')
      .where('trades.id', id)
      .first();

    res.json({
      message: `Trade ${status} successfully`,
      trade: updatedTrade
    });
  } catch (error) {
    console.error('Update trade status error:', error);
    res.status(500).json({ error: 'Failed to update trade status' });
  }
});

// Helper function to check if user can update trade status
function checkStatusUpdatePermission(trade, userId, newStatus) {
  const isInitiator = trade.initiator_id === userId;
  const isResponder = trade.responder_id === userId;

  // Only participants can update
  if (!isInitiator && !isResponder) {
    return { allowed: false, reason: 'Only trade participants can update status' };
  }

  // Status transition rules
  switch (trade.status) {
    case 'pending':
      if (newStatus === 'accepted' && isResponder) {
        return { allowed: true };
      }
      if (newStatus === 'cancelled' && (isInitiator || isResponder)) {
        return { allowed: true };
      }
      break;

    case 'accepted':
      if (newStatus === 'in_progress' && (isInitiator || isResponder)) {
        return { allowed: true };
      }
      if (newStatus === 'cancelled' && (isInitiator || isResponder)) {
        return { allowed: true };
      }
      break;

    case 'in_progress':
      if (newStatus === 'completed' && (isInitiator || isResponder)) {
        return { allowed: true };
      }
      if (newStatus === 'disputed' && (isInitiator || isResponder)) {
        return { allowed: true };
      }
      break;

    case 'completed':
    case 'cancelled':
    case 'disputed':
      return { allowed: false, reason: 'Cannot update completed, cancelled, or disputed trades' };
  }

  return { allowed: false, reason: 'Invalid status transition' };
}

module.exports = router;
