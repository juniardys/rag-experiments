import { z } from 'zod';

// Base follower range schema
const FollowerRangeSchema = z.object({
  min: z.number().int().min(0).optional(),
  max: z.number().int().min(0).optional(),
});

// KOL Recommendation Input Schema (without intent field)
export const KolRecommendationInputSchema = z.object({
  kol_criteria: z.object({
    follower_range: FollowerRangeSchema.optional(),
    niches: z.array(z.string()).optional(),
  }),
  limit: z.number().int().min(1).max(100).default(10),
});

// Post Analysis Input Schema (without intent field)
export const PostAnalysisInputSchema = z.object({
  filters: z.object({
    kol_id: z.string().uuid().optional(),
    date_range: z
      .object({
        start: z.string().datetime().optional(),
        end: z.string().datetime().optional(),
      })
      .optional(),
    platform: z.enum(['instagram', 'threads', 'reels']).optional(),
  }),
  limit: z.number().int().min(1).max(100).default(10),
});

// Performance Metrics Input Schema (without intent field)
export const PerformanceMetricsInputSchema = z.object({
  scope: z.enum(['kol', 'post', 'overall']),
  filters: z.object({
    kol_ids: z.array(z.string().uuid()).optional(),
    date_range: z
      .object({
        start: z.string().datetime().optional(),
        end: z.string().datetime().optional(),
      })
      .optional(),
    platform: z.enum(['instagram', 'threads', 'reels']).optional(),
  }),
});

// Natural Language Query Input Schema (without intent field)
export const NaturalLanguageQueryInputSchema = z.object({
  query_text: z.string().min(1),
  limit: z.number().int().min(1).max(100).default(10),
  similarity_threshold: z.number().min(0).max(1).default(0.7).optional(),
});

// Type exports
export type KolRecommendationInput = z.infer<typeof KolRecommendationInputSchema>;
export type PostAnalysisInput = z.infer<typeof PostAnalysisInputSchema>;
export type PerformanceMetricsInput = z.infer<typeof PerformanceMetricsInputSchema>;
export type NaturalLanguageQueryInput = z.infer<typeof NaturalLanguageQueryInputSchema>;

