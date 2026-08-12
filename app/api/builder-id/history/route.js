import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

/**
 * GET /api/builder-id/history?page=1&limit=20
 * 
 * Returns paginated list of all generated Builder IDs (newest first).
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    // Get total count
    const totalCount = await redis.llen('builder:list');

    // Calculate pagination
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    // Get the IDs for this page
    const ids = await redis.lrange('builder:list', start, end);

    if (!ids || ids.length === 0) {
      return NextResponse.json({
        records: [],
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      });
    }

    // Fetch all records for these IDs in parallel
    const pipeline = redis.pipeline();
    for (const id of ids) {
      pipeline.get(`builder:${id}`);
    }
    const results = await pipeline.exec();

    // Parse records (they're stored as JSON strings)
    const records = results
      .map((result) => {
        if (!result) return null;
        try {
          return typeof result === 'string' ? JSON.parse(result) : result;
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    return NextResponse.json({
      records,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching builder history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history.' },
      { status: 500 }
    );
  }
}
