const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { db } = require('../config/database');
const cloudinary = require('../config/cloudinary');

const router = express.Router();

// Multer configuration for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
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
const validateItem = [
  body('title').trim().isLength({ min: 3, max: 100 }),
  body('description').trim().isLength({ min: 10, max: 1000 }),
  body('categoryId').isUUID(),
  body('itemType').isIn(['good', 'service']),
  body('condition').isIn(['new', 'like_new', 'good', 'fair', 'poor']),
  body('estimatedValue').optional().isFloat({ min: 0 }),

  body('allowsShipping').optional().isBoolean(),
  body('allowsPickup').optional().isBoolean(),
  body('allowsMeetup').optional().isBoolean(),
  body('meetupRadius').optional().isFloat({ min: 0, max: 100 }),
];

// Get all items with pagination and filters
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      itemType,
      condition,
      minValue,
      maxValue,
      location,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
      featured
    } = req.query;

    let query = db('items')
      .select('*')
      .where('is_available', true);

    // Apply featured filter
    if (featured === 'true') {
      query = query.where('is_featured', true);
    }

    // Apply filters
    if (category) {
      query = query.where('category_id', category);
    }
    if (itemType) {
      query = query.where('item_type', itemType);
    }
    if (condition) {
      query = query.where('condition', condition);
    }
    if (minValue) {
      query = query.where('estimated_value', '>=', minValue);
    }
    if (maxValue) {
      query = query.where('estimated_value', '<=', maxValue);
    }
    if (search) {
      query = query.where(function() {
        this.where('title', 'ilike', `%${search}%`)
          .orWhere('description', 'ilike', `%${search}%`);
      });
    }

    // Apply sorting
    const validSortFields = ['created_at', 'estimated_value', 'view_count', 'favorite_count'];
    const validSortOrders = ['asc', 'desc'];
    
    if (validSortFields.includes(sortBy) && validSortOrders.includes(sortOrder)) {
      query = query.orderBy(sortBy, sortOrder);
    }

    // Get total count for pagination
    const countQuery = db('items')
      .where('is_available', true);
    
    // Apply featured filter to count query
    if (featured === 'true') {
      countQuery.where('is_featured', true);
    }
    
    // Apply filters to count query
    if (category) {
      countQuery.where('category_id', category);
    }
    if (itemType) {
      countQuery.where('item_type', itemType);
    }
    if (condition) {
      countQuery.where('condition', condition);
    }
    if (minValue) {
      countQuery.where('estimated_value', '>=', minValue);
    }
    if (maxValue) {
      countQuery.where('estimated_value', '<=', maxValue);
    }
    if (search) {
      countQuery.where(function() {
        this.where('title', 'ilike', `%${search}%`)
          .orWhere('description', 'ilike', `%${search}%`);
      });
    }
    
    const totalCount = await countQuery.count('items.id as total').first();

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.offset(offset).limit(limit);

    const items = await query;

    // If no items found, return empty result instead of error
    if (!items || items.length === 0) {
      return res.json({
        items: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        }
      });
    }

    // Increment view count for each item
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
      }
    });
  } catch (error) {
    console.error('Get items error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      constraint: error.constraint,
      detail: error.detail,
      hint: error.hint,
      stack: error.stack
    });
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Get single item by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const item = await db('items')
      .select(
        'items.*',
        'users.username',
        'users.first_name',
        'users.last_name',
        'users.avatar_url',
        'users.trust_score',
        'categories.name as category_name'
      )
      .join('users', 'items.user_id', 'users.id')
      .leftJoin('categories', 'items.category_id', 'categories.id')
      .where('items.id', id)
      .first();

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Increment view count
    await db('items')
      .where('id', id)
      .increment('view_count', 1);

    res.json({ item });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// Create new item
router.post('/', authenticateToken, upload.array('images', 5), validateItem, async (req, res) => {
  try {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      categoryId,
      itemType,
      condition,
      estimatedValue,
      allowsShipping,
      allowsPickup,
      allowsMeetup,
      meetupRadius,
      tradePreferences
    } = req.body;

    console.log('req.body:', req.body);

    // Handle image uploads
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      // Check if Cloudinary is configured
      if (!process.env.CLOUDINARY_CLOUD_NAME || 
          !process.env.CLOUDINARY_API_KEY || 
          !process.env.CLOUDINARY_API_SECRET) {
        console.warn('Cloudinary not configured - skipping image uploads');
        // For now, just store a placeholder or skip images
        // imageUrls = ['placeholder-image-url'];
      } else {
        for (const file of req.files) {
          try {
            const result = await cloudinary.uploader.upload(
              `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
              {
                folder: 'swapcircle/items',
                transformation: [
                  { width: 800, height: 600, crop: 'limit' },
                  { quality: 'auto' }
                ]
              }
            );
            imageUrls.push(result.secure_url);
          } catch (uploadError) {
            console.error('Image upload error:', uploadError);
          }
        }
      }
    }

    // Get user location
    const user = await db('users')
      .select('location_city', 'location_state', 'location_country', 'latitude', 'longitude')
      .where('id', req.user.id)
      .first();

    const location = {
      city: user.location_city,
      state: user.location_state,
      country: user.location_country,
      coordinates: user.latitude && user.longitude ? [user.longitude, user.latitude] : null
    };

    // Create item
    const [itemResult] = await db('items').insert({
      user_id: req.user.id,
      category_id: categoryId,
      title,
      description,
      item_type: itemType,
      condition,
      images: imageUrls,

      estimated_value: estimatedValue,
      allows_shipping: allowsShipping || false,
      allows_pickup: allowsPickup !== false,
      allows_meetup: allowsMeetup !== false,
      meetup_radius: meetupRadius || 25,
      trade_preferences: tradePreferences || {},
      location
    }).returning('*');

    // Debug: Log the returned result
    console.log('Insert result:', itemResult);
    console.log('Type of itemResult:', typeof itemResult);

    // Extract the actual ID value
    const itemId = itemResult.id;
    console.log('Extracted itemId:', itemId);

    // Validate that we have a valid UUID
    if (!itemId || typeof itemId !== 'string') {
      throw new Error(`Invalid item ID returned: ${JSON.stringify(itemResult)}`);
    }

    // Get created item
    console.log('Querying for created item with ID:', itemId);
    console.log('ID type:', typeof itemId);
    
    // Build the query first to debug
    const query = db('items')
      .select(
        'items.*',
        'users.username',
        'users.first_name',
        'users.last_name',
        'users.avatar_url',
        'users.trust_score',
        'categories.name as category_name'
      )
      .join('users', 'items.user_id', 'users.id')
      .leftJoin('categories', 'items.category_id', 'categories.id')
      .where('items.id', itemId);
    
    console.log('Generated SQL:', query.toString());
    
    const item = await query.first();

    res.status(201).json({
      message: 'Item created successfully',
      item
    });
  } catch (error) {
    console.error('Create item error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      constraint: error.constraint,
      detail: error.detail,
      hint: error.hint,
      stack: error.stack
    });
    
    // Send more specific error messages
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'Item with this title already exists' });
    } else if (error.code === '23503') { // Foreign key constraint violation
      res.status(400).json({ error: 'Invalid category ID or user ID' });
    } else if (error.code === '23514') { // Check constraint violation
      res.status(400).json({ error: 'Invalid data provided' });
    } else {
      res.status(500).json({ error: 'Failed to create item', details: error.message });
    }
  }
});

// Update item
router.put('/:id', authenticateToken, upload.array('images', 5), validateItem, async (req, res) => {
  try {
    const { id } = req.params;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check ownership
    const existingItem = await db('items')
      .where('id', id)
      .where('user_id', req.user.id)
      .first();

    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found or access denied' });
    }

    const updateData = { ...req.body };
    delete updateData.images; // Handle images separately

    // Handle image uploads if new images provided
    if (req.files && req.files.length > 0) {
      let imageUrls = [];
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(
            `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
            {
              folder: 'swapcircle/items',
              transformation: [
                { width: 800, height: 600, crop: 'limit' },
                { quality: 'auto' }
              ]
            }
          );
          imageUrls.push(result.secure_url);
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
        }
      }
      updateData.images = imageUrls;
    }

    // Update item
    await db('items')
      .where('id', id)
      .update({
        ...updateData,
        updated_at: db.fn.now()
      });

    // Get updated item
    const item = await db('items')
      .select(
        'items.*',
        'users.username',
        'users.first_name',
        'users.last_name',
        'users.avatar_url',
        'users.trust_score',
        'categories.name as category_name'
      )
      .join('users', 'items.user_id', 'users.id')
      .leftJoin('categories', 'items.category_id', 'categories.id')
      .where('items.id', id)
      .first();

    res.json({
      message: 'Item updated successfully',
      item
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete item
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const item = await db('items')
      .where('id', id)
      .where('user_id', req.user.id)
      .first();

    if (!item) {
      return res.status(404).json({ error: 'Item not found or access denied' });
    }

    // Soft delete by marking as unavailable
    await db('items')
      .where('id', id)
      .update({ 
        is_available: false,
        updated_at: db.fn.now()
      });

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Toggle item availability
router.patch('/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const item = await db('items')
      .where('id', id)
      .where('user_id', req.user.id)
      .first();

    if (!item) {
      return res.status(404).json({ error: 'Item not found or access denied' });
    }

    // Toggle availability
    const newStatus = !item.is_available;
    await db('items')
      .where('id', id)
      .update({ 
        is_available: newStatus,
        updated_at: db.fn.now()
      });

    res.json({ 
      message: `Item ${newStatus ? 'made available' : 'made unavailable'}`,
      is_available: newStatus
    });
  } catch (error) {
    console.error('Toggle item error:', error);
    res.status(500).json({ error: 'Failed to toggle item status' });
  }
});

// Upload images for item
router.patch('/:id/images', authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const existingItem = await db('items')
      .where('id', id)
      .where('user_id', req.user.id)
      .first();

    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found or access denied' });
    }

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      let imageUrls = [];
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(
            `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
            {
              folder: 'swapcircle/items',
              transformation: [
                { width: 800, height: 600, crop: 'limit' },
                { quality: 'auto' }
              ]
            }
          );
          imageUrls.push(result.secure_url);
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
        }
      }

      // Update item with new images
      await db('items')
        .where('id', id)
        .update({ 
          images: imageUrls,
          updated_at: db.fn.now()
        });

      // Get updated item
      const item = await db('items')
        .select(
          'items.*',
          'users.username',
          'users.first_name',
          'users.last_name',
          'users.avatar_url',
          'users.trust_score',
          'categories.name as category_name'
        )
        .join('users', 'items.user_id', 'users.id')
        .leftJoin('categories', 'items.category_id', 'categories.id')
        .where('items.id', id)
        .first();

      res.json({
        message: 'Images uploaded successfully',
        item
      });
    } else {
      res.status(400).json({ error: 'No images provided' });
    }
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

module.exports = router;
