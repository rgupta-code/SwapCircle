exports.up = function(knex) {
  return knex.schema.createTable('credit_transactions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.uuid('trade_id').references('id').inTable('trades').onDelete('SET NULL');
    table.enum('type', ['earned', 'spent', 'bonus', 'penalty', 'refund']).notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.decimal('balance_after', 10, 2).notNullable();
    table.text('description');
    table.jsonb('metadata').defaultTo('{}');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['user_id']);
    table.index(['trade_id']);
    table.index(['type']);
    table.index(['created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('credit_transactions');
};
