const { Client } = require('pg');

// RDS connection configuration
const config = {
  host: 'flowfi-instance-1.c7emisyoagxx.ap-southeast-1.rds.amazonaws.com',
  port: 5432,
  user: 'suzarilshah',
  password: 'hackathon1997',
  database: 'flowfi',
  ssl: {
    rejectUnauthorized: false
  }
};

async function verifyConnection() {
  const client = new Client(config);
  
  try {
    console.log('🔍 Verifying RDS database connection...');
    await client.connect();
    console.log('✅ Successfully connected to FlowFi RDS database');
    
    // Test basic query
    const result = await client.query('SELECT current_database(), current_user, version()');
    console.log('📊 Database Info:');
    console.log(`   Database: ${result.rows[0].current_database}`);
    console.log(`   User: ${result.rows[0].current_user}`);
    console.log(`   PostgreSQL Version: ${result.rows[0].version.split(' ')[1]}`);
    
    // Check table counts
    const tables = ['users', 'documents', 'categories', 'audit_logs', 'notifications', 'reports'];
    console.log('\n📋 Table Statistics:');
    
    for (const table of tables) {
      const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`   ${table}: ${countResult.rows[0].count} rows`);
    }
    
    // Check default categories
    const categoriesResult = await client.query('SELECT name, description FROM categories WHERE is_default = true ORDER BY name');
    console.log('\n🏷️  Default Categories:');
    categoriesResult.rows.forEach(cat => {
      console.log(`   - ${cat.name}: ${cat.description}`);
    });
    
    // Check indexes
    const indexesResult = await client.query(`
      SELECT tablename, indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      ORDER BY tablename, indexname
    `);
    console.log(`\n🔑 Total Indexes: ${indexesResult.rows.length}`);
    
    console.log('\n🎉 Database verification completed successfully!');
    console.log('✅ FlowFi database is ready for use');
    
  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifyConnection();