import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

export async function POST(request) {
  try {
    const { frameImage } = await request.json();

    if (!frameImage) {
      return NextResponse.json({ error: 'Missing frame image' }, { status: 400 });
    }

    if (!process.env.UPSTASH_REDIS_REST_URL && !process.env.KV_REST_API_URL) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
    }

    // Generate a unique ID for the frame
    const newId = await redis.incr('frame:counter');

    // Store the frame record
    const record = {
      id: newId,
      frameImage,
      createdAt: new Date().toISOString(),
    };

    await redis.set(`frame:${newId}`, JSON.stringify(record));

    return NextResponse.json({ success: true, id: newId });
  } catch (error) {
    console.error('Error creating frame:', error);
    return NextResponse.json(
      { error: 'Failed to save Frame. Please try again.' },
      { status: 500 }
    );
  }
}
