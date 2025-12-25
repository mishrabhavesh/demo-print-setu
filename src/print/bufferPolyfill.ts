// Buffer polyfill for environments where it's not available
const BufferPolyfill = {
  from: (data) => {
    if (typeof data === 'string') {
      return new Uint8Array([...data].map(c => c.charCodeAt(0)));
    }
    if (Array.isArray(data)) {
      return new Uint8Array(data);
    }
    if (data instanceof Uint8Array) {
      return data;
    }
    return new Uint8Array(0);
  },
  concat: (buffers) => {
    const totalLength = buffers.reduce((sum, buf) => sum + buf.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    buffers.forEach(buf => {
      result.set(buf, offset);
      offset += buf.length;
    });
    return result;
  },
  isBuffer: (obj) => obj instanceof Uint8Array
};

export const Buf = typeof Buffer !== 'undefined' ? Buffer : BufferPolyfill;
