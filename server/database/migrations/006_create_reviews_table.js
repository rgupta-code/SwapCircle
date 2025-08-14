exports.up = function(knex) {
  return knex.schema.createTable('reviews', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('trade_id').references('id').inTable('trades').onDelete('CASCADE').notNullable();
    table.uuid('reviewer_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.uuid('reviewed_user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.integer('rating').notNullable();
    table.text('comment');
    table.jsonb('tags').defaultTo('[]'); // helpful, friendly, punctual, etc.
    table.boolean('is_public').defaultTo(true);
    table.boolean('is_verified').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Ensure one review per user per trade
    table.unique(['trade_id', 'reviewer_id']);
    
    // Indexes
    table.index(['trade_id']);
    table.index(['reviewer_id']);
    table.index(['reviewed_user_id']);
    table.index(['rating']);
    table.index(['created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('reviews');
};
