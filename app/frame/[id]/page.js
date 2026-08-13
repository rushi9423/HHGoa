import { Redis } from '@upstash/redis';
import Link from 'next/link';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

/**
 * Fetch frame record from Redis (server-side)
 */
async function getFrameRecord(id) {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL && !process.env.KV_REST_API_URL) {
      return null;
    }
    const data = await redis.get(`frame:${id}`);
    if (!data) return null;
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (e) {
    console.error('Error fetching frame for metadata:', e);
    return null;
  }
}

/**
 * Dynamic OG metadata for the frame page.
 * X/Twitter crawlers will see this when the /frame/[id] URL is shared.
 */
export async function generateMetadata({ params }) {
  const { id } = await params;
  const record = await getFrameRecord(id);

  if (!record) {
    return {
      title: 'Frame Not Found — HH Goa 2026',
      description: 'This frame could not be found.',
      openGraph: {
        title: 'Frame Not Found — HH Goa 2026',
        description: 'This frame could not be found.',
        type: 'website',
        images: [{ url: '/og-image.png', width: 1200, height: 630 }],
      },
    };
  }

  const title = `My Hacker House Goa 2026 Frame`;
  const description = `Bringing my builder energy to Goa! ⚡ #FrameInGoa #HackerHouseGoa`;

  // Construct absolute base URL for Open Graph images
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
    ? process.env.NEXT_PUBLIC_BASE_URL.replace(/\/+$/, '') 
    : (process.env.VERCEL_PROJECT_PRODUCTION_URL 
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` 
      : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://hhgoa.vercel.app'));

  const imageUrl = `${baseUrl}/api/frame/${id}/image`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'HH Goa 2026',
      images: [{ url: imageUrl, width: 1080, height: 1080, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function FramePage({ params }) {
  const { id } = await params;
  const record = await getFrameRecord(id);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Background Glows */}
      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--hhg-yellow) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--hhg-pink) 0%, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in-up flex flex-col items-center">
        {/* Header Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <h1 className="text-2xl sm:text-3xl tracking-wider"
            style={{ fontFamily: '"Anton", sans-serif', color: 'var(--hhg-cream)' }}>
            HACKER HOUSE
          </h1>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-white text-sm shadow-xl"
            style={{ background: 'var(--hhg-pink)', fontFamily: '"Noto Sans Devanagari", sans-serif', fontWeight: 700 }}>
            गोवा
          </span>
        </div>

        {!record ? (
          <div className="card-glass p-8 text-center" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <p className="text-4xl mb-3">⚠️</p>
            <p className="text-lg mb-2" style={{ fontFamily: '"Anton", sans-serif', color: '#ef4444' }}>
              Error Loading Frame
            </p>
            <p className="text-sm opacity-70" style={{ fontFamily: '"Space Mono", monospace' }}>
              This frame could not be found or has expired.
            </p>
            <Link href="/" className="btn-primary mt-6 inline-flex w-full justify-center">Return Home</Link>
          </div>
        ) : (
          <div className="card-glass overflow-hidden relative p-4 flex flex-col items-center">
            {/* Display the frame image */}
            <img 
              src={`/api/frame/${id}/image`} 
              alt="Hacker House Goa Frame" 
              className="w-full rounded-xl shadow-2xl mb-6"
            />
            
            <h2 className="text-xl sm:text-2xl mb-2 text-center"
              style={{ fontFamily: '"Anton", sans-serif', color: 'var(--hhg-cream)', letterSpacing: '1px' }}>
              Bringing builder energy to Goa! ⚡
            </h2>
            
            <p className="text-sm opacity-70 mb-6 text-center px-4"
              style={{ fontFamily: '"Space Mono", monospace' }}>
              Turn ideas into experiments, projects, and something real.
            </p>

            <Link href="/" className="btn-pink w-full justify-center">
              📸 Create Your Own Frame
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
