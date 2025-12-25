import { Buf } from './bufferPolyfill';

export const ESC = 0x1b;
export const GS = 0x1d;

 const POS_COMMANDS = {
  // Initialize and reset
  INITIALIZE: [ESC, 0x40],
  RESET: [ESC, 0x1B, 0x40], // Alternative reset command
  
  // Font weight
  BOLD_ON: [ESC, 0x45, 0x01],
  BOLD_OFF: [ESC, 0x45, 0x00],
  
  // Underline
  UNDERLINE_ON: [ESC, 0x2d, 0x01],
  UNDERLINE_OFF: [ESC, 0x2d, 0x00],
  
  // Italic (if supported by printer)
  ITALIC_ON: [ESC, 0x34],
  ITALIC_OFF: [ESC, 0x35],
  
  // Font size (using GS ! command)
  NORMAL_SIZE: [GS, 0x21, 0x00], // Normal width and height
  DOUBLE_HEIGHT: [GS, 0x21, 0x01], // Double height
  DOUBLE_WIDTH: [GS, 0x21, 0x10], // Double width
  DOUBLE_SIZE: [GS, 0x21, 0x11], // Double width and height
  
  // Alternative font size commands (ESC ! - more widely supported)
  FONT_SMALL: [ESC, 0x21, 0x00], // Normal
  FONT_MEDIUM: [ESC, 0x21, 0x10], // Double width
  FONT_LARGE: [ESC, 0x21, 0x01], // Double height
  FONT_XLARGE: [ESC, 0x21, 0x11], // Double width and height
  
  // Alignment
  ALIGN_LEFT: [ESC, 0x61, 0x00],
  ALIGN_CENTER: [ESC, 0x61, 0x01],
  ALIGN_RIGHT: [ESC, 0x61, 0x02],
  
  // Line spacing
  LINE_SPACING_DEFAULT: [ESC, 0x32],
  LINE_SPACING_TIGHT: [ESC, 0x33, 0x20],
  LINE_SPACING_LOOSE: [ESC, 0x33, 0x40],
  SET_LINE_SPACING: (n) => [ESC, 0x33, n], // Custom line spacing
  
  // Character spacing
  CHAR_SPACING_DEFAULT: [ESC, 0x20, 0x00],
  CHAR_SPACING_TIGHT: [ESC, 0x20, 0xF8], // -8 units
  CHAR_SPACING_WIDE: [ESC, 0x20, 0x08], // +8 units
  
  // Paper feed
  NEWLINE: [0x0A],
  FEED_LINE: (lines = 1) => [ESC, 0x64, lines], // Feed n lines
  FEED_PAPER: [ESC, 0x4A, 0x40], // Feed paper
  
  // Cut commands
  FEED_AND_CUT: [ESC, 0x64, 0x03, GS, 0x56, 0x00], // Feed 3 lines and full cut
  FEED_AND_PARTIAL_CUT: [ESC, 0x64, 0x03, GS, 0x56, 0x01], // Feed 3 lines and partial cut
  FULL_CUT: [GS, 0x56, 0x00],
  PARTIAL_CUT: [GS, 0x56, 0x01],
  
  // Beeper (optional - for customer notification)
  BEEP: [ESC, 0x42, 0x01, 0x01], // Beep once for 100ms
  
  // Drawer control (if you have cash drawer)
  OPEN_DRAWER: [ESC, 0x70, 0x00, 0x60, 0x78], // Pulse pin 0 for 60ms, 120ms off
  
  // Barcode commands (if needed)
  BARCODE_HEIGHT: (height = 50) => [GS, 0x68, height],
  BARCODE_WIDTH: (width = 2) => [GS, 0x77, width],
  PRINT_BARCODE: (data) => [GS, 0x6B, 0x04, ...data, 0x00], // CODE39 barcode
  
  // Reverse printing (white on black)
  REVERSE_ON: [GS, 0x42, 0x01],
  REVERSE_OFF: [GS, 0x42, 0x00],
  
  // 90° rotated printing (if supported)
  ROTATE_ON: [ESC, 0x56, 0x01],
  ROTATE_OFF: [ESC, 0x56, 0x00],
  
  // QR Code (if supported)
  QR_CODE_SIZE: (size = 3) => [GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, size],
  QR_CODE_ERROR_CORRECTION: (level = 2) => [GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, level],
  PRINT_QR_CODE: (data) => [GS, 0x28, 0x6B, data.length + 3, 0x00, 0x31, 0x50, 0x30, ...data],
  
  // Print density (if needed)
  DARK_PRINT: [ESC, 0x47, 0x01],
  LIGHT_PRINT: [ESC, 0x47, 0x00],
};
export class POSBuilder {
  constructor() {
    this.buffer = Buf.from([]);
  }

  add(data) {
    if (Buf.isBuffer(data) || data instanceof Uint8Array) {
      this.buffer = Buf.concat([this.buffer, data]);
    } else if (Array.isArray(data)) {
      this.buffer = Buf.concat([this.buffer, Buf.from(data)]);
    } else {
      this.buffer = Buf.concat([this.buffer, Buf.from(String(data))]);
    }
    return this;
  }

  text(str) {
    return this.add(str);
  }

  newline(count = 1) {
    for (let i = 0; i < count; i++) {
      this.add(POS_COMMANDS.NEWLINE);
    }
    return this;
  }

  bold(enable = true) {
    return this.add(enable ? POS_COMMANDS.BOLD_ON : POS_COMMANDS.BOLD_OFF);
  }

  underline(enable = true) {
    return this.add(enable ? POS_COMMANDS.UNDERLINE_ON : POS_COMMANDS.UNDERLINE_OFF);
  }

  italic(enable = true) {
    // Check if printer supports italic commands
    try {
      return this.add(enable ? POS_COMMANDS.ITALIC_ON : POS_COMMANDS.ITALIC_OFF);
    } catch (e) {
      // Fallback to using normal text if italic not supported
      console.warn('Italic command not supported by printer');
      return this;
    }
  }

  size(type = 'normal') {
    const sizes = {
      normal: POS_COMMANDS.NORMAL_SIZE,
      small: POS_COMMANDS.FONT_SMALL,
      medium: POS_COMMANDS.FONT_MEDIUM,
      large: POS_COMMANDS.FONT_LARGE,
      xlarge: POS_COMMANDS.FONT_XLARGE,
      doubleHeight: POS_COMMANDS.DOUBLE_HEIGHT,
      doubleWidth: POS_COMMANDS.DOUBLE_WIDTH,
      double: POS_COMMANDS.DOUBLE_SIZE,
      triple: POS_COMMANDS.TRIPLE_SIZE
    };
    return this.add(sizes[type] || POS_COMMANDS.NORMAL_SIZE);
  }

  align(position = 'left') {
    const alignments = {
      left: POS_COMMANDS.ALIGN_LEFT,
      center: POS_COMMANDS.ALIGN_CENTER,
      right: POS_COMMANDS.ALIGN_RIGHT
    };
    return this.add(alignments[position] || POS_COMMANDS.ALIGN_LEFT);
  }

  lineSpacing(spacing = 'default') {
    const spacings = {
      default: POS_COMMANDS.LINE_SPACING_DEFAULT,
      tight: POS_COMMANDS.LINE_SPACING_TIGHT,
      loose: POS_COMMANDS.LINE_SPACING_LOOSE
    };

    if (spacings[spacing]) {
      return this.add(spacings[spacing]);
    } else if (typeof spacing === 'number' && spacing >= 0 && spacing <= 255) {
      return this.add([0x1B, 0x33, spacing]);
    }
    return this;
  }

  charSpacing(spacing = 'default') {
    const spacings = {
      default: POS_COMMANDS.CHAR_SPACING_DEFAULT,
      tight: POS_COMMANDS.CHAR_SPACING_TIGHT,
      wide: POS_COMMANDS.CHAR_SPACING_WIDE
    };
    return this.add(spacings[spacing] || POS_COMMANDS.CHAR_SPACING_DEFAULT);
  }

  separator(maxWidth, char = '-') {
    return this.text(char.repeat(maxWidth)).newline();
  }

  doubleSeparator(maxWidth) {
    return this.text('='.repeat(maxWidth)).newline();
  }

  dottedSeparator(maxWidth) {
    return this.text('.'.repeat(maxWidth)).newline();
  }

  thickSeparator(maxWidth) {
    return this.text('█'.repeat(maxWidth)).newline();
  }

  // Professional line types
  line(type = 'single', maxWidth) {
    const lines = {
      single: '-',
      double: '=',
      dotted: '.',
      thick: '█',
      wave: '~',
      star: '*'
    };

    const char = lines[type] || '-';
    return this.text(char.repeat(maxWidth)).newline();
  }

  // Center text with automatic calculation
  centerText(text, maxWidth) {
    const currentAlign = this.align('center');
    const centeredText = this.text(text).newline();
    return this;
  }

  // Right align text
  rightText(text, maxWidth) {
    const currentAlign = this.align('right');
    const rightText = this.text(text).newline();
    return this;
  }

  // Create a formatted line with label and value
  formattedLine(label, value, maxWidth, padChar = ' ', boldLabel = false, boldValue = false) {
    const labelWidth = Math.floor(maxWidth * 0.6);
    const valueWidth = maxWidth - labelWidth;

    if (boldLabel) this.bold(true);
    this.text(label.slice(0, labelWidth - 1).padEnd(labelWidth - 1, padChar) + ' ');
    if (boldLabel) this.bold(false);

    if (boldValue) this.bold(true);
    this.align('right');
    this.text(String(value).padStart(valueWidth));
    this.align('left');
    if (boldValue) this.bold(false);

    return this.newline();
  }

  // Create two column layout
  twoColumns(leftText, rightText, maxWidth, leftWidth = null) {
    const leftColWidth = leftWidth || Math.floor(maxWidth * 0.6);
    const rightColWidth = maxWidth - leftColWidth;

    this.text(leftText.slice(0, leftColWidth).padEnd(leftColWidth));
    this.align('right');
    this.text(rightText.slice(0, rightColWidth));
    this.align('left');

    return this.newline();
  }

  // Header section
  header(title, maxWidth, size = 'double') {
    return this.align('center')
      .size(size)
      .bold(true)
      .text(title.toUpperCase())
      .newline()
      .size('normal')
      .bold(false)
      .line('double', maxWidth);
  }

  // Subheader section
  subheader(title, maxWidth) {
    return this.align('center')
      .size('doubleHeight')
      .bold(true)
      .text(title)
      .newline()
      .size('normal')
      .bold(false)
      .line('single', maxWidth);
  }

  // Add image with proper alignment
  addImage(imageData) {
    return this.add(imageData);
  }

  // Feed paper
  feed(lines = 1) {
    if (lines === 1) {
      return this.newline();
    } else {
      // Use custom feed command if available
      try {
        return this.add(POS_COMMANDS.FEED_LINE(lines));
      } catch (e) {
        // Fallback to multiple newlines
        return this.newline(lines);
      }
    }
  }

  // Beep (for customer notification)
  beep() {
    try {
      return this.add(POS_COMMANDS.BEEP);
    } catch (e) {
      console.warn('Beep command not supported');
      return this;
    }
  }

  // Open cash drawer (if available)
  openDrawer() {
    try {
      return this.add(POS_COMMANDS.OPEN_DRAWER);
    } catch (e) {
      console.warn('Drawer command not supported');
      return this;
    }
  }

  // Cut paper
  cut(type = 'full') {
    const cuts = {
      full: POS_COMMANDS.FULL_CUT,
      partial: POS_COMMANDS.PARTIAL_CUT,
      feedAndCut: POS_COMMANDS.FEED_AND_CUT
    };

    if (cuts[type]) {
      return this.add(cuts[type]);
    }
    return this;
  }

  // QR Code printing (if supported)
  qrCode(data, size = 6, errorCorrection = 'M') {
    try {
      // Convert error correction level
      const ecLevels = { 'L': 0, 'M': 1, 'Q': 2, 'H': 3 };
      const ecValue = ecLevels[errorCorrection] || 1;

      // Method 1: Standard ESC/POS QR code (most reliable)
      this.add([0x1B, 0x61, 0x01]); // Center alignment

      // QR Code: Select Model
      this.add([0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]); // Model 2

      // Set QR Code size
      const qrSize = Math.min(Math.max(size, 1), 16); // Size between 1-16
      this.add([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, qrSize]);

      // Set error correction
      this.add([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, ecValue + 48]);

      // Store data
      const dataBytes = Array.from(data, c => c.charCodeAt(0));
      const len = dataBytes.length + 3;
      const pL = len % 256;
      const pH = Math.floor(len / 256);

      const header = [0x1D, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30];
      const qrStoreBlock = Buf.concat([Buf.from(header), Buf.from(dataBytes)]);
      this.add(qrStoreBlock);

      // Print QR Code
      this.add([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30]);

      this.add([0x1B, 0x61, 0x00]); // Reset to left alignment

      return this.newline();
    } catch (e) {
      console.warn('QR Code printing failed, falling back to text:', e);
      // Fallback: Show text instead
      return this.align('center')
        .text(`QR: ${data.substring(0, 30)}${data.length > 30 ? '...' : ''}`)
        .newline();
    }
  }

  // Reset printer to default state
  reset() {
    try {
      return this.add(POS_COMMANDS.RESET);
    } catch (e) {
      return this.add(POS_COMMANDS.INITIALIZE);
    }
  }

  getBuffer() {
    return this.buffer;
  }

  // Helper to get current buffer size
  getSize() {
    return this.buffer.length;
  }

  // Clear buffer (useful for reusing builder)
  clear() {
    this.buffer = Buf.from([]);
    return this;
  }

  upiQR(upiId, amount, name = "") {
    let qrData = `upi://pay?pa=${encodeURIComponent(upiId)}`;

    if (amount) {
      qrData += `&am=${amount}`;
    }

    if (name) {
      qrData += `&pn=${encodeURIComponent(name)}`;
    }

    qrData += '&cu=INR';

    return this.align('center')
      .text("Scan to Pay")
      .newline()
      .qrCode(qrData, 6, 'H')
      .newline();
  }

}