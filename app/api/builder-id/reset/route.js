import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { password } = body;

    // Check admin password using SHA256 hash (expected password is 'hhgoa2548')
    const expectedHash = 'c45ddd8c9794f0feacbd44adb2c6f4d8d8c97565158e044a129595eb36c1c9a2';
    const providedHash = crypto.createHash('sha256').update(password || '').digest('hex');

    if (providedHash !== expectedHash) {
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
