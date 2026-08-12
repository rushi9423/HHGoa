import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Validate environment variables first
    if (!process.env.UPSTASH_REDIS_REST_URL && !process.env.KV_REST_API_URL) {
      return NextResponse.json(
        { error: 'Database not connected.' },
        { status: 500 }
      );
    }

    const data = await redis.get(`builder:${id}`);
    
    if (!data) {
      return NextResponse.json({ error: 'Builder not found' }, { status: 404 });
    }

    // Parse the data since it's stored as a JSON string
    const record = typeof data === 'string' ? JSON.parse(data) : data;

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error fetching builder:', error);
    return NextResponse.json({ error: 'Failed to fetch builder details' }, { status: 500 });
  }
}
