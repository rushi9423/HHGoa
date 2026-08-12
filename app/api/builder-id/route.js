import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// Initialize Redis client from environment variables
// Vercel auto-sets KV_REST_API_URL and KV_REST_API_TOKEN when you connect a KV store
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

/**
 * POST /api/builder-id
 * 
 * Atomically increments the builder counter and stores a new builder record.
 * Returns the new sequential Builder ID.
 * 
 * Body: { name, role, team, handle, builderClass, builderTitle, issuedDate }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, role, team, handle, builderClass, builderTitle, issuedDate } = body;

    // Validate required fields
    if (!name || !role) {
      return NextResponse.json(
        { error: 'Name and Role are required' },
        { status: 400 }
      );
    }

    // Atomically increment the counter
    const newId = await redis.incr('builder:counter');

    // Format the ID as a 4-digit padded number
    const formattedId = `#${String(newId).padStart(4, '0')}`;

    // Build the record
    const record = {
      id: newId,
      formattedId,
      name: name.trim(),
      role: role.trim(),
      team: (team || '').trim(),
      handle: (handle || '').trim(),
      builderClass: builderClass || '',
      builderTitle: builderTitle || '',
      issuedDate: issuedDate || '',
      createdAt: new Date().toISOString(),
    };

    // Store the record as JSON
    await redis.set(`builder:${newId}`, JSON.stringify(record));

    // Push ID to the ordered list (prepend for newest-first)
    await redis.lpush('builder:list', newId);

    return NextResponse.json({ success: true, ...record });
  } catch (error) {
    console.error('Error creating builder ID:', error);
    return NextResponse.json(
      { error: 'Failed to generate Builder ID. Please try again.' },
      { status: 500 }
    );
  }
}
