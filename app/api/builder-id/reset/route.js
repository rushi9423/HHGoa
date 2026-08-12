import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { password } = body;

    // Check admin password
    if (password !== 'hhgoa2026') {
      return NextResponse.json(
        { error: 'Incorrect Admin Password' },
        { status: 401 }
      );
    }

    // Flush the entire Redis database
    await redis.flushdb();

    return NextResponse.json({ success: true, message: 'Database reset successfully!' });
  } catch (error) {
    console.error('Error resetting database:', error);
    return NextResponse.json(
      { error: 'Failed to reset database.' },
      { status: 500 }
    );
  }
}
