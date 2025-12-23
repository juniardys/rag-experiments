import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkConnection() {
  // Prisma 7 requires DATABASE_URL to be set in environment
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables!');
    console.error('   Please check your .env file');
    console.error('   Make sure it contains: DATABASE_URL="postgresql://..."');
    process.exit(1);
  }

  console.log('🔍 Checking database connection...');
  const dbUrl = process.env.DATABASE_URL;
  const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':****@'); // Hide password
  console.log(`   Database URL: ${maskedUrl}`);

  // Prisma 7 reads DATABASE_URL from environment automatically
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✅ Database connection successful!');

    // Check if vector extension exists
    const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS(
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
      ) as exists;
    `;

    if (result[0]?.exists) {
      console.log('✅ pgvector extension is enabled');
    } else {
      console.log('⚠️  pgvector extension not found');
      console.log('   Run this SQL in Supabase SQL Editor:');
      console.log('   CREATE EXTENSION IF NOT EXISTS vector;');
    }

    // Test query
    const userCount = await prisma.user.count();
    console.log(`📊 Current users in database: ${userCount}`);
    console.log('\n✅ Database is ready! You can now run migrations.');
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('\nPossible issues:');
    console.error('1. Check if DATABASE_URL in .env is correct');
    console.error('2. Make sure password is set (not placeholder like [YOUR-PASSWORD])');
    console.error('3. Check if Supabase project is active (not paused)');
    console.error('4. Verify connection string format:');
    console.error('   postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres');
    console.error('\nError details:');
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkConnection();
