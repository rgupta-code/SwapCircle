exports.up = function(knex) {
  return knex.schema.createTable('messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('trade_id').references('id').inTable('trades').onDelete('CASCADE').notNullable();
    table.uuid('sender_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.uuid('recipient_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.text('content').notNullable();
    table.jsonb('attachments').defaultTo('[]');
    table.boolean('is_read').defaultTo(false);
    table.timestamp('read_at');
    table.boolean('is_system_message').defaultTo(false);
    table.string('message_type').defaultTo('text'); // text, image, system, trade_update
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['trade_id']);
    table.index(['sender_id']);
    table.index(['recipient_id']);
    table.index(['created_at']);
    table.index(['is_read']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('messages');
};
