// Enhanced Buffer polyfill
const BufferPolyfill = {
  from: (data, encoding) => {
    if (typeof data === 'string') {
      if (encoding === 'base64') {
        const binary = atob(data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
      }
      const encoder = new TextEncoder();
      return encoder.encode(data);
    }
    if (Array.isArray(data)) {
      return new Uint8Array(data);
    }
    if (data instanceof ArrayBuffer) {
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
  
  isBuffer: (obj) => obj instanceof Uint8Array,
  
  toString: function(data, encoding = 'utf8') {
    if (!(data instanceof Uint8Array)) {
      data = this.from(data);
    }
    
    if (encoding === 'base64') {
      let binary = '';
      for (let i = 0; i < data.length; i++) {
        binary += String.fromCharCode(data[i]);
      }
      return btoa(binary);
    }
    
    const decoder = new TextDecoder();
    return decoder.decode(data);
  }
};

// ✅ Create a custom BufferLike class that mimics Node.js Buffer behavior
class BufferLike extends Uint8Array {
  toString(encoding = 'utf8') {
    return BufferPolyfill.toString(this, encoding);
  }
}

// ✅ Updated export with proper instance methods
export const Buf = typeof Buffer !== 'undefined' ? Buffer : {
  from: (data, encoding) => {
    const uint8 = BufferPolyfill.from(data, encoding);
    // Convert Uint8Array to BufferLike to add toString method
    const buffer = new BufferLike(uint8.length);
    buffer.set(uint8);
    return buffer;
  },
  concat: (buffers) => {
    const uint8 = BufferPolyfill.concat(buffers);
    const buffer = new BufferLike(uint8.length);
    buffer.set(uint8);
    return buffer;
  },
  isBuffer: BufferPolyfill.isBuffer
};