exports.up = function(knex) {
  return knex.schema.createTable('swap_credits', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.decimal('balance', 10, 2).defaultTo(0).notNullable();
    table.decimal('total_earned', 10, 2).defaultTo(0).notNullable();
    table.decimal('total_spent', 10, 2).defaultTo(0).notNullable();
    table.timestamp('last_updated').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['user_id']);
    table.index(['balance']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('swap_credits');
};
