#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// RDS connection details from user input
const RDS_CONFIG = {
  host: 'flowfi-instance-1.c7emisyoagxx.ap-southeast-1.rds.amazonaws.com',
  port: 5432,
  user: 'suzarilshah',
  password: 'hackathon1997',
  database: 'postgres' // Connect to default database first
};

async function initializeDatabase() {
  let client;
  
  try {
    console.log('🔌 Connecting to RDS PostgreSQL instance...');
    
    // Connect to the default postgres database first
    client = new Client(RDS_CONFIG);
    await client.connect();
    
    console.log('✅ Connected to RDS PostgreSQL instance');
    
    // Check if flowfi database exists
    const dbCheckResult = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'flowfi'"
    );
    
    if (dbCheckResult.rows.length === 0) {
      console.log('📊 Creating flowfi database...');
      await client.query('CREATE DATABASE flowfi');
      console.log('✅ Flowfi database created');
    } else {
      console.log('📊 Flowfi database already exists');
    }
    
    // Disconnect from postgres database
    await client.end();
    
    // Connect to flowfi database
    console.log('🔌 Connecting to flowfi database...');
    const flowFiClient = new Client({
      ...RDS_CONFIG,
      database: 'flowfi'
    });
    
    await flowFiClient.connect();
    console.log('✅ Connected to flowfi database');
    
    // Read and execute the initialization SQL
    console.log('📜 Reading initialization SQL script...');
    const initSQLPath = path.join(__dirname, 'flowfi-init-postgresql.sql');
    const initSQL = fs.readFileSync(initSQLPath, 'utf8');
    
    console.log('🚀 Executing database initialization...');
    
    // Execute the entire SQL script as a single transaction
    try {
      await flowFiClient.query('BEGIN');
      await flowFiClient.query(initSQL);
      await flowFiClient.query('COMMIT');
      console.log('✅ Database initialization completed successfully!');
    } catch (error) {
      await flowFiClient.query('ROLLBACK');
      throw error;
    }
    
    // Verify the setup by checking tables
    console.log('🔍 Verifying database setup...');
    const tablesResult = await flowFiClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('📋 Created tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check if default categories were inserted
    const categoriesResult = await flowFiClient.query('SELECT COUNT(*) as count FROM categories');
    console.log(`📊 Default categories count: ${categoriesResult.rows[0].count}`);
    
    // Check indexes
    const indexesResult = await flowFiClient.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    
    console.log('🔑 Created indexes:');
    indexesResult.rows.forEach(row => {
      console.log(`  - ${row.indexname} on ${row.tablename}`);
    });
    
    await flowFiClient.end();
    
    console.log('\n🎉 Database initialization successful!');
    console.log('📊 Database: flowfi');
    console.log('🏠 Host: flowfi-instance-1.c7emisyoagxx.ap-southeast-1.rds.amazonaws.com');
    console.log('👤 User: suzarilshah');
    console.log('🔒 Port: 5432');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run the initialization
if (require.main === module) {
  initializeDatabase().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { initializeDatabase };