import { textToPOSBase64 } from './converts/text';
import { imageFileToPOSBase64 } from './converts/image';
import { pdfFileToPOSBase64 } from './converts/pdf';

export async function buildPrintData(
  input: { text?: string; file?: File }
): Promise<string> {
  if (input.text) {
    return textToPOSBase64(input.text);
  }

  if (input.file) {
    if (input.file.type.startsWith('image/')) {
      return imageFileToPOSBase64(input.file);
    }

    if (input.file.type === 'application/pdf') {
      return pdfFileToPOSBase64(input.file);
    }

    throw new Error('Unsupported file type');
  }

  throw new Error('Nothing to print');
}
