exports.up = function(knex) {
  return knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').unique().notNullable();
    table.string('username').unique().notNullable();
    table.string('password_hash');
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.text('bio');
    table.string('avatar_url');
    table.string('phone');
    table.boolean('phone_verified').defaultTo(false);
    table.boolean('email_verified').defaultTo(false);
    table.string('location_city');
    table.string('location_state');
    table.string('location_country');
    table.decimal('latitude', 10, 8);
    table.decimal('longitude', 11, 8);
    table.jsonb('interests').defaultTo('[]');
    table.jsonb('skills_offered').defaultTo('[]');
    table.integer('trust_score').defaultTo(50);
    table.integer('total_trades').defaultTo(0);
    table.integer('successful_trades').defaultTo(0);
    table.boolean('is_verified').defaultTo(false);
    table.boolean('is_banned').defaultTo(false);
    table.string('ban_reason');
    table.string('google_id').unique();
    table.string('facebook_id').unique();
    table.timestamp('last_active').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes for performance
    table.index(['email']);
    table.index(['username']);
    table.index(['location_city', 'location_state']);
    table.index(['trust_score']);
    table.index(['created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
