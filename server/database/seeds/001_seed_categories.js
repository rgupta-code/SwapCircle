exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('categories').del()
    .then(function () {
      // Inserts seed entries
      return knex('categories').insert([
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Toys & Games',
          slug: 'toys-games',
          description: 'Children\'s toys, board games, puzzles, and entertainment items',
          icon: '🎮',
          color: '#FF6B6B',
          sort_order: 1,
          is_active: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'Books & Media',
          slug: 'books-media',
          description: 'Books, magazines, DVDs, CDs, and other media',
          icon: '📚',
          color: '#4ECDC4',
          sort_order: 2,
          is_active: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          name: 'Electronics',
          slug: 'electronics',
          description: 'Computers, phones, gadgets, and electronic devices',
          icon: '💻',
          color: '#45B7D1',
          sort_order: 3,
          is_active: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440004',
          name: 'Clothing & Fashion',
          slug: 'clothing-fashion',
          description: 'Clothes, shoes, accessories, and fashion items',
          icon: '👕',
          color: '#96CEB4',
          sort_order: 4,
          is_active: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440005',
          name: 'Home & Garden',
          slug: 'home-garden',
          description: 'Furniture, decor, tools, and garden supplies',
          icon: '🏠',
          color: '#FFEAA7',
          sort_order: 5,
          is_active: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440006',
          name: 'Sports & Outdoor',
          slug: 'sports-outdoor',
          description: 'Sports equipment, camping gear, and outdoor activities',
          icon: '⚽',
          color: '#DDA0DD',
          sort_order: 6,
          is_active: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440007',
          name: 'Arts & Crafts',
          slug: 'arts-crafts',
          description: 'Art supplies, handmade items, and creative materials',
          icon: '🎨',
          color: '#FFB6C1',
          sort_order: 7,
          is_active: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440008',
          name: 'Services',
          slug: 'services',
          description: 'Professional services, skills, and expertise',
          icon: '🔧',
          color: '#20B2AA',
          sort_order: 8,
          is_active: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440009',
          name: 'Health & Beauty',
          slug: 'health-beauty',
          description: 'Health products, beauty supplies, and wellness items',
          icon: '💄',
          color: '#FF69B4',
          sort_order: 9,
          is_active: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440010',
          name: 'Food & Beverages',
          slug: 'food-beverages',
          description: 'Homemade food, beverages, and culinary items',
          icon: '🍕',
          color: '#FFA500',
          sort_order: 10,
          is_active: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440011',
          name: 'Automotive',
          slug: 'automotive',
          description: 'Car parts, accessories, and automotive services',
          icon: '🚗',
          color: '#DC143C',
          sort_order: 11,
          is_active: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440012',
          name: 'Collectibles',
          slug: 'collectibles',
          description: 'Antiques, collectibles, and rare items',
          icon: '🏺',
          color: '#8B4513',
          sort_order: 12,
          is_active: true
        }
      ]);
    });
};
