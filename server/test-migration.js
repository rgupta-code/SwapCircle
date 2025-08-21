const { db } = require('./config/database');

async function testMigration() {
  try {
    console.log('Testing database connection...');
    
    // Test if trades table exists and has trade_type column
    const hasTradeTypeColumn = await db.schema.hasColumn('trades', 'trade_type');
    console.log('Has trade_type column:', hasTradeTypeColumn);
    
    if (!hasTradeTypeColumn) {
      console.log('Running migration to add trade_type column...');
      
      // Add the trade_type column
      await db.schema.alterTable('trades', (table) => {
        table.enum('trade_type', ['item_trade', 'direct_message', 'swap_credits']).defaultTo('item_trade').notNullable();
      });
      
      console.log('Migration completed successfully!');
    } else {
      console.log('trade_type column already exists.');
    }
    
    // Test inserting a record with trade_type
    const testTrade = await db('trades').insert({
      initiator_id: '00000000-0000-0000-0000-000000000001',
      responder_id: '00000000-0000-0000-0000-000000000002',
      status: 'pending',
      trade_type: 'direct_message'
    }).returning('*');
    
    console.log('Test trade inserted:', testTrade);
    
    // Clean up test data
    await db('trades').where('id', testTrade[0].id).del();
    console.log('Test data cleaned up.');
    
    console.log('All tests passed!');
  } catch (error) {
    console.error('Error during migration test:', error);
  } finally {
    await db.destroy();
  }
}

testMigration();
