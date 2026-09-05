/**
 * Client-side image handling.
 *
 * Uploaded photos are resized and re-encoded in the browser before they are
 * stored. Without this, one 4 MB phone photo fills the whole LocalStorage
 * quota and the admin panel starts throwing save errors.
 */

const MAX_EDGE = 1400;
const THUMB_EDGE = 400;

/** Prefer WebP where the browser can encode it. */
function bestType() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  return canvas.toDataURL('image/webp').startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg';
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file is not an image we can read.')); };
    img.src = url;
  });
}

function draw(img, maxEdge, type, quality) {
  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL(type, quality);
}

/**
 * @returns {Promise<{image:string, thumbnail:string, bytes:number}>} data URIs
 */
export async function compressImage(file, { maxEdge = MAX_EDGE, quality = 0.82 } = {}) {
  if (!file.type.startsWith('image/')) throw new Error('Pick an image file.');
  const img = await loadImage(file);
  const type = bestType();
  const image = draw(img, maxEdge, type, quality);
  const thumbnail = draw(img, THUMB_EDGE, type, 0.72);
  return { image, thumbnail, bytes: Math.round((image.length * 3) / 4) };
}

export const readableSize = (bytes) =>
  bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;

/** Trigger a browser download for any text or data URI. */
export function download(filename, content, mime = 'application/json') {
  const href = content.startsWith('data:')
    ? content
    : URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  if (!content.startsWith('data:')) setTimeout(() => URL.revokeObjectURL(href), 1000);
}
