exports.up = function(knex) {
  return knex.schema.createTable('items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.uuid('category_id').references('id').inTable('categories').onDelete('SET NULL');
    table.string('title').notNullable();
    table.text('description').notNullable();
    table.enum('item_type', ['good', 'service']).notNullable();
    table.enum('condition', ['new', 'like_new', 'good', 'fair', 'poor']).notNullable();
    table.jsonb('images').defaultTo('[]');
    table.jsonb('tags').defaultTo('[]');
    table.decimal('estimated_value', 10, 2);
    table.string('currency', 3).defaultTo('USD');
    table.boolean('is_available').defaultTo(true);
    table.boolean('is_featured').defaultTo(false);
    table.boolean('is_verified').defaultTo(false);
    table.integer('view_count').defaultTo(0);
    table.integer('favorite_count').defaultTo(0);
    table.jsonb('location').notNullable(); // {city, state, country, coordinates}
    table.boolean('allows_shipping').defaultTo(false);
    table.boolean('allows_pickup').defaultTo(true);
    table.boolean('allows_meetup').defaultTo(true);
    table.decimal('meetup_radius', 5, 2); // in miles
    table.jsonb('trade_preferences').defaultTo('{}');
    table.timestamp('expires_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes for search and filtering
    table.index(['user_id']);
    table.index(['category_id']);
    table.index(['item_type']);
    table.index(['condition']);
    table.index(['is_available']);
    table.index(['is_featured']);
    table.index(['created_at']);
    table.index(['tags'], 'tags_gin_idx');
    table.index(['location'], 'location_gin_idx');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('items');
};
