const MAX_DIMENSION = 1400;
const MAX_DATA_URL_LENGTH = 460_000;

export interface ProcessedImageResult {
  dataUrl: string;
  sizeKB: number;
  width: number;
  height: number;
}

export async function compressImageFile(file: File): Promise<ProcessedImageResult> {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('تەنها فایلی وێنە (JPG, PNG, WebP, GIF) قبووڵ دەکرێت.');
  }

  if (file.size > 18 * 1024 * 1024) {
    throw new Error('قەبارەی وێنەکە زۆر گەورەیە. تکایە وێنەیەک لە ١٨ مێگابایت کەمتر هەڵبژێرە.');
  }

  const imageBitmap = await loadFileAsImage(file);
  let targetWidth = imageBitmap.width;
  let targetHeight = imageBitmap.height;

  if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / targetWidth, MAX_DIMENSION / targetHeight);
    targetWidth = Math.round(targetWidth * ratio);
    targetHeight = Math.round(targetHeight * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('نەتوانرا وێنەکە پرۆسێس بکرێت.');
  }

  ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

  // Try WebP first, fall back to JPEG if needed, adapting quality to fit Firestore bounds
  let quality = 0.86;
  let dataUrl = canvas.toDataURL('image/webp', quality);

  if (!dataUrl.startsWith('data:image/webp')) {
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }

  while (dataUrl.length > MAX_DATA_URL_LENGTH && quality > 0.42) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }

  // If still too large (rare high-res noise), scale down dimensions by 25%
  if (dataUrl.length > MAX_DATA_URL_LENGTH) {
    const smallerCanvas = document.createElement('canvas');
    smallerCanvas.width = Math.round(targetWidth * 0.72);
    smallerCanvas.height = Math.round(targetHeight * 0.72);
    const smallCtx = smallerCanvas.getContext('2d');
    if (smallCtx) {
      smallCtx.drawImage(canvas, 0, 0, smallerCanvas.width, smallerCanvas.height);
      dataUrl = smallerCanvas.toDataURL('image/jpeg', 0.75);
      targetWidth = smallerCanvas.width;
      targetHeight = smallerCanvas.height;
    }
  }

  if (dataUrl.length > 520_000) {
    throw new Error('قەبارەی وێنە دوای کەمکردنەوە هێشتا گەورەیە، تکایە وێنەیەکی تر هەڵبژێرە.');
  }

  return {
    dataUrl,
    sizeKB: Math.round((dataUrl.length * 3) / 4 / 1024),
    width: targetWidth,
    height: targetHeight,
  };
}

function loadFileAsImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('فایلی وێنەکە تێکچووە یان ناخوێندرێتەوە.'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('نەتوانرا فایلەکە بخوێندرێتەوە.'));
    reader.readAsDataURL(file);
  });
}

export function formatKurdishDate(timestamp: { toDate?: () => Date } | null | undefined): string {
  if (!timestamp || typeof timestamp.toDate !== 'function') return 'ئێستا';
  try {
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('ku-IQ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(timestamp.toDate());
    } catch {
      return 'ئێستا';
    }
  }
}
