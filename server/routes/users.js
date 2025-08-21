const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { db } = require('../config/database');
const cloudinary = require('../config/cloudinary');

const router = express.Router();

// Multer configuration for avatar uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Validation middleware
const validateProfileUpdate = [
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
  body('bio').optional().trim().isLength({ max: 500 }),
  body('phone').optional().trim().isLength({ max: 20 }),
  body('locationCity').optional().trim().isLength({ max: 100 }),
  body('locationState').optional().trim().isLength({ max: 100 }),
  body('locationCountry').optional().trim().isLength({ max: 100 }),
  body('interests').optional().custom((value) => {
    if (value === undefined || value === null) return true;
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed);
    } catch {
      return false;
    }
  }).withMessage('Interests must be a valid JSON array'),
  body('skillsOffered').optional().custom((value) => {
    if (value === undefined || value === null) return true;
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed);
    } catch {
      return false;
    }
  }).withMessage('Skills offered must be a valid JSON array'),
];

// Get user profile by username
router.get('/profile/:username', optionalAuth, async (req, res) => {
  try {
    const { username } = req.params;

    const user = await db('users')
      .select(
        'id',
        'username',
        'first_name',
        'last_name',
        'bio',
        'avatar_url',
        'location_city',
        'location_state',
        'location_country',
        'interests',
        'skills_offered',
        'trust_score',
        'total_trades',
        'successful_trades',
        'is_verified',
        'created_at'
      )
      .where('username', username)
      .where('is_banned', false)
      .first();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's available items
    const items = await db('items')
      .select(
        'id',
        'title',
        'description',
        'images',
        'condition',
        'item_type',
        'estimated_value',
        'created_at'
      )
      .where('user_id', user.id)
      .where('is_available', true)
      .orderBy('created_at', 'desc')
      .limit(6);

    // Get user's recent reviews
    const reviews = await db('reviews')
      .select(
        'reviews.rating',
        'reviews.comment',
        'reviews.tags',
        'reviews.created_at',
        'reviewer.username as reviewer_username',
        'reviewer.avatar_url as reviewer_avatar'
      )
      .join('users as reviewer', 'reviews.reviewer_id', 'reviewer.id')
      .where('reviews.reviewed_user_id', user.id)
      .where('reviews.is_public', true)
      .orderBy('reviews.created_at', 'desc')
      .limit(5);

    // Calculate average rating
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0;

    res.json({
      user: {
        ...user,
        averageRating: Math.round(avgRating * 10) / 10
      },
      items,
      reviews,
      totalReviews: reviews.length
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Get current user's profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await db('users')
      .select(
        'id',
        'email',
        'username',
        'first_name',
        'last_name',
        'bio',
        'avatar_url',
        'phone',
        'phone_verified',
        'email_verified',
        'location_city',
        'location_state',
        'location_country',
        'latitude',
        'longitude',
        'interests',
        'skills_offered',
        'trust_score',
        'total_trades',
        'successful_trades',
        'is_verified',
        'created_at',
        'last_active'
      )
      .where('id', req.user.id)
      .first();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get swap credits balance
    const swapCredits = await db('swap_credits')
      .select('balance', 'total_earned', 'total_spent')
      .where('user_id', user.id)
      .first();

    res.json({
      user: {
        ...user,
        swapCredits: swapCredits || { balance: 0, total_earned: 0, total_spent: 0 }
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile
router.put('/me', authenticateToken, upload.single('avatar'), validateProfileUpdate, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      firstName,
      lastName,
      bio,
      phone,
      locationCity,
      locationState,
      locationCountry,
      latitude,
      longitude,
      interests,
      skillsOffered
    } = req.body;

    const updateData = {};

    // Handle avatar upload
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(
          `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
          {
            folder: 'swapcircle/avatars',
            transformation: [
              { width: 200, height: 200, crop: 'fill', gravity: 'face' },
              { quality: 'auto' }
            ]
          }
        );
        updateData.avatar_url = result.secure_url;
      } catch (uploadError) {
        console.error('Avatar upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload avatar' });
      }
    }

    // Add other fields to update
    if (firstName !== undefined) updateData.first_name = firstName;
    if (lastName !== undefined) updateData.last_name = lastName;
    if (bio !== undefined) updateData.bio = bio;
    if (phone !== undefined) updateData.phone = phone;
    if (locationCity !== undefined) updateData.location_city = locationCity;
    if (locationState !== undefined) updateData.location_state = locationState;
    if (locationCountry !== undefined) updateData.location_country = locationCountry;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    
    // Parse JSON strings for arrays
    if (interests !== undefined) {
      try {
        updateData.interests = JSON.parse(interests);
      } catch (e) {
        console.error('Failed to parse interests:', e);
        updateData.interests = [];
      }
    }
    if (skillsOffered !== undefined) {
      try {
        updateData.skills_offered = JSON.parse(skillsOffered);
      } catch (e) {
        console.error('Failed to parse skillsOffered:', e);
        updateData.skills_offered = [];
      }
    }

    // Update user
    await db('users')
      .where('id', req.user.id)
      .update({
        ...updateData,
        updated_at: db.fn.now()
      });

    // Get updated user
    const updatedUser = await db('users')
      .select(
        'id',
        'email',
        'username',
        'first_name',
        'last_name',
        'bio',
        'avatar_url',
        'phone',
        'location_city',
        'location_state',
        'location_country',
        'latitude',
        'longitude',
        'interests',
        'skills_offered',
        'trust_score',
        'total_trades',
        'successful_trades',
        'is_verified'
      )
      .where('id', req.user.id)
      .first();

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user's items
router.get('/:username/items', optionalAuth, async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 20, status = 'available' } = req.query;

    // Get user ID
    const user = await db('users')
      .select('id')
      .where('username', username)
      .where('is_banned', false)
      .first();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let query = db('items')
      .select(
        'items.*',
        'categories.name as category_name'
      )
      .leftJoin('categories', 'items.category_id', 'categories.id')
      .where('items.user_id', user.id);

    // Apply status filter
    if (status === 'available') {
      query = query.where('items.is_available', true);
    } else if (status === 'traded') {
      query = query.where('items.is_available', false);
    }

    // Get total count for pagination
    const countQuery = db('items')
      .leftJoin('categories', 'items.category_id', 'categories.id')
      .where('items.user_id', user.id);
    
    // Apply status filter to count query
    if (status === 'available') {
      countQuery.where('items.is_available', true);
    } else if (status === 'traded') {
      countQuery.where('items.is_available', false);
    }
    
    const totalCount = await countQuery.count('items.id as total').first();

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.orderBy('items.created_at', 'desc')
      .offset(offset)
      .limit(limit);

    const items = await query;

    res.json({
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount.total,
        pages: Math.ceil(totalCount.total / limit)
      }
    });
  } catch (error) {
    console.error('Get user items error:', error);
    res.status(500).json({ error: 'Failed to fetch user items' });
  }
});

// Get user's reviews
router.get('/:username/reviews', optionalAuth, async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Get user ID
    const user = await db('users')
      .select('id')
      .where('username', username)
      .where('is_banned', false)
      .first();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let query = db('reviews')
      .select(
        'reviews.*',
        'reviewer.username as reviewer_username',
        'reviewer.first_name as reviewer_first_name',
        'reviewer.last_name as reviewer_last_name',
        'reviewer.avatar_url as reviewer_avatar',
        'trades.initiator_item_id',
        'trades.responder_item_id'
      )
      .join('users as reviewer', 'reviews.reviewer_id', 'reviewer.id')
      .join('trades', 'reviews.trade_id', 'trades.id')
      .where('reviews.reviewed_user_id', user.id)
      .where('reviews.is_public', true);

    // Get total count for pagination
    const countQuery = db('reviews')
      .join('users as reviewer', 'reviews.reviewer_id', 'reviewer.id')
      .join('trades', 'reviews.trade_id', 'trades.id')
      .where('reviews.reviewed_user_id', user.id)
      .where('reviews.is_public', true);
    
    const totalCount = await countQuery.count('reviews.id as total').first();

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.orderBy('reviews.created_at', 'desc')
      .offset(offset)
      .limit(limit);

    const reviews = await query;

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount.total,
        pages: Math.ceil(totalCount.total / limit)
      }
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch user reviews' });
  }
});

// Search users
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { q, location, skills, page = 1, limit = 20 } = req.query;

    let query = db('users')
      .select(
        'id',
        'username',
        'first_name',
        'last_name',
        'avatar_url',
        'bio',
        'location_city',
        'location_state',
        'location_country',
        'interests',
        'skills_offered',
        'trust_score',
        'total_trades',
        'successful_trades',
        'is_verified'
      )
      .where('is_banned', false);

    // Apply search filters
    if (q) {
      query = query.where(function() {
        this.where('username', 'ilike', `%${q}%`)
          .orWhere('first_name', 'ilike', `%${q}%`)
          .orWhere('last_name', 'ilike', `%${q}%`)
          .orWhere('bio', 'ilike', `%${q}%`);
      });
    }

    if (location) {
      query = query.where(function() {
        this.where('location_city', 'ilike', `%${location}%`)
          .orWhere('location_state', 'ilike', `%${location}%`)
          .orWhere('location_country', 'ilike', `%${location}%`);
      });
    }

    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim());
      query = query.whereRaw('skills_offered && ?', [JSON.stringify(skillsArray)]);
    }

    // Get total count for pagination
    const countQuery = db('users')
      .where('is_banned', false);
    
    // Apply search filters to count query
    if (q) {
      countQuery.where(function() {
        this.where('username', 'ilike', `%${q}%`)
          .orWhere('first_name', 'ilike', `%${q}%`)
          .orWhere('last_name', 'ilike', `%${q}%`)
          .orWhere('bio', 'ilike', `%${q}%`);
      });
    }
    
    if (location) {
      countQuery.where(function() {
        this.where('location_city', 'ilike', `%${location}%`)
          .orWhere('location_state', 'ilike', `%${location}%`)
          .orWhere('location_country', 'ilike', `%${location}%`);
      });
    }
    
    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim());
      countQuery.whereRaw('skills_offered && ?', [JSON.stringify(skillsArray)]);
    }
    
    const totalCount = await countQuery.count('users.id as total').first();

    // Apply pagination and sorting
    const offset = (page - 1) * limit;
    query = query.orderBy('trust_score', 'desc')
      .orderBy('total_trades', 'desc')
      .offset(offset)
      .limit(limit);

    const users = await query;

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount.total,
        pages: Math.ceil(totalCount.total / limit)
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

module.exports = router;
