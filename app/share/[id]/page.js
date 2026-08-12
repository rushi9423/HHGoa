/**
 * Share page — renders a shared card with OG meta tags for link previews.
 * This is a server component that serves the share page with proper meta tags.
 */

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: 'My HH Goa 2026 Builder ID',
    description: 'Building at HH Goa 2026. #FrameInGoa',
    openGraph: {
      title: 'My HH Goa 2026 Builder ID',
      description: 'Building at HH Goa 2026. #FrameInGoa',
      type: 'website',
      siteName: 'HH Goa 2026',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'My HH Goa 2026 Builder ID',
      description: 'Building at HH Goa 2026. #FrameInGoa',
    },
  };
}

export default async function SharePage({ params }) {
  const { id } = await params;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d3b2e',
      color: '#f6efe0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"Space Mono", monospace',
      padding: '20px',
    }}>
      {/* Header */}
      <p style={{
        fontSize: '11px',
        letterSpacing: '4px',
        textTransform: 'uppercase',
        opacity: 0.5,
        marginBottom: '8px',
      }}>
        2:47 PM STUDIO
      </p>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '4px',
      }}>
        <h1 style={{
          fontFamily: '"Anton", sans-serif',
          fontSize: '36px',
          letterSpacing: '3px',
          margin: 0,
        }}>HACKER</h1>
        <span style={{
          background: '#ec1e6b',
          color: '#fff',
          padding: '4px 12px',
          borderRadius: '999px',
          fontSize: '18px',
          fontWeight: 700,
        }}>गोवा</span>
        <h1 style={{
          fontFamily: '"Anton", sans-serif',
          fontSize: '36px',
          letterSpacing: '3px',
          margin: 0,
        }}>HOUSE</h1>
      </div>

      <p style={{
        fontSize: '12px',
        letterSpacing: '3px',
        color: '#f5d020',
        marginBottom: '30px',
      }}>
        GOA, INDIA  ·  28–31 OCT 2026
      </p>

      {/* Card placeholder */}
      <div style={{
        background: 'rgba(246, 239, 224, 0.06)',
        border: '1px solid rgba(246, 239, 224, 0.15)',
        borderRadius: '16px',
        padding: '40px 30px',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%',
      }}>
        <p style={{
          fontSize: '14px',
          opacity: 0.6,
          marginBottom: '20px',
        }}>
          Share ID: {id}
        </p>
        <p style={{
          fontSize: '18px',
          fontFamily: '"Anton", sans-serif',
          letterSpacing: '2px',
          color: '#f5d020',
          marginBottom: '15px',
        }}>
          BUILDER CARD
        </p>
        <p style={{ fontSize: '12px', opacity: 0.5 }}>
          This card was generated with the HH Goa 2026 Frame Generator
        </p>
      </div>

      {/* CTA */}
      <a
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '30px',
          padding: '14px 28px',
          background: 'linear-gradient(135deg, #f5d020, #f1ab33)',
          color: '#082a20',
          fontFamily: '"Anton", sans-serif',
          fontSize: '16px',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          textDecoration: 'none',
          borderRadius: '12px',
          fontWeight: 700,
        }}
      >
        🏝️ Create Your Own
      </a>

      {/* Pink hashtag pill */}
      <span style={{
        display: 'inline-flex',
        marginTop: '20px',
        padding: '6px 16px',
        background: '#ec1e6b',
        color: '#fff',
        borderRadius: '999px',
        fontSize: '13px',
        fontWeight: 700,
        letterSpacing: '1px',
      }}>
        #FrameInGoa
      </span>
    </div>
  );
}
