const express = require('express');
const OpenAI = require('openai');
const { authenticateToken } = require('../middleware/auth');
const { db } = require('../config/database');

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Get AI-powered trade suggestions for a user
router.get('/suggestions', authenticateToken, async (req, res) => {
  try {
    const { limit = 10, category, itemType } = req.query;

    // Get user's interests and skills
    const user = await db('users')
      .select('interests', 'skills_offered', 'location_city', 'location_state', 'latitude', 'longitude')
      .where('id', req.user.id)
      .first();

    // Get available items that match user's interests
    let query = db('items')
      .select(
        'items.*',
        'users.username',
        'users.first_name',
        'users.last_name',
        'users.avatar_url',
        'users.trust_score',
        'users.interests',
        'users.skills_offered',
        'categories.name as category_name'
      )
      .join('users', 'items.user_id', 'users.id')
      .leftJoin('categories', 'items.category_id', 'categories.id')
      .where('items.is_available', true)
      .where('items.user_id', '!=', req.user.id);

    // Apply filters
    if (category) {
      query = query.where('items.category_id', category);
    }
    if (itemType) {
      query = query.where('items.item_type', itemType);
    }

    // Get items within reasonable distance (if user has location)
    if (user.latitude && user.longitude) {
      // Simple distance calculation (can be improved with PostGIS)
      query = query.whereRaw(`
        ST_Distance(
          ST_MakePoint(?, ?)::geography,
          ST_MakePoint(?, ?)::geography
        ) <= 50000
      `, [user.longitude, user.latitude, 'items.location->coordinates->0', 'items.location->coordinates->1']);
    }

    const items = await query.limit(parseInt(limit));

    // Use AI to score and rank matches
    const scoredItems = await scoreMatchesWithAI(items, user);

    res.json({
      suggestions: scoredItems,
      userInterests: user.interests,
      userSkills: user.skills_offered
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// Get potential trade matches for a specific item
router.get('/item/:itemId', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { limit = 10 } = req.query;

    // Get the target item
    const targetItem = await db('items')
      .select(
        'items.*',
        'users.username',
        'users.first_name',
        'users.last_name',
        'users.avatar_url',
        'users.trust_score',
        'users.interests',
        'users.skills_offered',
        'categories.name as category_name'
      )
      .join('users', 'items.user_id', 'users.id')
      .leftJoin('categories', 'items.category_id', 'categories.id')
      .where('items.id', itemId)
      .first();

    if (!targetItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Get user's items that could be traded
    const userItems = await db('items')
      .select(
        'items.*',
        'categories.name as category_name'
      )
      .leftJoin('categories', 'items.category_id', 'categories.id')
      .where('items.user_id', req.user.id)
      .where('items.is_available', true);

    // Find potential matches
    const matches = await findPotentialMatches(targetItem, userItems, limit);

    res.json({
      targetItem,
      potentialMatches: matches,
      matchScore: matches.length > 0 ? matches[0].matchScore : 0
    });
  } catch (error) {
    console.error('Get item matches error:', error);
    res.status(500).json({ error: 'Failed to get matches' });
  }
});

// Get mutual interest matches
router.get('/mutual', authenticateToken, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // Get users with similar interests
    const user = await db('users')
      .select('interests', 'skills_offered', 'location_city', 'location_state')
      .where('id', req.user.id)
      .first();

    // Find users with overlapping interests
    const similarUsers = await db('users')
      .select(
        'users.id',
        'users.username',
        'users.first_name',
        'users.last_name',
        'users.avatar_url',
        'users.trust_score',
        'users.interests',
        'users.skills_offered',
        'users.location_city',
        'users.location_state'
      )
      .where('users.id', '!=', req.user.id)
      .where('users.is_banned', false)
      .whereRaw('users.interests && ?', [JSON.stringify(user.interests)])
      .limit(parseInt(limit));

    // Get their available items
    const mutualMatches = [];
    for (const similarUser of similarUsers) {
      const items = await db('items')
        .select(
          'items.*',
          'categories.name as category_name'
        )
        .leftJoin('categories', 'items.category_id', 'categories.id')
        .where('items.user_id', similarUser.id)
        .where('items.is_available', true)
        .limit(3);

      if (items.length > 0) {
        mutualMatches.push({
          user: similarUser,
          items,
          interestOverlap: calculateInterestOverlap(user.interests, similarUser.interests)
        });
      }
    }

    // Sort by interest overlap
    mutualMatches.sort((a, b) => b.interestOverlap - a.interestOverlap);

    res.json({
      mutualMatches: mutualMatches.slice(0, parseInt(limit)),
      userInterests: user.interests
    });
  } catch (error) {
    console.error('Get mutual matches error:', error);
    res.status(500).json({ error: 'Failed to get mutual matches' });
  }
});

// Helper function to score matches using AI
async function scoreMatchesWithAI(items, user) {
  try {
    if (!process.env.OPENAI_API_KEY || items.length === 0) {
      // Fallback to simple scoring if no AI
      return items.map(item => ({
        ...item,
        matchScore: calculateSimpleMatchScore(item, user)
      })).sort((a, b) => b.matchScore - a.matchScore);
    }

    // Prepare context for AI
    const userContext = {
      interests: user.interests || [],
      skills: user.skills_offered || [],
      location: `${user.location_city}, ${user.location_state}`
    };

    const itemsContext = items.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category_name,
      tags: item.tags || [],
      condition: item.condition,
      itemType: item.item_type,
      userInterests: item.interests || [],
      userSkills: item.skills_offered || []
    }));

    // Create AI prompt
    const prompt = `
      As a barter matching expert, analyze the compatibility between a user and available items.
      
      User Profile:
      - Interests: ${userContext.interests.join(', ')}
      - Skills: ${userContext.skills.join(', ')}
      - Location: ${userContext.location}
      
      Available Items:
      ${itemsContext.map(item => `
        Item: ${item.title}
        Category: ${item.category}
        Description: ${item.description}
        Tags: ${item.tags.join(', ')}
        Condition: ${item.condition}
        Type: ${item.itemType}
        Owner Interests: ${item.userInterests.join(', ')}
        Owner Skills: ${item.userSkills.join(', ')}
      `).join('\n')}
      
      For each item, provide a match score from 0-100 based on:
      1. Interest alignment (30 points)
      2. Skill complementarity (25 points)
      3. Category relevance (20 points)
      4. Location proximity (15 points)
      5. Item condition and type preference (10 points)
      
      Return only a JSON array with item IDs and scores: [{"id": "uuid", "score": number, "reason": "brief explanation"}]
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const aiResponse = completion.choices[0].message.content;
    const scores = JSON.parse(aiResponse);

    // Merge AI scores with items
    const scoredItems = items.map(item => {
      const scoreData = scores.find(s => s.id === item.id);
      return {
        ...item,
        matchScore: scoreData ? scoreData.score : 0,
        matchReason: scoreData ? scoreData.reason : 'No AI analysis available'
      };
    });

    return scoredItems.sort((a, b) => b.matchScore - a.matchScore);
  } catch (error) {
    console.error('AI scoring error:', error);
    // Fallback to simple scoring
    return items.map(item => ({
      ...item,
      matchScore: calculateSimpleMatchScore(item, user)
    })).sort((a, b) => b.matchScore - a.matchScore);
  }
}

// Helper function to find potential matches for a specific item
async function findPotentialMatches(targetItem, userItems, limit) {
  const matches = [];

  for (const userItem of userItems) {
    const matchScore = calculateItemCompatibility(targetItem, userItem);
    
    if (matchScore > 30) { // Minimum threshold
      matches.push({
        ...userItem,
        matchScore,
        compatibility: {
          categoryMatch: targetItem.category_id === userItem.category_id,
          valueMatch: Math.abs((targetItem.estimated_value || 0) - (userItem.estimated_value || 0)) < 20,
          typeMatch: targetItem.item_type === userItem.item_type,
          conditionMatch: targetItem.condition === userItem.condition
        }
      });
    }
  }

  return matches
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, parseInt(limit));
}

// Helper function to calculate simple match score
function calculateSimpleMatchScore(item, user) {
  let score = 0;
  
  // Interest matching
  if (user.interests && item.tags) {
    const interestMatches = user.interests.filter(interest => 
      item.tags.some(tag => tag.toLowerCase().includes(interest.toLowerCase()))
    );
    score += (interestMatches.length / user.interests.length) * 30;
  }

  // Category relevance
  if (item.category_name) {
    const categoryMatch = user.interests?.some(interest => 
      item.category_name.toLowerCase().includes(interest.toLowerCase())
    );
    if (categoryMatch) score += 20;
  }

  // Location proximity
  if (user.location_city === item.location?.city) score += 15;
  if (user.location_state === item.location?.state) score += 10;

  // Trust score bonus
  score += Math.min(item.trust_score / 10, 10);

  return Math.round(score);
}

// Helper function to calculate item compatibility
function calculateItemCompatibility(item1, item2) {
  let score = 0;

  // Category match
  if (item1.category_id === item2.category_id) score += 25;

  // Value compatibility
  const value1 = item1.estimated_value || 0;
  const value2 = item2.estimated_value || 0;
  if (Math.abs(value1 - value2) < 20) score += 20;
  else if (Math.abs(value1 - value2) < 50) score += 10;

  // Type compatibility
  if (item1.item_type === item2.item_type) score += 20;

  // Condition compatibility
  if (item1.condition === item2.condition) score += 15;

  // Tag overlap
  if (item1.tags && item2.tags) {
    const commonTags = item1.tags.filter(tag => item2.tags.includes(tag));
    score += (commonTags.length / Math.max(item1.tags.length, item2.tags.length)) * 20;
  }

  return Math.round(score);
}

// Helper function to calculate interest overlap
function calculateInterestOverlap(interests1, interests2) {
  if (!interests1 || !interests2) return 0;
  
  const set1 = new Set(interests1.map(i => i.toLowerCase()));
  const set2 = new Set(interests2.map(i => i.toLowerCase()));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size > 0 ? (intersection.size / union.size) * 100 : 0;
}

module.exports = router;
