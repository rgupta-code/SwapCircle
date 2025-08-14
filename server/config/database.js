const knex = require('knex');
const config = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const dbConfig = config[environment];

const db = knex(dbConfig);

// Test database connection
const testConnection = async () => {
  try {
    await db.raw('SELECT 1');
    console.log('✅ Database connection established successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

// Graceful shutdown
const closeConnection = async () => {
  try {
    await db.destroy();
    console.log('✅ Database connection closed gracefully');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
};

// Handle process termination
process.on('SIGINT', closeConnection);
process.on('SIGTERM', closeConnection);

module.exports = {
  db,
  testConnection,
  closeConnection,
};
