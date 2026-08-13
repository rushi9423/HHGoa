/**
 * Builder profile page — /builder/[id]
 * Server component with dynamic OG metadata for social previews.
 * The profile UI is rendered by the BuilderProfileClient component.
 */

import { Redis } from '@upstash/redis';
import BuilderProfileClient from './BuilderProfileClient';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

/**
 * Fetch builder record from Redis (server-side)
 */
async function getBuilderRecord(id) {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL && !process.env.KV_REST_API_URL) {
      return null;
    }
    const data = await redis.get(`builder:${id}`);
    if (!data) return null;
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (e) {
    console.error('Error fetching builder for metadata:', e);
    return null;
  }
}

/**
 * Dynamic OG metadata for the builder profile page.
 * X/Twitter crawlers will see this when the /builder/[id] URL is shared.
 */
export async function generateMetadata({ params }) {
  const { id } = await params;
  const record = await getBuilderRecord(id);

  if (!record) {
    return {
      title: 'Builder Not Found — HH Goa 2026',
      description: 'This builder profile could not be found.',
      openGraph: {
        title: 'Builder Not Found — HH Goa 2026',
        description: 'This builder profile could not be found.',
        type: 'website',
        siteName: 'HH Goa 2026',
        images: [{ url: '/og-image.png', width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Builder Not Found — HH Goa 2026',
        description: 'This builder profile could not be found.',
        images: ['/og-image.png'],
      },
    };
  }

  const title = `${record.name} — Hacker House Goa 2026 Builder ${record.formattedId}`;
  const description = `${record.formattedId} · ${record.builderClass} · ${record.role} Builder. ${record.builderTitle || ''} #HackerHouseGoa #HHGoa2026`.trim();

  // Construct absolute base URL for Open Graph images
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
    ? process.env.NEXT_PUBLIC_BASE_URL.replace(/\/+$/, '') 
    : (process.env.VERCEL_PROJECT_PRODUCTION_URL 
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` 
      : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://hhgoa.vercel.app'));

  const imageUrl = record.cardImage 
    ? `${baseUrl}/api/builder-id/${id}/image` 
    : `${baseUrl}/og-image.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'HH Goa 2026',
      images: [{ url: imageUrl, width: record.cardImage ? 540 : 1200, height: record.cardImage ? 675 : 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function BuilderProfilePage({ params }) {
  const { id } = await params;
  return <BuilderProfileClient id={id} />;
}
