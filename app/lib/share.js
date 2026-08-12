/**
 * Share utilities for HH Goa 2026 Frame Generator.
 * Handles download, native share, and Twitter/X intent flow.
 */

import { canvasToBlob } from './canvas-renderer';

/**
 * Download the canvas as a PNG file
 */
export function downloadCanvasAsPNG(canvas, format = 'pfp') {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hhgoa-2026-${format}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, 'image/png', 1.0);
}

/**
 * Share to X/Twitter via intent URL
 */
export function shareToTwitter(text, url) {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = url ? encodeURIComponent(url) : '';
  const tweetUrl = url
    ? `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
    : `https://twitter.com/intent/tweet?text=${encodedText}`;
  window.open(tweetUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Native share with file (mobile)
 */
export async function nativeShareWithFile(canvas, captionText) {
  try {
    const blob = await canvasToBlob(canvas);
    const file = new File([blob], 'hhgoa-2026-card.png', { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        text: captionText,
      });
      return true;
    }
  } catch (e) {
    if (e.name === 'AbortError') {
      // User cancelled — not an error
      return false;
    }
    console.warn('Native share failed:', e);
  }
  return false;
}

/**
 * Combined share flow:
 * 1. Try native share (mobile) with image
 * 2. Fall back to Twitter intent URL
 */
export async function shareCard(canvas, handle, format = 'pfp') {
  const handleText = handle ? ` @${handle.replace('@', '')}` : '';
  const captionText = `Building at HH Goa 2026 🏝️${handleText} #FrameInGoa`;

  // Try native share first (mobile)
  const nativeShared = await nativeShareWithFile(canvas, captionText);
  if (nativeShared) return;

  // Fallback: Twitter intent
  shareToTwitter(captionText);
}

/**
 * Generate QR code data URL using the qrcode library
 */
export async function generateQRCode(text) {
  try {
    const QRCode = (await import('qrcode')).default;
    const dataUrl = await QRCode.toDataURL(text, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return dataUrl;
  } catch (e) {
    console.warn('QR generation failed:', e);
    return null;
  }
}
