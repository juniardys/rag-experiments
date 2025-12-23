import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '../config/config.service';
import { OllamaEmbeddings } from '@langchain/ollama';
import {
  type KolRecommendationInput,
  type PostAnalysisInput,
  type PerformanceMetricsInput,
  type NaturalLanguageQueryInput,
} from '../tools/schemas/tool-input.schemas';

@Injectable()
export class ExecutorService {
  private readonly logger = new Logger(ExecutorService.name);
  private readonly embeddings: OllamaEmbeddings;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.embeddings = new OllamaEmbeddings({
      model: 'mxbai-embed-large',
      baseUrl: 'http://localhost:11434',
    });
  }

  /**
   * Execute KOL recommendation query
   * User scoping: where userId = userId
   */
  public async executeKolRecommendation(
    userId: string,
    input: KolRecommendationInput,
  ) {
    const where: any = {
      userId, // CRITICAL: User scoping at query level
    };

    if (input.kol_criteria.follower_range) {
      const { min, max } = input.kol_criteria.follower_range;
      if (min !== undefined || max !== undefined) {
        where.followers = {};
        if (min !== undefined) where.followers.gte = min;
        if (max !== undefined) where.followers.lte = max;
      }
    }

    if (input.kol_criteria.niches && input.kol_criteria.niches.length > 0) {
      where.niche = {
        in: input.kol_criteria.niches,
      };
    }

    const kols = await this.prisma.kol.findMany({
      where,
      take: input.limit,
      include: {
        _count: {
          select: { posts: true },
        },
      },
      orderBy: {
        followers: 'desc',
      },
    });

    return {
      type: 'kol_recommendation',
      count: kols.length,
      kols: kols.map((kol) => ({
        id: kol.id,
        name: kol.name,
        username: kol.username,
        socialMediaType: kol.socialMediaType,
        niche: kol.niche,
        followers: kol.followers,
        postCount: kol._count.posts,
      })),
    };
  }

  /**
   * Execute post analysis query
   * User scoping: where kol.userId = userId
   */
  public async executePostAnalysis(userId: string, input: PostAnalysisInput) {
    const where: any = {
      kol: {
        userId, // CRITICAL: User scoping through relation
      },
    };

    if (input.filters.kol_id) {
      where.kolId = input.filters.kol_id;
    }

    if (input.filters.platform) {
      where.platform = input.filters.platform;
    }

    if (input.filters.date_range) {
      where.createdAt = {};
      if (input.filters.date_range.start) {
        where.createdAt.gte = new Date(input.filters.date_range.start);
      }
      if (input.filters.date_range.end) {
        where.createdAt.lte = new Date(input.filters.date_range.end);
      }
    }

    const posts = await this.prisma.post.findMany({
      where,
      take: input.limit,
      include: {
        kol: {
          select: {
            id: true,
            name: true,
            username: true,
            niche: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      type: 'post_analysis',
      count: posts.length,
      posts: posts.map((post) => ({
        id: post.id,
        platform: post.platform,
        caption: post.caption,
        hashtags: post.hashtags,
        likes: post.likes,
        comments: post.comments,
        createdAt: post.createdAt,
        kol: post.kol,
      })),
    };
  }

  /**
   * Execute performance metrics query
   * User scoping: where kol.userId = userId
   */
  public async executePerformanceMetrics(
    userId: string,
    input: PerformanceMetricsInput,
  ) {
    const where: any = {
      kol: {
        userId, // CRITICAL: User scoping through relation
      },
    };

    if (input.filters.kol_ids && input.filters.kol_ids.length > 0) {
      where.kolId = {
        in: input.filters.kol_ids,
      };
    }

    if (input.filters.platform) {
      where.platform = input.filters.platform;
    }

    if (input.filters.date_range) {
      where.createdAt = {};
      if (input.filters.date_range.start) {
        where.createdAt.gte = new Date(input.filters.date_range.start);
      }
      if (input.filters.date_range.end) {
        where.createdAt.lte = new Date(input.filters.date_range.end);
      }
    }

    if (input.scope === 'kol') {
      // Aggregate metrics per KOL
      const posts = await this.prisma.post.findMany({
        where,
        include: {
          kol: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      });

      const kolMetrics = posts.reduce((acc, post) => {
        const kolId = post.kolId;
        if (!acc[kolId]) {
          acc[kolId] = {
            kol: post.kol,
            totalPosts: 0,
            totalLikes: 0,
            totalComments: 0,
            avgLikes: 0,
            avgComments: 0,
          };
        }
        acc[kolId].totalPosts++;
        acc[kolId].totalLikes += post.likes;
        acc[kolId].totalComments += post.comments;
        return acc;
      }, {} as Record<string, any>);

      Object.values(kolMetrics).forEach((metrics: any) => {
        metrics.avgLikes = metrics.totalPosts > 0 ? metrics.totalLikes / metrics.totalPosts : 0;
        metrics.avgComments =
          metrics.totalPosts > 0 ? metrics.totalComments / metrics.totalPosts : 0;
      });

      return {
        type: 'performance_metrics',
        scope: 'kol',
        metrics: Object.values(kolMetrics),
      };
    } else {
      // Overall or post-level metrics
      const [totalPosts, aggregated] = await Promise.all([
        this.prisma.post.count({ where }),
        this.prisma.post.aggregate({
          where,
          _sum: {
            likes: true,
            comments: true,
          },
          _avg: {
            likes: true,
            comments: true,
          },
        }),
      ]);

      return {
        type: 'performance_metrics',
        scope: input.scope,
        totalPosts,
        totalLikes: aggregated._sum.likes || 0,
        totalComments: aggregated._sum.comments || 0,
        avgLikes: aggregated._avg.likes || 0,
        avgComments: aggregated._avg.comments || 0,
      };
    }
  }

  /**
   * Execute natural language query using vector similarity search
   * User scoping: where kol.userId = userId
   */
  public async executeNaturalLanguageQuery(
    userId: string,
    input: NaturalLanguageQueryInput,
  ) {
    // Generate embedding for the query text
    const queryEmbedding = await this.embeddings.embedQuery(input.query_text);

    // Convert to PostgreSQL vector format (string representation)
    const embeddingString = `[${queryEmbedding.join(',')}]`;

    // Use raw SQL for vector similarity search (pgvector)
    // CRITICAL: User scoping is enforced in the WHERE clause
    const posts = await this.prisma.$queryRaw<any[]>`
      SELECT 
        p.id,
        p."kolId",
        p.platform,
        p.caption,
        p.hashtags,
        p.transcript,
        p.likes,
        p.comments,
        p."createdAt",
        1 - (p.embedding <=> ${embeddingString}::vector) as similarity
      FROM posts p
      INNER JOIN kols k ON p."kolId" = k.id
      WHERE k."userId"::text = ${userId}
        AND p.embedding IS NOT NULL
        AND (1 - (p.embedding <=> ${embeddingString}::vector)) >= ${input.similarity_threshold || 0.7}
      ORDER BY p.embedding <=> ${embeddingString}::vector
      LIMIT ${input.limit}
    `;

    // Fetch KOL details for each post
    const postsWithKol = await Promise.all(
      posts.map(async (post) => {
        const kol = await this.prisma.kol.findUnique({
          where: { id: post.kolId },
          select: {
            id: true,
            name: true,
            username: true,
            niche: true,
          },
        });

        return {
          id: post.id,
          platform: post.platform,
          caption: post.caption,
          hashtags: post.hashtags,
          transcript: post.transcript,
          likes: post.likes,
          comments: post.comments,
          createdAt: post.createdAt,
          similarity: parseFloat(post.similarity),
          kol,
        };
      }),
    );

    return {
      type: 'natural_language_query',
      query: input.query_text,
      count: postsWithKol.length,
      posts: postsWithKol,
    };
  }
}

