const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { db } = require('../config/database');

const router = express.Router();

// Admin middleware - require admin role
const requireAdmin = requireRole(['admin', 'moderator']);

// Get platform statistics
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // User statistics
    const userStats = await db('users')
      .select(
        db.raw('COUNT(*) as total_users'),
        db.raw('COUNT(CASE WHEN created_at >= NOW() - INTERVAL \'7 days\' THEN 1 END) as new_users_7d'),
        db.raw('COUNT(CASE WHEN created_at >= NOW() - INTERVAL \'30 days\' THEN 1 END) as new_users_30d'),
        db.raw('COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_users'),
        db.raw('COUNT(CASE WHEN is_banned = true THEN 1 END) as banned_users')
      )
      .first();

    // Item statistics
    const itemStats = await db('items')
      .select(
        db.raw('COUNT(*) as total_items'),
        db.raw('COUNT(CASE WHEN is_available = true THEN 1 END) as available_items'),
        db.raw('COUNT(CASE WHEN created_at >= NOW() - INTERVAL \'7 days\' THEN 1 END) as new_items_7d'),
        db.raw('COUNT(CASE WHEN item_type = \'good\' THEN 1 END) as goods_count'),
        db.raw('COUNT(CASE WHEN item_type = \'service\' THEN 1 END) as services_count')
      )
      .first();

    // Trade statistics
    const tradeStats = await db('trades')
      .select(
        db.raw('COUNT(*) as total_trades'),
        db.raw('COUNT(CASE WHEN status = \'completed\' THEN 1 END) as completed_trades'),
        db.raw('COUNT(CASE WHEN status = \'pending\' THEN 1 END) as pending_trades'),
        db.raw('COUNT(CASE WHEN created_at >= NOW() - INTERVAL \'7 days\' THEN 1 END) as new_trades_7d')
      )
      .first();

    // Category statistics
    const categoryStats = await db('categories')
      .select(
        db.raw('COUNT(*) as total_categories'),
        db.raw('COUNT(CASE WHEN is_active = true THEN 1 END) as active_categories')
      )
      .first();

    res.json({
      userStats,
      itemStats,
      tradeStats,
      categoryStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch admin statistics' });
  }
});

// Get reported items/users
router.get('/reports', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;

    // This would typically come from a reports table
    // For now, we'll return a placeholder structure
    res.json({
      reports: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        pages: 0
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Ban/unban user
router.patch('/users/:userId/ban', authenticateToken, requireAdmin, [
  body('reason').trim().isLength({ min: 1, max: 500 }),
  body('duration').optional().isIn(['temporary', 'permanent'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { reason, duration = 'permanent' } = req.body;

    // Check if user exists
    const user = await db('users')
      .select('id', 'username', 'is_banned')
      .where('id', userId)
      .first();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.is_banned) {
      return res.status(400).json({ error: 'User is already banned' });
    }

    // Ban user
    await db('users')
      .where('id', userId)
      .update({
        is_banned: true,
        ban_reason: reason,
        updated_at: db.fn.now()
      });

    // Mark all user's items as unavailable
    await db('items')
      .where('user_id', userId)
      .where('is_available', true)
      .update({
        is_available: false,
        updated_at: db.fn.now()
      });

    res.json({
      message: 'User banned successfully',
      userId,
      username: user.username,
      reason,
      duration
    });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

// Unban user
router.patch('/users/:userId/unban', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await db('users')
      .select('id', 'username', 'is_banned')
      .where('id', userId)
      .first();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.is_banned) {
      return res.status(400).json({ error: 'User is not banned' });
    }

    // Unban user
    await db('users')
      .where('id', userId)
      .update({
        is_banned: false,
        ban_reason: null,
        updated_at: db.fn.now()
      });

    res.json({
      message: 'User unbanned successfully',
      userId,
      username: user.username
    });
  } catch (error) {
    console.error('Unban user error:', error);
    res.status(500).json({ error: 'Failed to unban user' });
  }
});

// Feature/unfeature item
router.patch('/items/:itemId/feature', authenticateToken, requireAdmin, [
  body('featured').isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { itemId } = req.params;
    const { featured } = req.body;

    // Check if item exists
    const item = await db('items')
      .select('id', 'title', 'is_featured')
      .where('id', itemId)
      .first();

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.is_featured === featured) {
      return res.status(400).json({ 
        error: `Item is already ${featured ? 'featured' : 'not featured'}` 
      });
    }

    // Update featured status
    await db('items')
      .where('id', itemId)
      .update({
        is_featured: featured,
        updated_at: db.fn.now()
      });

    res.json({
      message: `Item ${featured ? 'featured' : 'unfeatured'} successfully`,
      itemId,
      title: item.title,
      featured
    });
  } catch (error) {
    console.error('Feature item error:', error);
    res.status(500).json({ error: 'Failed to update item featured status' });
  }
});

// Remove inappropriate item
router.delete('/items/:itemId', authenticateToken, requireAdmin, [
  body('reason').trim().isLength({ min: 1, max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { itemId } = req.params;
    const { reason } = req.body;

    // Check if item exists
    const item = await db('items')
      .select('id', 'title', 'user_id')
      .where('id', itemId)
      .first();

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Soft delete item
    await db('items')
      .where('id', itemId)
      .update({
        is_available: false,
        updated_at: db.fn.now()
      });

    // Log the removal (you might want to create a separate table for this)
    console.log(`Admin ${req.user.username} removed item ${itemId} (${item.title}) for reason: ${reason}`);

    res.json({
      message: 'Item removed successfully',
      itemId,
      title: item.title,
      reason
    });
  } catch (error) {
    console.error('Remove item error:', error);
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

// Get system health
router.get('/health', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Check database connection
    const dbHealth = await db.raw('SELECT 1');
    
    // Check if migrations are up to date
    const migrations = await db.migrate.list();
    const pendingMigrations = migrations.filter(m => m.executed === false);

    // Check table sizes
    const tableStats = await db.raw(`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_tuples,
        n_dead_tup as dead_tuples
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY n_live_tup DESC
    `);

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: dbHealth.rows.length > 0,
        pendingMigrations: pendingMigrations.length
      },
      tables: tableStats.rows,
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get user activity logs
router.get('/logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId, action, page = 1, limit = 50 } = req.query;

    // This would typically come from a logs table
    // For now, we'll return a placeholder structure
    res.json({
      logs: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        pages: 0
      }
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Update category
router.put('/categories/:categoryId', authenticateToken, requireAdmin, [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('isActive').optional().isBoolean(),
  body('sortOrder').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { categoryId } = req.params;
    const { name, description, isActive, sortOrder } = req.body;

    // Check if category exists
    const category = await db('categories')
      .select('id', 'name')
      .where('id', categoryId)
      .first();

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (sortOrder !== undefined) updateData.sort_order = sortOrder;

    // Update category
    await db('categories')
      .where('id', categoryId)
      .update({
        ...updateData,
        updated_at: db.fn.now()
      });

    // Get updated category
    const updatedCategory = await db('categories')
      .where('id', categoryId)
      .first();

    res.json({
      message: 'Category updated successfully',
      category: updatedCategory
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

module.exports = router;
