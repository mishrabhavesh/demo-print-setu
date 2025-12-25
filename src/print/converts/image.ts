import { POSBuilder } from '../posBuilder';
import { imageToESCPOS } from '../imageToEscPos';
import { uint8ToBase64 } from './utils';

export async function imageFileToPOSBase64(
  file: File,
  maxWidth = 384 // 58mm printer
): Promise<string> {
  const url = URL.createObjectURL(file);

  try {
    const imageBuffer = await imageToESCPOS(file, 384);
    const builder = new POSBuilder();

    builder
      .reset()
      .align('center')
      .add(imageBuffer)
      .newline(3)
      .cut();

    return uint8ToBase64(builder.getBuffer());
  } finally {
    URL.revokeObjectURL(url);
  }
}
