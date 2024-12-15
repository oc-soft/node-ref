import type { Buffer } from 'node:buffer'

export class BufferRef extends Buffer {
  /**
   * get pointer address representation
   * @param {boolean=} external - the flag interpret the buffer as sandbox external pointer.
   * @return {string} address representation
   */
  address(external?: boolean): string | number

  /**
   * get pointer hexdecimal address representation
   * @param {boolean=} external - the flag interpret the buffer as sandbox external pointer.
   * @return {string} address string representation
   */
  hexAddress(external?: boolean): string 

  /**
   * you get true if this buffer is null pointer
   * @return {boolean} 
   */
  isNull(): boolean

  /**
   * you get indirect reference for this buffer
   * @return {Buffer} indirect reference
   */
  ref(): Buffer

  /**
   * you get dereference for this buffer
   * @return {Buffer} dereference
   */
  deref(): Buffer

  /**
   * read a javascript object from this buffer
   * @param {number} offset - byte offset to read a javascript object
   * @return {object} javascript object
   */
  readObject(offset?: number): object

  /**
   * write a javascript object into this buffer
   * @param {object} obj - javascript object
   * @param {number} offset - byte offset to write a javascript object into
   */
  writeObject(obj: object, offset?: number):void

  /**
   * read a pointer this buffer
   * @param {number} offset - byte offset to read a pointer
   * @param {number} size - size to read from this
   * @param {boolean=} external - flag to read a pointer as sandbox external pointer.
   * @return {Buffer} pointer wrapped by Buffer
   */
  readPointer(offset: number, size: number, external?: boolean):Buffer 

  /**
   * write a javascript object into this buffer
   * @param {Buffer} ptr - pointer wrapped by Buffer
   * @param {number= } offset - byte offset to write ptr
   * @param {boolean=} external -  flag to read a pointer as sandbox external pointer.
   */
  writePointer(ptr: Buffer, offset?: number, external?: boolean):void 

  /**
   * read string from buffer
   * @param {number} offset - byte offset to read a string
   * @return {string}
   */
  readCString(offset?: number): string

  /**
   * write string into buffer
   * @param {string} str - string to be written into this buffer
   * @param {number} offset - byte offset to read a string
   * @param {string} encoding - default utf8
   */
  writeCString(str: string, offset?: number, encoding?: string):void 

 /**
  * read 64 bits integer big-endian byte order
  * @param {number} offset - specify byte offset to read from
  * @return {number | string} 64 bits integer
  */
  readInt64BE(offset: number): number | string

 /**
  * write 64 bits integer with big-endian byte order
  * @param {number | string} val - 64 bits integer
  * @param {number} offset - specify byte offset to read from
  */
  writeInt64BE(val: number | string, offset: number): void 

 /**
  * read 64 bits integer little-endian byte order
  * @param {number} offset - specify byte offset to read from
  * @return {number | string} 64 bits integer
  */
  readInt64LE(offset: number): number | string

 /**
  * write 64 bits integer with little-endian byte order
  * @param {number | string} val - 64 bits integer
  * @param {number} offset - specify byte offset to read from
  */
  writeInt64LE(val: number | string, offset: number): void 

 /**
  * read 64 bits unsigned integer big-endian byte order
  * @param {number} offset - specify byte offset to read from
  * @return {number | string} 64 bits unsigned integer
  */
  readUInt64BE(offset: number): number | string

 /**
  * write 64 bits unsigned integer with big-endian byte order
  * @param {number | string} val - 64 bits unsigned integer
  * @param {number} offset - specify byte offset to read from
  */
  writeUInt64BE(val: number | string, offset: number): void 

 /**
  * read 64 bits unsigned integer little-endian byte order
  * @param {number} offset - specify byte offset to read from
  * @return {number | string} 64 bits unsigned integer
  */
  readUInt64LE(offset: number): number | string

 /**
  * write 64 bits unsigned integer with little-endian byte order
  * @param {number | string} val - 64 bits unsigned integer
  * @param {number} offset - specify byte offset to read from
  */
  writeUInt64LE(val: number | string, offset: number): void 

  /**
   * Returns a new Buffer instance with the specified _size_, with the same
   * memory address as _buffer_.
   *
   * This function "attaches" _buffer_ to the returned Buffer to prevent it
   * from being garbage collected.
   *
   * @param {number} size The `length` property of the returned Buffer.
   * @param {number} offset The offset of the Buffer to begin from.
   * @return {Buffer} A new Buffer instance with the same memory address as _buffer_, and the requested _size_.
   */
  reinterpret(size: number, offset: number): Buffer 

  /**
   * This is useful for finding the end of NUL-termintated array or C string.
   *
   * This function "attaches" _buffer_ to the returned Buffer to prevent it from
   * being garbage collected.
   *
   * @param {number} size The number of sequential, aligned `NULL` bytes are required to terminate the buffer.
   * @param {Number} offset The offset of the Buffer to begin from.
   * @return {Buffer} A new Buffer instance with the same memory address as _buffer_, and a variable `length` that is terminated by _size_ NUL bytes.
   */
  reinterpretUntilZeros(size: number, offset: number): Buffer
}

export { BufferRef as default }

// vi: se ts=2 sw=2 et:
