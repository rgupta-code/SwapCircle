exports.up = function(knex) {
  return knex.schema.createTable('trades', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('initiator_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.uuid('responder_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.uuid('initiator_item_id').references('id').inTable('items').onDelete('SET NULL');
    table.uuid('responder_item_id').references('id').inTable('items').onDelete('SET NULL');
    table.enum('status', [
      'pending',
      'accepted',
      'in_progress',
      'completed',
      'cancelled',
      'disputed'
    ]).defaultTo('pending').notNullable();
    table.text('initiator_message');
    table.text('responder_message');
    table.decimal('swap_credits', 10, 2).defaultTo(0);
    table.jsonb('meetup_details');
    table.timestamp('accepted_at');
    table.timestamp('completed_at');
    table.timestamp('cancelled_at');
    table.string('cancellation_reason');
    table.uuid('cancelled_by');
    table.boolean('initiator_rated').defaultTo(false);
    table.boolean('responder_rated').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['initiator_id']);
    table.index(['responder_id']);
    table.index(['status']);
    table.index(['created_at']);
    table.index(['initiator_item_id']);
    table.index(['responder_item_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('trades');
};
