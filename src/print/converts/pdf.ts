import * as pdfjs from 'pdfjs-dist';
import { POSBuilder } from '../posBuilder';
import { uint8ToBase64 } from './utils';
import { imageToESCPOS } from '../imageToEscPos';

pdfjs.GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export async function pdfFileToPOSBase64(
  file: File,
  maxWidth = 384
): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;

  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: ctx, viewport }).promise;

  const imageUrl = canvas.toDataURL('image/png');
  const escposImage = await imageToESCPOS(imageUrl, maxWidth);

  const builder = new POSBuilder();
  builder
    .reset()
    .align('center')
    .add(escposImage)
    .newline(3)
    .cut();

  return uint8ToBase64(builder.getBuffer());
}
