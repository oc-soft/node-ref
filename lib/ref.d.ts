import type { Buffer } from 'node:buffer'

export type { default as BufferRef } from './buffer'

/**
 * manage primitive type size
 */
type TypeNumber = {
  void: number
  int8: number
  uint8: number
  int16: number
  uint16: number
  int32: number
  uint32: number
  int64: number
  uint64: number
  float: number
  double: number
  bool: number
  byte: number
  char: number
  uchar: number
  short: number
  ushort: number
  int: number
  uint: number
  long: number
  ulong: number
  longlong: number
  ulonglong: number
  pointer: number
  size_t: number
  wchar_t: number
}

type SizeOf = TypeNumber

export const sizeof: SizeOf

type AlignOf = TypeNumber

export const alignof: AlignOf

export interface TypeBase {
  size: number
  indirection: number
  get(buffer: Buffer, offset?: number): any
  set(buffer: Buffer, offset: number, val: any): void
  name?: string
  external?: boolean   
}


export type Types = {
  void: TypeBase
  int8: TypeBase
  uint8: TypeBase
  int16: TypeBase
  uint16: TypeBase
  int32: TypeBase
  uint32: TypeBase
  int64: TypeBase
  uint64: TypeBase
  float: TypeBase
  double: TypeBase
  bool: TypeBase
  byte: TypeBase
  char: TypeBase
  uchar: TypeBase
  short: TypeBase
  ushort: TypeBase
  int: TypeBase
  uint: TypeBase
  long: TypeBase
  ulong: TypeBase
  longlong: TypeBase
  ulonglong: TypeBase
  pointer: TypeBase
  size_t: TypeBase
  wchar_t: TypeBase
  Object: TypeBase 
  CString: TypeBase
  Utf8String: TypeBase
}


/** Represents the native endianness of the processor ("LE" or "BE"). */
export declare const endianness: string

/**
 * A `Buffer` that references the C NULL pointer. That is, its memory address
 * points to 0. Its `length` is 0 because accessing any data from this buffer
 * would cause a _segmentation fault_.
 *
 * ```
 * console.log(ref.NULL);
 * <SlowBuffer@0x0 >
 * ```
 */
export declare var NULL: Buffer

/**
 * Accepts a `Buffer` instance and returns the memory address of the buffer
 * instance. Returns a JavaScript Number, which can't hold 64-bit integers,
 * so this function is unsafe on 64-bit systems.
 * ```
 * console.log(ref.address(Buffer.alloc(1)));
 * 4320233616
 *
 * console.log(ref.address(ref.NULL)));
 * 0
 * ```
 *
 * @param {Buffer} buffer The buffer to get the memory address of.
 * @return {number} The memory address the buffer instance.
 */
export declare function address(buffer: Buffer,
  offset?: number, external?: boolean): number

/** Get the memory address of buffer. */
export declare function hexAdress(buffer: Buffer,
  offset?: number, external?: boolean): string

/**
 * Accepts a `Buffer` instance and returns _true_ if the buffer represents the
 * NULL pointer, _false_ otherwise.
 *
 * ```
 * console.log(ref.isNull(Buffer.alloc(1)));
 * false
 *
 * console.log(ref.isNull(ref.NULL));
 * true
 * ```
 *
 * @param {Buffer} buffer The buffer to check for NULL.
 * @return {boolean} true or false.
 */
export declare function isNull(buffer: Buffer): boolean

/**
 * Reads a JavaScript Object that has previously been written to the given
 * _buffer_ at the given _offset_.
 *
 * ```
 * var obj = { foo: 'bar' };
 * var buf = ref.alloc('Object', obj);
 *
 * var obj2 = ref.readObject(buf, 0);
 * console.log(obj === obj2);
 * true
 * ```
 *
 * @param {Buffer} buffer The buffer to read an Object from.
 * @param {number} offset The offset to begin reading from.
 * @return {object} The Object that was read from _buffer_.
 */
export declare function readObject(buffer: Buffer, offset?: number): Object

/**
 * Write the JS Object. This function "attaches" object to buffer to prevent
 * it from being garbage collected.
 */
export declare function writeObject(
  buffer: Buffer,
  offset: number, obj: object, persistent?: boolean): void

/**
 * Reads a Buffer instance from the given _buffer_ at the given _offset_.
 * The _size_ parameter specifies the `length` of the returned Buffer instance,
 * which defaults to __0__.
 *
 * ```
 * var buf = new Buffer('hello world');
 * var pointer = ref.alloc('pointer', buf);
 *
 * var buf2 = ref.readPointer(pointer, 0, buf.length);
 * console.log(buf2.toString());
 * 'hello world'
 * ```
 *
 * @param {Buffer} buffer The buffer to read a Buffer from.
 * @param {number} offset The offset to begin reading from.
 * @param {number} length (optional) The length of the returned Buffer. Defaults to 0.
 * @return {Buffer} The Buffer instance that was read from _buffer_.
 */
export declare function readPointer(buffer: Buffer, 
  offset?: number, length?: number, external?: boolean): Buffer

/**
 * Write the memory address of pointer to buffer at the specified offset. This
 * function "attaches" object to buffer to prevent it from being garbage collected.
 */
export declare function writePointer(buffer: Buffer,
  offset: number,
  pointer: Buffer,
  external?: boolean): void

/**
 * Reads a machine-endian int64_t from the given Buffer at the given offset.
 */
export function readInt64(buffer: Buffer,
  offset: number): number | string

/**
 * Returns a big-endian signed 64-bit int read from _buffer_ at the given
 * _offset_.
 *
 * If the returned value will fit inside a JavaScript Number without losing
 * precision, then a Number is returned, otherwise a String is returned.
 *
 * ```
 * var buf = ref.alloc('int64');
 * ref.writeInt64BE(buf, 0, '9223372036854775807');
 *
 * var val = ref.readInt64BE(buf, 0)
 * console.log(val)
 * '9223372036854775807'
 * ```
 *
 * @param {Buffer} buffer The buffer to read a Buffer from.
 * @param {number} offset The offset to begin reading from.
 * @return {number|string} The Number or String that was read from _buffer_.
 * @name readInt64BE
 * @type method
 */
export function readInt64BE(
  buffer: Buffer,
  offset: number): number | string

/**
 * Returns a little-endian signed 64-bit int read from _buffer_ at the given
 * _offset_.
 *
 * If the returned value will fit inside a JavaScript Number without losing
 * precision, then a Number is returned, otherwise a String is returned.
 *
 * ```
 * var buf = ref.alloc('int64');
 * ref.writeInt64LE(buf, 0, '9223372036854775807');
 *
 * var val = ref.readInt64LE(buf, 0)
 * console.log(val)
 * '9223372036854775807'
 * ```
 *
 * @param {Buffer} buffer The buffer to read a Buffer from.
 * @param {number} offset The offset to begin reading from.
 * @return {number|string} The Number or String that was read from _buffer_.
 */
export function readInt64LE(buffer: Buffer,
  offset: number): number | string


/**
 * Writes the input Number/String int64 value as a machine-endian int64_t to
 * the given Buffer at the given offset.
 */
export function writeInt64(buffer: Buffer,
  offset: number,
  input: string | number): void 

/**
 * Writes the _input_ Number or String as a big-endian signed 64-bit int into
 * _buffer_ at the given _offset_.
 *
 * ```
 * var buf = ref.alloc('int64');
 * ref.writeInt64BE(buf, 0, '9223372036854775807');
 * ```
 *
 * @param {Buffer} buffer The buffer to write to.
 * @param {number} offset The offset to begin writing from.
 * @param {number|string} input This String or Number which gets written.
 */
export function writeInt64BE(buffer: Buffer,
  offset: number): number | string
 
/**
 * Writes the _input_ Number or String as a little-endian signed 64-bit int into
 * _buffer_ at the given _offset_.
 *
 * ```
 * var buf = ref.alloc('int64');
 * ref.writeInt64LE(buf, 0, '9223372036854775807');
 * ```
 *
 * @param {Buffer} buffer The buffer to write to.
 * @param {number} offset The offset to begin writing from.
 * @param {number|string} input This String or Number which gets written.
 */
export function writeInt64LE(buffer: Buffer,
  offset: number,
  input: number | string): void

/**
 * Reads a machine-endian uint64_t from the given Buffer at the given offset.
 */
export function readUInt64(buffer: Buffer,
  offset: number): number | string

/**
 * Writes the input Number/String uint64 value as a machine-endian int64_t to
 * the given Buffer at the given offset.
 */
export function writeUInt64(buffer: Buffer,
  offset: number,
  input: string | number): void 

/**
 * Writes the _input_ Number or String as a big-endian unsigned 64-bit int into
 * _buffer_ at the given _offset_.
 *
 * ```
 * var buf = ref.alloc('uint64');
 * ref.writeUInt64BE(buf, 0, '18446744073709551615');
 * ```
 *
 * @param {Buffer} buffer The buffer to write to.
 * @param {number} offset The offset to begin writing from.
 * @param {number|string} input This String or Number which gets written.
 */
export function writeUInt64BE(buffer: Buffer,
  offset: number,
  input: number | string): void

/**
 * Writes the _input_ Number or String as a little-endian unsigned 64-bit int
 * into _buffer_ at the given _offset_.
 *
 * ```
 * var buf = ref.alloc('uint64');
 * ref.writeUInt64LE(buf, 0, '18446744073709551615');
 * ```
 *
 * @param {Buffer} buffer The buffer to write to.
 * @param {number} offset The offset to begin writing from.
 * @param {number|string} input This String or Number which gets written.
 */
export function writeUInt64LE(buffer: Buffer,
  offset: number,
  input: number | string): void



/**
 * Returns a big-endian unsigned 64-bit int read from _buffer_ at the given
 * _offset_.
 *
 * If the returned value will fit inside a JavaScript Number without losing
 * precision, then a Number is returned, otherwise a String is returned.
 *
 * ```
 * var buf = ref.alloc('uint64');
 * ref.writeUInt64BE(buf, 0, '18446744073709551615');
 *
 * var val = ref.readUInt64BE(buf, 0)
 * console.log(val)
 * '18446744073709551615'
 * ```
 *
 * @param {Buffer} buffer The buffer to read a Buffer from.
 * @param {number} offset The offset to begin reading from.
 * @return {number|string} The Number or String that was read from _buffer_.
 */
export function readUInt64BE(buffer: Buffer,
  offset: number): string | string

/**
 * Returns a little-endian unsigned 64-bit int read from _buffer_ at the given
 * _offset_.
 *
 * If the returned value will fit inside a JavaScript Number without losing
 * precision, then a Number is returned, otherwise a String is returned.
 *
 * ```
 * var buf = ref.alloc('uint64');
 * ref.writeUInt64LE(buf, 0, '18446744073709551615');
 *
 * var val = ref.readUInt64LE(buf, 0)
 * console.log(val)
 * '18446744073709551615'
 * ```
 *
 * @param {Buffer} buffer The buffer to read a Buffer from.
 * @param {number} offset The offset to begin reading from.
 * @return {number|string} The Number or String that was read from _buffer_.
 */
export function readUInt64LE(buffer: Buffer,
  offset: number): number | string


/**
 * Returns a JavaScript String read from _buffer_ at the given _offset_. The
 * C String is read until the first NULL byte, which indicates the end of the
 * String.
 *
 * This function can read beyond the `length` of a Buffer.
 *
 * ```
 * var buf = new Buffer('hello\0world\0');
 *
 * var str = ref.readCString(buf, 0);
 * console.log(str);
 * 'hello'
 * ```
 *
 * @param {Buffer} buffer The buffer to read a Buffer from.
 * @param {number} offset The offset to begin reading from.
 * @return {string} The String that was read from _buffer_.
 */
export function readCString(buffer: Buffer,
  offset: number): string 

/*
 * Returns a new Buffer instance that has the same memory address
 * as the given buffer, but with the specified size.
 *
 */
export function reinterpretBuffer(buffer: Buffer,
  size: number,
  offset: number): Buffer 


/*
 * Returns a new Buffer instance that has the same memory address
 * as the given buffer, but with a length up to the first aligned set of values of
 * 0 in a row for the given length.
 *
 * info[0] - Buffer - the "buf" Buffer instance to read the address from
 * info[1] - Number - the number of sequential 0-byte values that need to be read
 * info[2] - Number - the offset from the "buf" buffer's address to read from
 */
export function reinterpretBufferUtilZeros(buffer: Buffer,
  size: number,
  offset: number): Buffer 

/**
 * copy from a poiner container to another pointer container
 */
export function copyMemory(dst: Buffer,
  src: Buffer,
  size: number): void 

/**
 * add displacement to external pointer
 */
export function addOffset(dst: Buffer,
  offset: number): void 

/**
 * `NULL_POINTER` is a pointer-sized `Buffer` instance pointing to `NULL`.
 * Conceptually, it's equivalent to the following C code:
 *
 * ``` c
 * char *null_pointer;
 * null_pointer = NULL;
 * ```
 *
 * @type Buffer
 */
export declare var NULL_POINTER: Buffer

/**
 * get a pointer-sized `Buffer` instance pointing to `NULL`.
 * Conceptually, it's equivalent to the following C code:
 *
 * ``` c
 * char *null_pointer;
 * null_pointer = NULL;
 * ```
 *
 * @param {boolean} external - you get filled 0 with pointer size buffer if external is true or exports.NULL_POINTER 
 * @returns {Uint8Array} 
 */
export function getNullPointer(external: boolean): Uint8Array


/**
 * Returns a new clone of the given "type" object, with its
 * `indirection` level incremented by **1**.
 *
 * Say you wanted to create a type representing a `void *`:
 *
 * ```
 * var voidPtrType = ref.refType(ref.types.void);
 * ```
 *
 * @param {object|string} type The "type" object to create a reference type from. Strings get coerced first.
 * @param {boolean=} external The flag to specify external reference which is out of sandbox space.
 * @return {TypeBase} The new "type" object with its `indirection` incremented by 1.
 */
export function refType(typeObj: string | TypeBase,
  external?: boolean): TypeBase

/**
 * Returns a new clone of the given "type" object, with its
 * `indirection` level decremented by 1.
 *
 * @param {TypeBase|string} type The "type" object to create a dereference type from. Strings get coerced first.
 * @return {TypeBase} The new "type" object with its `indirection` decremented by 1.
 */
export function derefType(typeObj: TypeBase | string): TypeBase

/**
 * Coerces a "type" object from a String or an actual "type" object. String values
 * are looked up from the `ref.types` Object. So:
 *
 *   * `"int"` gets coerced into `ref.types.int`.
 *   * `"int *"` gets translated into `ref.refType(ref.types.int)`
 *   * `ref.types.int` gets translated into `ref.types.int` (returns itself)
 *
 * Throws an Error if no valid "type" object could be determined. Most `ref`
 * functions use this function under the hood, so anywhere a "type" object is
 * expected, a String may be passed as well, including simply setting the
 * `buffer.type` property.
 *
 * ```
 * var type = ref.coerceType('int **');
 *
 * console.log(type.indirection);
 * 3
 * ```
 *
 * @param {TypeBase|string} type The "type" Object or String to coerce.
 * @return {TypeBase} A "type" object
 */

export function coerceType (typeObj: string | TypeBase): TypeBase

/**
 * Returns the "type" property of the given Buffer.
 * Creates a default type for the buffer when none exists.
 *
 * @param {Buffer} buffer The Buffer instance to get the "type" object from.
 * @return {TypeBase} The "type" object from the given Buffer.
 */
export function getType (buffer: Buffer): TypeBase


/**
 * Calls the `get()` function of the Buffer's current "type" (or the
 * passed in _type_ if present) at the given _offset_.
 *
 * This function handles checking the "indirection" level and returning a
 * proper "dereferenced" Bufffer instance when necessary.
 *
 * @param {Buffer} buffer The Buffer instance to read from.
 * @param {number} offset (optional) The offset on the Buffer to start reading from. Defaults to 0.
 * @param {TypeBase|string} type (optional) The "type" object to use when reading. Defaults to calling `getType()` on the buffer.
 * @return {any} Whatever value the "type" used when reading returns.
 */
export function get(
  buffer: Buffer,
  offset?: number,
  typeObj?: TypeBase): any

/**
 * Calls the `set()` function of the Buffer's current "type" (or the
 * passed in _type_ if present) at the given _offset_.
 *
 * This function handles checking the "indirection" level writing a pointer rather
 * than calling the `set()` function if the indirection is greater than 1.
 *
 * @param {Buffer} buffer The Buffer instance to write to.
 * @param {number} offset The offset on the Buffer to start writing to.
 * @param {any} value The value to write to the Buffer instance.
 * @param {object|string} type (optional) The "type" object to use when reading. Defaults to calling `getType()` on the buffer.
 */
export function set(
  buffer: Buffer,
  offset: number,
  value: any,
  typeObj: string | TypeBase): void 
  
/**
 * Returns a new Buffer instance big enough to hold `type`,
 * with the given `value` written to it.
 *
 * ``` js
 * var intBuf = ref.alloc(ref.types.int)
 * var int_with_4 = ref.alloc(ref.types.int, 4)
 * ```
 *
 * @param {TypeBase|string} type The "type" object to allocate. Strings get coerced first.
 * @param {any} value (optional) The initial value set on the returned Buffer, using _type_'s `set()` function.
 * @return {Buffer} A new Buffer instance with it's `type` set to "type", and (optionally) "value" written to it.
 */
export function alloc (typeObj: TypeBase, value?: any) :Buffer

/**
 * Returns a new `Buffer` instance with the given String written to it with the
 * given encoding (defaults to __'utf8'__). The buffer is 1 byte longer than the
 * string itself, and is NUL terminated.
 *
 * ```
 * var buf = ref.allocCString('hello world');
 *
 * console.log(buf.toString());
 * 'hello world\u0000'
 * ```
 *
 * @param {string} string The JavaScript string to be converted to a C string.
 * @param {string} encoding (optional) The encoding to use for the C string. Defaults to __'utf8'__.
 * @return {Buffer} The new `Buffer` instance with the specified String wrtten to it, and a trailing NUL byte.
 */
export function allocCString(
  str: string,
  encoding?: string): Buffer 

/**
 * Writes the given string as a C String (NULL terminated) to the given buffer
 * at the given offset. "encoding" is optional and defaults to __'utf8'__.
 *
 * Unlike `readCString()`, this function requires the buffer to actually have the
 * proper length.
 *
 * @param {Buffer} buffer The Buffer instance to write to.
 * @param {number} offset The offset of the buffer to begin writing at.
 * @param {string} string The JavaScript String to write that will be written to the buffer.
 * @param {string} encoding (optional) The encoding to read the C string as. Defaults to __'utf8'__.
 */
export function writeCString(
  buffer: Buffer,
  offset: number,
  str: string,
  encoding: string): void

/**
 * `ref()` accepts a Buffer instance and returns a new Buffer
 * instance that is "pointer" sized and has its data pointing to the given
 * Buffer instance. Essentially the created Buffer is a "reference" to the
 * original pointer, equivalent to the following C code:
 *
 * ``` c
 * char *buf = buffer;
 * char **ref = &buf;
 * ```
 *
 * @param {Buffer} buffer A Buffer instance to create a reference to.
 * @return {Buffer} A new Buffer instance pointing to _buffer_.
 */

export function ref (buffer: Buffer): Buffer 

/**
 * Accepts a Buffer instance and attempts to "dereference" it.
 * That is, first it checks the `indirection` count of _buffer_'s "type", and if
 * it's greater than __1__ then it merely returns another Buffer, but with one
 * level less `indirection`.
 *
 * When _buffer_'s indirection is at __1__, then it checks for `buffer.type`
 * which should be an Object with its own `get()` function.
 *
 * ```
 * var buf = ref.alloc('int', 6);
 *
 * var val = ref.deref(buf);
 * console.log(val);
 * 6
 * ```
 *
 *
 * @param {Buffer} buffer A Buffer instance to dereference.
 * @return {?} The returned value after dereferencing _buffer_.
 */
export function deref (buffer: Buffer): any

/**
 * Returns a new Buffer instance with the specified _size_, with the same memory
 * address as _buffer_.
 *
 * This function "attaches" _buffer_ to the returned Buffer to prevent it from
 * being garbage collected.
 *
 * @param {Buffer} buffer A Buffer instance to base the returned Buffer off of.
 * @param {number} size The `length` property of the returned Buffer.
 * @param {number} offset The offset of the Buffer to begin from.
 * @return {Buffer} A new Buffer instance with the same memory address as _buffer_, and the requested _size_.
 */

export function reinterpret (
  buffer: Buffer,
  size: number,
  offset: number): Buffer

/**
 * Accepts a `Buffer` instance and a number of `NULL` bytes to read from the
 * pointer. This function will scan past the boundary of the Buffer's `length`
 * until it finds `size` number of aligned `NULL` bytes.
 *
 * This is useful for finding the end of NUL-termintated array or C string. For
 * example, the `readCString()` function _could_ be implemented like:
 *
 * ```
 * function readCString (buf) {
 *   return ref.reinterpretUntilZeros(buf, 1).toString('utf8')
 * }
 * ```
 *
 * This function "attaches" _buffer_ to the returned Buffer to prevent it from
 * being garbage collected.
 *
 * @param {Buffer} buffer A Buffer instance to base the returned Buffer off of.
 * @param {number} size The number of sequential, aligned `NULL` bytes are required to terminate the buffer.
 * @param {number} offset The offset of the Buffer to begin from.
 * @return {Buffer} A new Buffer instance with the same memory address as _buffer_, and a variable `length` that is terminated by _size_ NUL bytes.
 */

export function reinterpretUntilZeros(
  buffer: Buffer,
  size: number,
  offset: number): Buffer

/**
 * read buffer from pointer
 */
export function readFromPointer(
  pointerBuffer: Buffer,
  offset: number,
  size: number): Buffer

/**
 * compare two pointer buffer
 */
export function comparePointer(
  pointerBuffer1: Uint8Array | Buffer,
  pointerBuffer2: Uint8Array | Buffer,
  offset1?: number,
  offset2?: number): number

export const types: Types


  
// vi: se ts=2 sw=2 et:
