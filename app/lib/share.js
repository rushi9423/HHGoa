/**
 * Share utilities for HH Goa 2026 Frame Generator.
 * Handles download, native share, and Twitter/X intent flow.
 *
 * TWO INDEPENDENT SHARE FLOWS:
 * - Frame share: uses FRAME_SHARE_CAPTION
 * - Builder ID share: uses BUILDER_ID_SHARE_CAPTION
 */

import { canvasToBlob } from './canvas-renderer';

// ===== Approved captions (do not modify) =====

const FRAME_SHARE_CAPTION = `🌴 Bringing my builder energy to Goa! ⚡

My Hacker House Goa 2026 frame is ready.
Excited to be part of a community where ideas turn into experiments, projects, and something real. 🚀

See you in Goa! 🌊💻

#FrameInGoa #HackerHouseGoa #HHGoa2026`;

const BUILDER_ID_SHARE_CAPTION = `🪪 Officially in builder mode.

Got my Hacker House Goa 2026 Builder ID. Now it's time to turn ideas into something real. 🚀

See you in Goa, builders. 🌴

#HackerHouseGoa #HHGoa2026 #FrameInGoa`;

// ===== Base URL helper =====

/**
 * Get the base URL of the deployed website.
 * Uses NEXT_PUBLIC_BASE_URL env var if set, otherwise falls back to window.location.origin.
 */
function getBaseUrl() {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
}

/**
 * Get the Frame share URL (just the website root).
 */
function getFrameShareUrl() {
  return getBaseUrl();
}

/**
 * Get the Builder ID share URL.
 * @param {string|number} rawId - The raw builder ID number
 */
function getBuilderIdShareUrl(rawId) {
  if (!rawId) return getBaseUrl();
  return `${getBaseUrl()}/builder/${rawId}`;
}

// ===== Download =====

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

// ===== Twitter/X intent =====

/**
 * Share to X/Twitter via intent URL.
 * @param {string} text - The caption text
 * @param {string} [url] - Optional URL to include
 */
function shareToTwitter(text, url) {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = url ? encodeURIComponent(url) : '';
  const tweetUrl = url
    ? `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
    : `https://twitter.com/intent/tweet?text=${encodedText}`;
  window.open(tweetUrl, '_blank', 'noopener,noreferrer');
}

// ===== Native share with file (mobile) =====

/**
 * Native share with file (mobile).
 * @param {HTMLCanvasElement} canvas
 * @param {string} captionText
 * @returns {Promise<boolean>} true if shared successfully
 */
async function nativeShareWithFile(canvas, captionText) {
  try {
    const blob = await canvasToBlob(canvas);
    const file = new File([blob], 'hhgoa-2026.png', { type: 'image/png' });

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

// ===== Flow A: Frame Share =====

/**
 * Share the generated Frame to X.
 * Uses FRAME_SHARE_CAPTION + website URL.
 * Mobile: tries native share with image file attached.
 * Desktop: falls back to X intent URL (text + URL only).
 *
 * @param {HTMLCanvasElement} canvas - The rendered frame canvas
 */
export async function shareFrame(canvas) {
  const shareUrl = getFrameShareUrl();
  const fullCaption = FRAME_SHARE_CAPTION;

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    // Try native share first (mobile — can attach the actual image)
    const nativeShared = await nativeShareWithFile(canvas, `${fullCaption}\n\n${shareUrl}`);
    if (nativeShared) return;
  }

  // Fallback / Desktop: Twitter intent (text + URL, no image attachment possible)
  shareToTwitter(fullCaption, shareUrl);
}

// ===== Flow B: Builder ID Share =====

/**
 * Share the generated Builder ID to X.
 * Uses BUILDER_ID_SHARE_CAPTION + builder share URL.
 * Mobile: tries native share with image file attached.
 * Desktop: falls back to X intent URL (text + URL only).
 *
 * @param {HTMLCanvasElement} canvas - The rendered builder ID canvas
 * @param {string|number} builderRawId - The raw builder ID for the share URL
 */
export async function shareBuilderCard(canvas, builderRawId) {
  const shareUrl = getBuilderIdShareUrl(builderRawId);
  const fullCaption = BUILDER_ID_SHARE_CAPTION;

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    // Try native share first (mobile — can attach the actual image)
    const nativeShared = await nativeShareWithFile(canvas, `${fullCaption}\n\n${shareUrl}`);
    if (nativeShared) return;
  }

  // Fallback / Desktop: Twitter intent (text + URL, no image attachment possible)
  shareToTwitter(fullCaption, shareUrl);
}

// ===== QR Code =====

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
