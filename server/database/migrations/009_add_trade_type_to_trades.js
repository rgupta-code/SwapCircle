exports.up = function(knex) {
  return knex.schema.alterTable('trades', (table) => {
    table.enum('trade_type', ['item_trade', 'direct_message', 'swap_credits']).defaultTo('item_trade').notNullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('trades', (table) => {
    table.dropColumn('trade_type');
  });
};
