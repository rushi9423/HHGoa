/**
 * Canvas rendering engine for HH Goa 2026 Frame Generator.
 * Uses a pre-made frame overlay PNG for the PFP Frame.
 * The user's photo is drawn behind the frame, visible through the cutout.
 */

import { BRAND, FRAME_STYLES } from './tokens';

// Polyfill for CanvasRenderingContext2D.roundRect (Safari < 16)
if (typeof window !== 'undefined' && typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii) {
    const r = typeof radii === 'number' ? radii : (Array.isArray(radii) ? radii[0] : 0);
    if (r === 0) { this.rect(x, y, w, h); return; }
    const mr = Math.min(r, w / 2, h / 2);
    this.moveTo(x + mr, y);
    this.arcTo(x + w, y, x + w, y + h, mr);
    this.arcTo(x + w, y + h, x, y + h, mr);
    this.arcTo(x, y + h, x, y, mr);
    this.arcTo(x, y, x + w, y, mr);
  };
}

// ===== Output dimensions =====
export const PFP_SIZE = 1080;        // Square PFP: 1080x1080
export const CARD_WIDTH = 506;
export const CARD_HEIGHT = 729;      // Portrait card: 506x729

// ===== Frame overlay image cache =====
let frameImageCache = {};
let frameImageLoading = {};

/**
 * Load a frame overlay image and cache it.
 * Returns a promise that resolves to the loaded Image element.
 */
function loadFrameImage(src) {
  if (frameImageCache[src]) {
    return Promise.resolve(frameImageCache[src]);
  }
  if (frameImageLoading[src]) {
    return frameImageLoading[src];
  }

  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      frameImageCache[src] = img;
      delete frameImageLoading[src];
      resolve(img);
    };
    img.onerror = (err) => {
      delete frameImageLoading[src];
      reject(err);
    };
    img.src = src;
  });

  frameImageLoading[src] = promise;
  return promise;
}

/**
 * Preload all frame overlay images on module init.
 */
const TEMPLATE_URL = `/card-template-new.png`;
if (typeof window !== 'undefined') {
  // Preload the frame overlays
  loadFrameImage('/frame-goa-palms.png').catch(() => {});
  loadFrameImage(TEMPLATE_URL).catch(() => {});
}

// ===== Processed frame overlay cache =====
// We process the frame image once (making white pixels transparent) and cache it.
let processedFrameCache = null;

/**
 * Process the frame overlay image: replace all white/near-white pixels with transparent.
 * This creates a perfect cutout regardless of exact coordinates.
 */
function processFrameOverlay(frameImg, targetW, targetH) {
  if (processedFrameCache) return processedFrameCache;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = targetW;
  tempCanvas.height = targetH;
  const tempCtx = tempCanvas.getContext('2d');

  // Draw frame scaled to target size
  tempCtx.drawImage(frameImg, 0, 0, targetW, targetH);

  // Get pixel data and make white pixels transparent
  const imageData = tempCtx.getImageData(0, 0, targetW, targetH);
  const data = imageData.data;
  const threshold = 220; // pixels with R,G,B all above this become transparent

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (r > threshold && g > threshold && b > threshold) {
      // Make fully transparent
      data[i + 3] = 0;
    }
  }

  tempCtx.putImageData(imageData, 0, 0);

  // Cache the processed canvas
  processedFrameCache = tempCanvas;
  return tempCanvas;
}

// ===== PFP Frame Renderer =====
export function renderPFPFrame(ctx, canvas, photo, style, photoTransform) {
  const w = PFP_SIZE;
  const h = PFP_SIZE;
  canvas.width = w;
  canvas.height = h;

  const s = FRAME_STYLES.find(f => f.id === style) || FRAME_STYLES[0];

  // 1. Fill background with the style's background color
  ctx.fillStyle = s.bg;
  ctx.fillRect(0, 0, w, h);

  // 2. Draw user's photo to fill the entire canvas (it will be covered by the frame overlay)
  if (photo) {
    const { offsetX = 0, offsetY = 0, scale = 1, rotation = 0 } = photoTransform || {};
    const imgAspect = photo.width / photo.height;

    // Cover the full canvas
    let drawW, drawH;
    if (imgAspect > 1) {
      drawH = h * scale;
      drawW = drawH * imgAspect;
    } else {
      drawW = w * scale;
      drawH = drawW / imgAspect;
    }

    ctx.save();
    // Apply rotation around canvas center + offset
    ctx.translate(w / 2 + offsetX, h / 2 + offsetY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(photo, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }

  // 3. Draw processed frame overlay on top (white areas are now transparent, photo shows through)
  const frameImg = frameImageCache['/frame-goa-palms.png'];
  if (frameImg) {
    const processedFrame = processFrameOverlay(frameImg, w, h);
    ctx.drawImage(processedFrame, 0, 0);
  } else {
    // Frame image not loaded yet — draw a fallback procedural frame
    drawFallbackPFPFrame(ctx, w, h, s);
  }
}

/**
 * Fallback procedural PFP frame (used while frame PNG is loading)
 */
function drawFallbackPFPFrame(ctx, w, h, s) {
  // Simple border around the cutout
  const slot = PFP_CUTOUT;
  ctx.save();
  ctx.strokeStyle = s.frameBorder || '#f5d020';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(slot.x - 2, slot.y - 2, slot.w + 4, slot.h + 4, slot.radius + 2);
  ctx.stroke();
  ctx.restore();

  // Top bar: "2:47 PM STUDIO"
  ctx.save();
  ctx.font = '600 18px "Space Mono", monospace';
  ctx.fillStyle = s.textColor;
  ctx.globalAlpha = 0.7;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(BRAND.event.studio, 30, 25);
  ctx.textAlign = 'right';
  ctx.fillText(BRAND.event.badge, w - 30, 25);
  ctx.restore();

  // HACKER गोवा HOUSE
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 48px "Anton", sans-serif';
  ctx.fillStyle = s.textColor;
  const wordY = 120;
  ctx.fillText('HACKER          HOUSE', w / 2, wordY);
  ctx.fillStyle = '#ec1e6b';
  ctx.beginPath();
  ctx.roundRect(w / 2 - 50, wordY - 20, 100, 40, 20);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px "Noto Sans Devanagari", sans-serif';
  ctx.fillText('गोवा', w / 2, wordY);
  ctx.restore();

  // Event line
  ctx.save();
  ctx.font = '600 14px "Space Mono", monospace';
  ctx.fillStyle = s.textColor;
  ctx.globalAlpha = 0.8;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`${BRAND.event.location}  ·  ${BRAND.event.dates}`, w / 2, 170);
  ctx.restore();

  // #FrameInGoa chip
  ctx.save();
  const chipText = '#FrameInGoa';
  ctx.font = 'bold 20px "Space Mono", monospace';
  const chipMetrics = ctx.measureText(chipText);
  const chipW = chipMetrics.width + 24;
  const chipH = 32;
  const chipX = 40;
  const chipY = h - 60;
  ctx.fillStyle = '#ec1e6b';
  ctx.beginPath();
  ctx.roundRect(chipX, chipY, chipW, chipH, chipH / 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(chipText, chipX + 12, chipY + chipH / 2);
  ctx.restore();
}


// ===== Builder ID Card Renderer (kept mostly as-is) =====

/**
 * Draw text with auto-shrink to fit within maxWidth
 */
function drawFittedText(ctx, text, x, y, maxWidth, font, color, align = 'center', baseline = 'middle') {
  ctx.save();
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;

  const sizeMatch = font.match(/(\d+)px/);
  let fontSize = sizeMatch ? parseInt(sizeMatch[1]) : 24;
  const fontBase = font.replace(/\d+px/, '');

  while (fontSize > 10) {
    ctx.font = `${fontSize}px${fontBase}`;
    const w = ctx.measureText(text).width;
    if (w <= maxWidth) break;
    fontSize -= 1;
  }

  ctx.fillText(text, x, y);
  ctx.restore();
  return fontSize;
}

/**
 * Draw the "#FrameInGoa" pink pill/chip
 */
function drawHashtagChip(ctx, x, y, bgColor) {
  ctx.save();
  const text = '#FrameInGoa';
  ctx.font = 'bold 24px "Space Mono", monospace';
  const metrics = ctx.measureText(text);
  const pw = metrics.width + 30;
  const ph = 36;

  ctx.fillStyle = bgColor || '#ec1e6b';
  ctx.beginPath();
  ctx.roundRect(x - pw / 2, y - ph / 2, pw, ph, ph / 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);

  ctx.restore();
}

/**
 * Draw wavy line accent
 */
function drawWavyLine(ctx, startX, y, width, amplitude, wavelength, color, lineWidth = 2) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(startX, y);
  for (let x = 0; x <= width; x += 2) {
    const yOffset = Math.sin((x / wavelength) * Math.PI * 2) * amplitude;
    ctx.lineTo(startX + x, y + yOffset);
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw frame border with style-specific treatment
 */
function drawFrameBorder(ctx, slot, style, borderWidth = 4) {
  const s = FRAME_STYLES.find(f => f.id === style) || FRAME_STYLES[0];

  ctx.save();
  ctx.strokeStyle = s.frameBorder;
  ctx.lineWidth = borderWidth;

  ctx.beginPath();
  ctx.roundRect(slot.x - 2, slot.y - 2, slot.w + 4, slot.h + 4, 12);
  ctx.stroke();

  // Corner accents
  const cornerLen = 30;
  ctx.lineWidth = borderWidth + 2;
  const corners = [
    [slot.x, slot.y, 1, 1],
    [slot.x + slot.w, slot.y, -1, 1],
    [slot.x, slot.y + slot.h, 1, -1],
    [slot.x + slot.w, slot.y + slot.h, -1, -1],
  ];
  corners.forEach(([cx, cy, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy + dy * cornerLen);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + dx * cornerLen, cy);
    ctx.stroke();
  });

  ctx.restore();
}

/**
 * Draw stylized QR placeholder
 */
function drawQRPlaceholder(ctx, x, y, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.3;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(x, y, size, size);
  ctx.setLineDash([]);

  ctx.globalAlpha = 0.15;
  ctx.fillStyle = color;
  const cellSize = size / 8;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 0 || (r < 3 && c < 3) || (r < 3 && c > 4) || (r > 4 && c < 3)) {
        ctx.fillRect(x + c * cellSize + 1, y + r * cellSize + 1, cellSize - 2, cellSize - 2);
      }
    }
  }
  ctx.restore();
}

function drawShieldIcon(ctx, cx, cy) {
  ctx.save();
  ctx.fillStyle = '#0D3B2E';
  ctx.beginPath();
  ctx.moveTo(cx, cy + 8);
  ctx.lineTo(cx + 6, cy + 4);
  ctx.lineTo(cx + 6, cy - 5);
  ctx.lineTo(cx, cy - 7);
  ctx.lineTo(cx - 6, cy - 5);
  ctx.lineTo(cx - 6, cy + 4);
  ctx.fill();
  ctx.strokeStyle = '#f7e7cf';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 2, cy);
  ctx.lineTo(cx, cy + 2);
  ctx.lineTo(cx + 3, cy - 2);
  ctx.stroke();
  ctx.restore();
}

function drawPeopleIcon(ctx, cx, cy) {
  ctx.save();
  ctx.fillStyle = '#0D3B2E';
  ctx.beginPath();
  ctx.arc(cx - 5, cy - 3, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx - 5, cy + 6, 5, Math.PI, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 4, cy - 1, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 4, cy + 6, 4.5, Math.PI, 0);
  ctx.fill();
  ctx.restore();
}

function drawCalendarIcon(ctx, cx, cy) {
  ctx.save();
  ctx.fillStyle = '#0D3B2E';
  ctx.fillRect(cx - 7, cy - 4, 14, 12);
  ctx.fillStyle = '#f7e7cf';
  ctx.fillRect(cx - 5, cy, 10, 6);
  ctx.fillStyle = '#0D3B2E';
  ctx.fillRect(cx - 4, cy + 2, 2, 2);
  ctx.fillRect(cx, cy + 2, 2, 2);
  ctx.fillRect(cx + 4, cy + 2, 2, 2);
  ctx.fillRect(cx - 4, cy - 6, 2, 4);
  ctx.fillRect(cx + 2, cy - 6, 2, 4);
  ctx.restore();
}

// ===== Builder ID Card Renderer (Redesigned from scratch) =====
export function renderBuilderCard(canvas, photo, photoTransform, fields) {
  const ctx = canvas.getContext('2d');
  const w = 819;
  const h = 1024;
  canvas.width = w;
  canvas.height = h;

  const {
    name = '', role = '', team = '', handle = '',
    builderClass = '', builderTitle = '', builderId = '',
    issuedDate = '', qrDataUrl = null,
  } = fields || {};

  // ── Brand colors ──
  const DARK_GREEN = '#0D3B2E';
  const PINK = '#D7385E';
  const CREAM = '#F7ECE0';
  const CREAM_DARK = '#EDE0D0';
  const GOLD = '#D4A84B';

  // ══════════════════════════════════════════
  // STEP 1: BACKGROUND — cream base + illustration top
  // ══════════════════════════════════════════

  // Fill entire canvas with cream
  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, w, h);

  // Draw the background illustration ONLY in the top portion (~42%)
  const illustrationHeight = Math.round(h * 0.42); // ~430px
  const templateImg = frameImageCache[TEMPLATE_URL];
  if (templateImg) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, illustrationHeight);
    ctx.clip();
    ctx.drawImage(templateImg, 0, 0, w, illustrationHeight);
    ctx.restore();

    // Soft gradient fade from illustration to cream (blend bottom edge)
    const fadeGrad = ctx.createLinearGradient(0, illustrationHeight - 80, 0, illustrationHeight);
    fadeGrad.addColorStop(0, 'rgba(247, 236, 224, 0)');
    fadeGrad.addColorStop(1, CREAM);
    ctx.fillStyle = fadeGrad;
    ctx.fillRect(0, illustrationHeight - 80, w, 80);
  }

  // ══════════════════════════════════════════
  // STEP 2: HEADER BRANDING (drawn on top of illustration)
  // ══════════════════════════════════════════

  // Helper: draw text with a cream-colored shadow for readability over the illustration
  const drawTextWithShadow = (text, x, y) => {
    ctx.save();
    ctx.shadowColor = 'rgba(247, 236, 224, 0.85)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillText(text, x, y);
    ctx.shadowColor = 'transparent';
    ctx.fillText(text, x, y); // Redraw crisp on top
    ctx.restore();
  };

  // Top text: "2:47 PM / STUDIO" — centered above HACKER
  ctx.save();
  ctx.font = '600 16px "Space Mono", monospace';
  ctx.fillStyle = DARK_GREEN;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  drawTextWithShadow('2:47 PM', w / 2, 22);
  drawTextWithShadow('STUDIO', w / 2, 42);

  // Top corner: "HHG 2"
  ctx.textAlign = 'right';
  ctx.font = 'bold 20px "Space Mono", monospace';
  drawTextWithShadow('HHG 2', w - 28, 25);
  ctx.restore();

  // "HACKER" — large bold centered
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = DARK_GREEN;
  ctx.font = '900 88px "Anton", sans-serif';
  drawTextWithShadow('HACKER', w / 2, 72);

  // "गोवा" — Hindi text inside pink rounded rectangle
  const goaY = 165;
  const goaText = 'गोवा';
  ctx.font = 'bold 52px "Noto Sans Devanagari", sans-serif';
  const goaTextWidth = ctx.measureText(goaText).width;
  const pillW = goaTextWidth + 36;
  const pillH = 62;
  const pillX = w / 2 - pillW / 2;

  // Pink pill with subtle shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.12)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = PINK;
  ctx.beginPath();
  ctx.roundRect(pillX, goaY, pillW, pillH, 10);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.fillText(goaText, w / 2, goaY + pillH / 2 + 2);

  // "HOUSE" — large bold centered
  ctx.textBaseline = 'top';
  ctx.fillStyle = DARK_GREEN;
  ctx.font = '900 88px "Anton", sans-serif';
  drawTextWithShadow('HOUSE', w / 2, 236);

  // "★ GOA, INDIA ★" — centered
  ctx.font = 'bold 16px "Space Mono", monospace';
  ctx.fillStyle = DARK_GREEN;
  drawTextWithShadow('★  GOA, INDIA  ★', w / 2, 330);

  // "28 – 31 OCT 2026" — centered
  ctx.fillStyle = PINK;
  ctx.font = '600 16px "Space Mono", monospace';
  drawTextWithShadow('28 – 31 OCT 2026', w / 2, 352);
  ctx.restore();

  // ══════════════════════════════════════════
  // STEP 3: PHOTO SLOT (left side, overlapping illustration-to-cream)
  // ══════════════════════════════════════════

  const photoSlot = { x: 32, y: 400, w: 260, h: 310, radius: 14 };

  // Photo background (shown when no photo is uploaded)
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.15)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#f0e5d6';
  ctx.beginPath();
  ctx.roundRect(photoSlot.x, photoSlot.y, photoSlot.w, photoSlot.h, photoSlot.radius);
  ctx.fill();
  ctx.restore();

  // Golden border
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(photoSlot.x, photoSlot.y, photoSlot.w, photoSlot.h, photoSlot.radius);
  ctx.stroke();
  ctx.restore();

  if (photo) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(photoSlot.x, photoSlot.y, photoSlot.w, photoSlot.h, photoSlot.radius);
    ctx.clip();

    const { offsetX = 0, offsetY = 0, scale = 1, rotation = 0 } = photoTransform || {};
    ctx.translate(photoSlot.x + photoSlot.w / 2, photoSlot.y + photoSlot.h / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    const imgAspect = photo.width / photo.height;
    const slotAspect = photoSlot.w / photoSlot.h;
    let drawW, drawH;
    if (imgAspect > slotAspect) {
      drawH = photoSlot.h * scale;
      drawW = drawH * imgAspect;
    } else {
      drawW = photoSlot.w * scale;
      drawH = drawW / imgAspect;
    }
    ctx.drawImage(photo, -drawW / 2 + offsetX, -drawH / 2 + offsetY, drawW, drawH);
    ctx.restore();

    // Re-draw golden border on top of photo
    ctx.save();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(photoSlot.x, photoSlot.y, photoSlot.w, photoSlot.h, photoSlot.radius);
    ctx.stroke();
    ctx.restore();
  }

  // ══════════════════════════════════════════
  // STEP 4: IDENTITY DETAILS (right side of photo)
  // ══════════════════════════════════════════

  const idX = 320; // right column start
  const idMaxW = w - idX - 30; // max text width

  // Helper: dashed divider line
  const drawDivider = (x, y, length) => {
    ctx.save();
    ctx.strokeStyle = PINK;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + length, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  };

  let curY = 415;

  // "BUILDER ID" label
  ctx.save();
  ctx.font = 'bold 16px "Space Mono", monospace';
  ctx.fillStyle = DARK_GREEN;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('BUILDER ID', idX, curY);
  ctx.restore();

  // "#0247" — large pink ID number
  curY += 20;
  ctx.save();
  ctx.font = '900 48px "Anton", sans-serif';
  ctx.fillStyle = PINK;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(builderId || '#0000', idX, curY);
  ctx.restore();

  curY += 72;
  drawDivider(idX, curY, idMaxW);

  // "NOTORIOUS" — builder class
  curY += 14;
  ctx.save();
  ctx.font = '900 34px "Anton", sans-serif';
  ctx.fillStyle = DARK_GREEN;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText((builderClass || 'BUILDER').toUpperCase(), idX, curY);
  ctx.restore();

  // "CYBERSECURITY BUILDER" — role subtitle
  curY += 40;
  ctx.save();
  ctx.font = 'bold 15px "Space Mono", monospace';
  ctx.fillStyle = PINK;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(role ? `${role.toUpperCase()} BUILDER` : '', idX, curY);
  ctx.restore();

  curY += 28;
  drawDivider(idX, curY, idMaxW);

  // "BUILDER TITLE" label
  curY += 14;
  ctx.save();
  ctx.font = 'bold 15px "Space Mono", monospace';
  ctx.fillStyle = DARK_GREEN;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('BUILDER TITLE', idX, curY);
  ctx.restore();

  // "CHAOS-DRIVEN SECURITY WIZARD" — multi-line builder title
  curY += 20;
  ctx.save();
  ctx.font = '900 26px "Anton", sans-serif';
  ctx.fillStyle = DARK_GREEN;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const titleText = (builderTitle || '').toUpperCase();
  if (titleText) {
    const titleMaxW = idMaxW - 10; // slightly narrower to prevent edge overflow
    const titleWords = titleText.split(' ');
    let line = '';
    for (const word of titleWords) {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > titleMaxW && line.length > 0) {
        ctx.fillText(line.trim(), idX, curY);
        line = word + ' ';
        curY += 30;
      } else {
        line = test;
      }
    }
    ctx.fillText(line.trim(), idX, curY);
    curY += 36;
  }
  ctx.restore();

  // ══════════════════════════════════════════
  // STEP 5: FULL-WIDTH DIVIDER before metadata
  // ══════════════════════════════════════════

  const metaDividerY = Math.max(curY + 10, 740);
  drawDivider(28, metaDividerY, w - 56);

  // ══════════════════════════════════════════
  // STEP 6: METADATA ROW (Stack/Role, Team, Issued)
  // ══════════════════════════════════════════

  const metaY = metaDividerY + 14;
  const col1X = 36;
  const col2X = 290;
  const col3X = 540;

  // ── STACK / ROLE ──
  ctx.save();
  ctx.font = 'bold 13px "Space Mono", monospace';
  ctx.fillStyle = DARK_GREEN;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('STACK / ROLE', col1X, metaY);

  // Shield icon + role text
  ctx.translate(col1X + 5, metaY + 28);
  ctx.scale(1.3, 1.3);
  drawShieldIcon(ctx, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  ctx.font = 'bold 18px "Space Mono", monospace';
  ctx.fillStyle = DARK_GREEN;
  ctx.fillText(role || 'Builder', col1X + 28, metaY + 22);
  ctx.restore();

  // ── TEAM ──
  ctx.save();
  ctx.font = 'bold 13px "Space Mono", monospace';
  ctx.fillStyle = DARK_GREEN;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // People icon
  ctx.translate(col2X + 15, metaY + 8);
  ctx.scale(1.6, 1.6);
  drawPeopleIcon(ctx, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  ctx.fillText('TEAM', col2X, metaY + 38);

  ctx.font = 'bold 16px "Space Mono", monospace';
  if (team) {
    ctx.fillText(team, col2X, metaY + 58);
  } else {
    ctx.globalAlpha = 0.5;
    ctx.fillText('Solo Builder', col2X, metaY + 58);
  }
  ctx.restore();

  // ── ISSUED ──
  ctx.save();
  ctx.font = 'bold 13px "Space Mono", monospace';
  ctx.fillStyle = DARK_GREEN;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Calendar icon
  ctx.translate(col3X + 15, metaY + 8);
  ctx.scale(1.6, 1.6);
  drawCalendarIcon(ctx, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  ctx.fillText('ISSUED', col3X, metaY + 38);

  ctx.font = 'bold 16px "Space Mono", monospace';
  ctx.fillText(issuedDate || '-- --- ----', col3X, metaY + 58);
  ctx.restore();

  // ══════════════════════════════════════════
  // STEP 7: FOOTER (Centered QR Code only)
  // ══════════════════════════════════════════

  const qrSize = 136;
  const qrX = (w - qrSize) / 2;
  const qrY = 875; // Fits perfectly in the bottom margin

  // White QR background
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.08)';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.roundRect(qrX, qrY, qrSize, qrSize, 8);
  ctx.fill();
  ctx.restore();

  if (qrDataUrl) {
    try {
      const qrImg = new Image();
      qrImg.src = qrDataUrl;
      ctx.drawImage(qrImg, qrX + 8, qrY + 8, qrSize - 16, qrSize - 16);
    } catch (e) { /* ignore */ }
  } else {
    // Draw placeholder QR pattern
    drawQRPlaceholder(ctx, qrX + 8, qrY + 8, qrSize - 16, DARK_GREEN);
  }
}

/**
 * Export canvas as PNG blob
 */
export function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/png', 1.0);
  });
}

/**
 * Download canvas as PNG file
 */
export function downloadCanvas(canvas, format = 'pfp') {
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
