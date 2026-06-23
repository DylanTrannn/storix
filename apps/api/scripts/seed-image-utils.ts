import sharp from 'sharp';

const MAX_IMAGE_DIMENSION = 1800;
const JPEG_QUALITY = 82;
const MAX_OUTPUT_BYTES = 1_500_000;

/** Resize/compress source images so Next.js image optimization can serve them reliably. */
export async function optimizeSeedImage(
  buffer: Buffer,
): Promise<{ buffer: Buffer; contentType: string }> {
  let quality = JPEG_QUALITY;

  const resize = () =>
    sharp(buffer)
      .rotate()
      .resize({
        width: MAX_IMAGE_DIMENSION,
        height: MAX_IMAGE_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      });

  let output = await resize().jpeg({ quality, mozjpeg: true }).toBuffer();

  while (output.length > MAX_OUTPUT_BYTES && quality > 50) {
    quality -= 10;
    output = await resize().jpeg({ quality, mozjpeg: true }).toBuffer();
  }

  return { buffer: output, contentType: 'image/jpeg' };
}

export { MAX_OUTPUT_BYTES };
