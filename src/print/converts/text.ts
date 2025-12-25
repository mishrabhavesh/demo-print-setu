import { POSBuilder } from '../posBuilder';
import { uint8ToBase64 } from './utils';

export function textToPOSBase64(text: string): string {
  const builder = new POSBuilder();

  builder
    .reset()
    .align('left')
    .size('normal')
    .text(text)
    .newline(3)
    .cut();

  return uint8ToBase64(builder.getBuffer());
}
