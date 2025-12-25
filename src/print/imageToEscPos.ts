import { Buf } from "./bufferPolyfill";

export const GS = 0x1d;

type ImageInput = File | Blob | ArrayBuffer;

export async function imageToESCPOS(
  input: ImageInput,
  maxWidth = 384 // 58mm printer default
): Promise<Uint8Array> {

  // 1️⃣ Convert input → ImageBitmap (NO NETWORK)
  let bitmap: ImageBitmap;

  if (input instanceof ArrayBuffer) {
    bitmap = await createImageBitmap(new Blob([input]));
  } else {
    bitmap = await createImageBitmap(input);
  }

  // 2️⃣ Resize while keeping aspect ratio
  let width = bitmap.width;
  let height = bitmap.height;

  if (width > maxWidth) {
    const ratio = maxWidth / width;
    width = maxWidth;
    height = Math.floor(height * ratio);
  }

  // 3️⃣ Draw on canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);

  // 4️⃣ Extract pixel data
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  const bytesPerRow = Math.ceil(width / 8);
  const bitmapData: number[] = [];

  // 5️⃣ Convert RGBA → monochrome bitmap
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < bytesPerRow; x++) {
      let byte = 0;

      for (let bit = 0; bit < 8; bit++) {
        const pixelX = x * 8 + bit;
        if (pixelX < width) {
          const idx = (y * width + pixelX) * 4;
          const r = pixels[idx];
          const g = pixels[idx + 1];
          const b = pixels[idx + 2];
          const a = pixels[idx + 3];

          if (a > 128) {
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            if (gray < 128) {
              byte |= (1 << (7 - bit));
            }
          }
        }
      }

      bitmapData.push(byte);
    }
  }

  // 6️⃣ ESC/POS raster header
  const xL = bytesPerRow & 0xff;
  const xH = (bytesPerRow >> 8) & 0xff;
  const yL = height & 0xff;
  const yH = (height >> 8) & 0xff;

  const command = [
    GS, 0x76, 0x30, 0x00,
    xL, xH,
    yL, yH,
    ...bitmapData,
  ];

  return Buf.from(command);
}
