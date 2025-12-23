import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/client';
import { OllamaEmbeddings } from '@langchain/ollama';

import 'dotenv/config';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

async function main() {
  console.log('Starting seed...');

  // Create users
  const user1 = await prisma.user.upsert({
    where: { email: 'user1@example.com' },
    update: {},
    create: {
      email: 'user1@example.com',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'user2@example.com' },
    update: {},
    create: {
      email: 'user2@example.com',
    },
  });

  console.log('Created users:', { user1: user1.id, user2: user2.id });

  // Create KOLs for user1
  const kol1 = await prisma.kol.upsert({
    where: { id: 'kol-1-user1' },
    update: {},
    create: {
      id: 'kol-1-user1',
      userId: user1.id,
      name: 'Fashion Influencer',
      username: 'fashionista123',
      socialMediaType: 'instagram',
      niche: 'fashion',
      followers: 150000,
    },
  });

  const kol2 = await prisma.kol.upsert({
    where: { id: 'kol-2-user1' },
    update: {},
    create: {
      id: 'kol-2-user1',
      userId: user1.id,
      name: 'Tech Reviewer',
      username: 'techguru',
      socialMediaType: 'threads',
      niche: 'tech',
      followers: 250000,
    },
  });

  // Create KOLs for user2 (demonstrating multi-tenant isolation)
  const kol3 = await prisma.kol.upsert({
    where: { id: 'kol-1-user2' },
    update: {},
    create: {
      id: 'kol-1-user2',
      userId: user2.id,
      name: 'Food Blogger',
      username: 'foodie_life',
      socialMediaType: 'instagram',
      niche: 'food',
      followers: 80000,
    },
  });

  console.log('Created KOLs');

  // Generate embeddings for sample posts using Ollama
  let embeddings: OllamaEmbeddings | null = null;
  try {
    embeddings = new OllamaEmbeddings({
      model: 'mxbai-embed-large',
      baseUrl: 'http://localhost:11434',
    });
  } catch (error) {
    console.warn('Could not initialize embeddings, posts will be created without embeddings');
  }

  // Create posts for user1's KOLs
  const post1Content = 'Check out my latest fashion haul! #fashion #ootd #style';
  const post1Embedding = embeddings
    ? await embeddings.embedQuery(post1Content)
    : null;

  await prisma.post.upsert({
    where: { id: 'post-1-kol1' },
    update: {},
    create: {
      id: 'post-1-kol1',
      kolId: kol1.id,
      platform: 'instagram',
      caption: post1Content,
      hashtags: ['fashion', 'ootd', 'style'],
      likes: 5000,
      comments: 120,
      // Embedding will be set via raw SQL after creation
    },
  });

  const post2Content = 'Reviewing the latest smartphone features';
  const post2Embedding = embeddings
    ? await embeddings.embedQuery(post2Content)
    : null;

  await prisma.post.upsert({
    where: { id: 'post-1-kol2' },
    update: {},
    create: {
      id: 'post-1-kol2',
      kolId: kol2.id,
      platform: 'threads',
      caption: post2Content,
      hashtags: ['tech', 'review'],
      transcript: 'In this video, I review the latest smartphone...',
      likes: 8000,
      comments: 250,
      // Embedding will be set via raw SQL after creation
    },
  });

  // Create posts for user2's KOL (demonstrating isolation)
  const post3Content = 'Amazing pasta recipe! #food #cooking #recipe';
  const post3Embedding = embeddings
    ? await embeddings.embedQuery(post3Content)
    : null;

  await prisma.post.upsert({
    where: { id: 'post-1-kol3' },
    update: {},
    create: {
      id: 'post-1-kol3',
      kolId: kol3.id,
      platform: 'instagram',
      caption: post3Content,
      hashtags: ['food', 'cooking', 'recipe'],
      likes: 3000,
      comments: 80,
      // Embedding will be set via raw SQL after creation
    },
  });

  console.log('Created posts');

  // Update embeddings using raw SQL (pgvector requires raw SQL for vector operations)
  if (post1Embedding) {
    await prisma.$executeRaw`
      UPDATE posts SET embedding = ${`[${post1Embedding.join(',')}]`}::vector WHERE id = ${'post-1-kol1'}
    `;
  }
  if (post2Embedding) {
    await prisma.$executeRaw`
      UPDATE posts SET embedding = ${`[${post2Embedding.join(',')}]`}::vector WHERE id = ${'post-1-kol2'}
    `;
  }
  if (post3Embedding) {
    await prisma.$executeRaw`
      UPDATE posts SET embedding = ${`[${post3Embedding.join(',')}]`}::vector WHERE id = ${'post-1-kol3'}
    `;
  }

  console.log('Updated embeddings');
  console.log('Seed completed successfully!');
  console.log('\nMulti-tenant isolation test:');
  console.log(`- User 1 (${user1.id}) has 2 KOLs`);
  console.log(`- User 2 (${user2.id}) has 1 KOL`);
  console.log('\nYou can test user scoping by querying with different userIds');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

