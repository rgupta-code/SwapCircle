const express = require('express');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { db } = require('../config/database');

const router = express.Router();

// Advanced search for items
router.get('/items', optionalAuth, async (req, res) => {
  try {
    const {
      q = '',
      category,
      itemType,
      condition,
      minValue,
      maxValue,
      location,
      radius,
      tags,
      allowsShipping,
      allowsPickup,
      allowsMeetup,
      sortBy = 'relevance',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    let query = db('items')
      .select(
        'items.*',
        'users.username',
        'users.first_name',
        'users.last_name',
        'users.avatar_url',
        'users.trust_score',
        'users.location_city',
        'users.location_state',
        'categories.name as category_name',
        'categories.slug as category_slug'
      )
      .join('users', 'items.user_id', 'users.id')
      .leftJoin('categories', 'items.category_id', 'categories.id')
      .where('items.is_available', true)
      .where('users.is_banned', false);

    // Text search
    if (q) {
      query = query.where(function() {
        this.where('items.title', 'ilike', `%${q}%`)
          .orWhere('items.description', 'ilike', `%${q}%`)
          .orWhere('items.tags', 'ilike', `%${q}%`)
          .orWhere('categories.name', 'ilike', `%${q}%`);
      });
    }

    // Category filter
    if (category) {
      query = query.where('items.category_id', category);
    }

    // Item type filter
    if (itemType) {
      query = query.where('items.item_type', itemType);
    }

    // Condition filter
    if (condition) {
      query = query.where('items.condition', condition);
    }

    // Value range filter
    if (minValue !== undefined) {
      query = query.where('items.estimated_value', '>=', parseFloat(minValue));
    }
    if (maxValue !== undefined) {
      query = query.where('items.estimated_value', '<=', parseFloat(maxValue));
    }

    // Location filter
    if (location) {
      query = query.where(function() {
        this.where('users.location_city', 'ilike', `%${location}%`)
          .orWhere('users.location_state', 'ilike', `%${location}%`)
          .orWhere('users.location_country', 'ilike', `%${location}%`);
      });
    }

    // Tags filter
    if (tags) {
      const tagsArray = tags.split(',').map(t => t.trim());
      query = query.whereRaw('items.tags && ?', [JSON.stringify(tagsArray)]);
    }

    // Shipping options filter
    if (allowsShipping !== undefined) {
      query = query.where('items.allows_shipping', allowsShipping === 'true');
    }
    if (allowsPickup !== undefined) {
      query = query.where('items.allows_pickup', allowsPickup === 'true');
    }
    if (allowsMeetup !== undefined) {
      query = query.where('items.allows_meetup', allowsMeetup === 'true');
    }

    // Apply sorting
    switch (sortBy) {
      case 'relevance':
        if (q) {
          // Boost items that match search query
          query = query.orderByRaw(`
            CASE 
              WHEN items.title ILIKE ? THEN 3
              WHEN items.description ILIKE ? THEN 2
              WHEN items.tags ILIKE ? THEN 1
              ELSE 0
            END DESC
          `, [`%${q}%`, `%${q}%`, `%${q}%`]);
        }
        query = query.orderBy('items.is_featured', 'desc');
        break;
      case 'newest':
        query = query.orderBy('items.created_at', sortOrder);
        break;
      case 'oldest':
        query = query.orderBy('items.created_at', sortOrder);
        break;
      case 'value_high':
        query = query.orderBy('items.estimated_value', 'desc');
        break;
      case 'value_low':
        query = query.orderBy('items.estimated_value', 'asc');
        break;
      case 'popular':
        query = query.orderBy('items.view_count', 'desc');
        break;
      case 'trust':
        query = query.orderBy('users.trust_score', 'desc');
        break;
      default:
        query = query.orderBy('items.created_at', 'desc');
    }

    // Get total count for pagination
    const countQuery = query.clone();
    const totalCount = await countQuery.count('* as total').first();

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.offset(offset).limit(limit);

    const items = await query;

    // Increment view count for search results
    if (items.length > 0) {
      const itemIds = items.map(item => item.id);
      await db('items')
        .whereIn('id', itemIds)
        .increment('view_count', 1);
    }

    res.json({
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount.total,
        pages: Math.ceil(totalCount.total / limit)
      },
      filters: {
        query: q,
        category,
        itemType,
        condition,
        minValue,
        maxValue,
        location,
        tags: tags ? tags.split(',').map(t => t.trim()) : [],
        allowsShipping,
        allowsPickup,
        allowsMeetup
      }
    });
  } catch (error) {
    console.error('Search items error:', error);
    res.status(500).json({ error: 'Failed to search items' });
  }
});

// Search users
router.get('/users', optionalAuth, async (req, res) => {
  try {
    const {
      q = '',
      location,
      skills,
      interests,
      minTrustScore,
      hasItems,
      sortBy = 'relevance',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    let query = db('users')
      .select(
        'users.id',
        'users.username',
        'users.first_name',
        'users.last_name',
        'users.bio',
        'users.avatar_url',
        'users.location_city',
        'users.location_state',
        'users.location_country',
        'users.interests',
        'users.skills_offered',
        'users.trust_score',
        'users.total_trades',
        'users.successful_trades',
        'users.is_verified',
        'users.created_at'
      )
      .where('users.is_banned', false);

    // Text search
    if (q) {
      query = query.where(function() {
        this.where('users.username', 'ilike', `%${q}%`)
          .orWhere('users.first_name', 'ilike', `%${q}%`)
          .orWhere('users.last_name', 'ilike', `%${q}%`)
          .orWhere('users.bio', 'ilike', `%${q}%`);
      });
    }

    // Location filter
    if (location) {
      query = query.where(function() {
        this.where('users.location_city', 'ilike', `%${location}%`)
          .orWhere('users.location_state', 'ilike', `%${location}%`)
          .orWhere('users.location_country', 'ilike', `%${location}%`);
      });
    }

    // Skills filter
    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim());
      query = query.whereRaw('users.skills_offered && ?', [JSON.stringify(skillsArray)]);
    }

    // Interests filter
    if (interests) {
      const interestsArray = interests.split(',').map(i => i.trim());
      query = query.whereRaw('users.interests && ?', [JSON.stringify(interestsArray)]);
    }

    // Trust score filter
    if (minTrustScore) {
      query = query.where('users.trust_score', '>=', parseInt(minTrustScore));
    }

    // Users with items filter
    if (hasItems === 'true') {
      query = query.whereExists(function() {
        this.select('*')
          .from('items')
          .whereRaw('items.user_id = users.id')
          .where('items.is_available', true);
      });
    }

    // Apply sorting
    switch (sortBy) {
      case 'relevance':
        if (q) {
          query = query.orderByRaw(`
            CASE 
              WHEN users.username ILIKE ? THEN 3
              WHEN users.first_name ILIKE ? OR users.last_name ILIKE ? THEN 2
              WHEN users.bio ILIKE ? THEN 1
              ELSE 0
            END DESC
          `, [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]);
        }
        break;
      case 'trust':
        query = query.orderBy('users.trust_score', sortOrder);
        break;
      case 'trades':
        query = query.orderBy('users.total_trades', sortOrder);
        break;
      case 'newest':
        query = query.orderBy('users.created_at', sortOrder);
        break;
      case 'oldest':
        query = query.orderBy('users.created_at', sortOrder);
        break;
      default:
        query = query.orderBy('users.trust_score', 'desc');
    }

    // Get total count for pagination
    const countQuery = query.clone();
    const totalCount = await countQuery.count('* as total').first();

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.offset(offset).limit(limit);

    const users = await query;

    // Get item count for each user
    const usersWithItems = await Promise.all(
      users.map(async (user) => {
        const itemCount = await db('items')
          .count('* as total')
          .where('user_id', user.id)
          .where('is_available', true)
          .first();

        return {
          ...user,
          availableItemsCount: parseInt(itemCount.total)
        };
      })
    );

    res.json({
      users: usersWithItems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount.total,
        pages: Math.ceil(totalCount.total / limit)
      },
      filters: {
        query: q,
        location,
        skills: skills ? skills.split(',').map(s => s.trim()) : [],
        interests: interests ? interests.split(',').map(i => i.trim()) : [],
        minTrustScore,
        hasItems
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Get search suggestions/autocomplete
router.get('/suggestions', optionalAuth, async (req, res) => {
  try {
    const { q = '', type = 'items' } = req.query;

    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    let suggestions = [];

    if (type === 'items') {
      // Item title suggestions
      const itemSuggestions = await db('items')
        .select('title')
        .where('is_available', true)
        .where('title', 'ilike', `%${q}%`)
        .limit(5);

      // Category suggestions
      const categorySuggestions = await db('categories')
        .select('name')
        .where('is_active', true)
        .where('name', 'ilike', `%${q}%`)
        .limit(3);

      // Tag suggestions
      const tagSuggestions = await db('items')
        .select('tags')
        .where('is_available', true)
        .whereRaw('tags && ?', [JSON.stringify([q])])
        .limit(3);

      suggestions = [
        ...itemSuggestions.map(item => ({ type: 'item', value: item.title })),
        ...categorySuggestions.map(cat => ({ type: 'category', value: cat.name })),
        ...tagSuggestions.flatMap(item => 
          item.tags.filter(tag => tag.toLowerCase().includes(q.toLowerCase()))
            .map(tag => ({ type: 'tag', value: tag }))
        )
      ];
    } else if (type === 'users') {
      // Username suggestions
      const userSuggestions = await db('users')
        .select('username', 'first_name', 'last_name')
        .where('is_banned', false)
        .where(function() {
          this.where('username', 'ilike', `%${q}%`)
            .orWhere('first_name', 'ilike', `%${q}%`)
            .orWhere('last_name', 'ilike', `%${q}%`);
        })
        .limit(5);

      suggestions = userSuggestions.map(user => ({
        type: 'user',
        value: user.username,
        display: `${user.first_name} ${user.last_name} (@${user.username})`
      }));
    }

    // Remove duplicates and limit results
    const uniqueSuggestions = suggestions
      .filter((suggestion, index, self) => 
        index === self.findIndex(s => s.value === suggestion.value)
      )
      .slice(0, 10);

    res.json({ suggestions: uniqueSuggestions });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// Get popular searches
router.get('/popular', async (req, res) => {
  try {
    // Get popular categories
    const popularCategories = await db('categories')
      .select('name', 'slug')
      .where('is_active', true)
      .orderBy('sort_order', 'asc')
      .limit(8);

    // Get popular tags
    const popularTags = await db('items')
      .select('tags')
      .where('is_available', true)
      .limit(100);

    const tagCounts = {};
    popularTags.forEach(item => {
      if (item.tags) {
        item.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    const topTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag]) => tag);

    res.json({
      popularCategories,
      popularTags: topTags
    });
  } catch (error) {
    console.error('Get popular searches error:', error);
    res.status(500).json({ error: 'Failed to get popular searches' });
  }
});

module.exports = router;
