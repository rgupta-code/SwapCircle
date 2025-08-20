const express = require('express');
const { db } = require('../config/database');

const router = express.Router();

// Get all active categories
router.get('/', async (req, res) => {
  try {
    const categories = await db('categories')
      .select('id', 'name', 'slug', 'description', 'icon', 'color', 'sort_order')
      .where('is_active', true)
      .orderBy('sort_order', 'asc');

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// Get category by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const category = await db('categories')
      .select('*')
      .where('slug', slug)
      .where('is_active', true)
      .first();

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Failed to get category' });
  }
});

// Get category statistics
router.get('/:slug/stats', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const category = await db('categories')
      .select('id', 'name')
      .where('slug', slug)
      .where('is_active', true)
      .first();

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Get item count for this category
    const itemCount = await db('items')
      .count('* as total')
      .where('category_id', category.id)
      .where('is_available', true)
      .first();

    // Get user count who have items in this category
    const userCount = await db('items')
      .distinct('user_id')
      .count('* as total')
      .where('category_id', category.id)
      .where('is_available', true)
      .first();

    res.json({
      category: category.name,
      totalItems: parseInt(itemCount.total),
      totalUsers: parseInt(userCount.total)
    });
  } catch (error) {
    console.error('Get category stats error:', error);
    res.status(500).json({ error: 'Failed to get category statistics' });
  }
});

module.exports = router;
