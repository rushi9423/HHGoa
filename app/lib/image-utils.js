/**
 * Image upload and processing utilities.
 * Handles HEIC conversion, downscaling, and format validation.
 */

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_DIMENSION = 2000; // Downscale to max 2000px longest edge
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

/**
 * Validate and process uploaded image file
 * @param {File} file 
 * @returns {Promise<HTMLImageElement>}
 */
export async function processUploadedImage(file) {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size is 20MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`);
  }

  let blob = file;

  // Handle HEIC/HEIF conversion
  const isHeic = file.type === 'image/heic' || file.type === 'image/heif' ||
    file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');

  if (isHeic) {
    try {
      const heic2any = (await import('heic2any')).default;
      const result = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.9,
      });
      blob = Array.isArray(result) ? result[0] : result;
    } catch (e) {
      console.warn('HEIC conversion failed, trying as-is:', e);
      // iOS Safari may auto-convert, so try loading directly
    }
  }

  // Load as Image element
  const img = await loadImageFromBlob(blob);

  // Downscale if needed
  return downscaleImage(img);
}

/**
 * Load an Image element from a Blob/File
 */
function loadImageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image. Please try a different file.'));
    };
    img.src = url;
  });
}

/**
 * Downscale image if it exceeds MAX_DIMENSION
 */
function downscaleImage(img) {
  const { width, height } = img;
  const longest = Math.max(width, height);

  if (longest <= MAX_DIMENSION) return img;

  const scale = MAX_DIMENSION / longest;
  const newW = Math.round(width * scale);
  const newH = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = newW;
  canvas.height = newH;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, newW, newH);

  // Create new Image from downscaled canvas
  const newImg = new Image();
  newImg.src = canvas.toDataURL('image/jpeg', 0.92);

  return new Promise((resolve) => {
    newImg.onload = () => resolve(newImg);
    // Fallback: return original if downscale fails
    newImg.onerror = () => resolve(img);
  });
}

/**
 * Calculate initial cover-fit transform for photo in slot
 */
export function calculateCoverFit(imgWidth, imgHeight, slotWidth, slotHeight) {
  const imgAspect = imgWidth / imgHeight;
  const slotAspect = slotWidth / slotHeight;

  let scale;
  if (imgAspect > slotAspect) {
    // Image is wider — fit by height, will need horizontal adjustment
    scale = slotHeight / imgHeight;
    // Add a bit extra to ensure full cover
    scale *= (slotWidth / (imgWidth * scale)) > 1 ? 1 : 1;
  } else {
    // Image is taller — fit by width
    scale = slotWidth / imgWidth;
  }

  // Ensure it covers the slot fully
  const coveredW = imgWidth * scale;
  const coveredH = imgHeight * scale;
  if (coveredW < slotWidth) scale *= slotWidth / coveredW;
  if (coveredH < slotHeight) scale *= slotHeight / coveredH;

  return {
    scale: Math.max(scale, 1),
    offsetX: 0,
    offsetY: 0,
  };
}
