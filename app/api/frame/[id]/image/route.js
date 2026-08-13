import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    if (!process.env.UPSTASH_REDIS_REST_URL && !process.env.KV_REST_API_URL) {
      return new NextResponse('Database not connected', { status: 500 });
    }

    const data = await redis.get(`frame:${id}`);
    if (!data) return new NextResponse('Not found', { status: 404 });
    
    const record = typeof data === 'string' ? JSON.parse(data) : data;
    if (!record.frameImage) return new NextResponse('No image found', { status: 404 });

    // Extract base64 part
    const base64Data = record.frameImage.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error fetching frame image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
