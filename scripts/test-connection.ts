import * as dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

async function testConnection() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Testing database connection...');
    const maskedUrl = process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@');
    console.log(`   URL: ${maskedUrl}\n`);

    await client.connect();
    console.log('✅ Connection successful!');

    // Test query
    const result = await client.query('SELECT version()');
    console.log(`📊 PostgreSQL version: ${result.rows[0].version.split(',')[0]}\n`);

    // Check pgvector extension
    const extResult = await client.query(`
      SELECT EXISTS(
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
      ) as exists;
    `);

    if (extResult.rows[0].exists) {
      console.log('✅ pgvector extension is enabled');
    } else {
      console.log('⚠️  pgvector extension not found');
      console.log('   Run in Supabase SQL Editor: CREATE EXTENSION IF NOT EXISTS vector;');
    }

    console.log('\n✅ Database is ready! You can now run:');
    console.log('   pnpm exec prisma db push --accept-data-loss');

    await client.end();
  } catch (error) {
    console.error('❌ Connection failed!\n');
    
    if (error instanceof Error) {
      if (error.message.includes('password authentication')) {
        console.error('🔑 Password authentication failed!');
        console.error('   → Check your password in .env file');
        console.error('   → Reset password in Supabase Dashboard → Settings → Database');
      } else if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
        console.error('🌐 Cannot reach database server!');
        console.error('   → Check if Supabase project is active (not paused)');
        console.error('   → Verify connection string is correct');
        console.error('   → Check network/firewall settings');
      } else {
        console.error('Error:', error.message);
      }
    } else {
      console.error('Unknown error:', error);
    }
    
    process.exit(1);
  }
}

testConnection();




