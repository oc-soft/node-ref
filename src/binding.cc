#include <cstdlib>
#include <cerrno>
#include <cstring>
#include <cstdint>

#include "node.h"
#include "node_buffer.h"
#include "nan.h"

#ifdef _WIN32
  #define __alignof__ __alignof
  #define PRId64 "lld"
  #define PRIu64 "llu"
#else
  #include <inttypes.h>
#endif


using namespace v8;
using namespace node;

namespace {

// used by the Int64 functions to determine whether to return a Number
// or String based on whether or not a Number will lose precision.
// http://stackoverflow.com/q/307179/376773
#define JS_MAX_INT +9007199254740992LL
#define JS_MIN_INT -9007199254740992LL

// mirrors deps/v8/src/objects.h.
// we could use `node::Buffer::kMaxLength`, but it's not defined on node v0.6.x
static const unsigned int kMaxLength = 0x3fffffff;

// get int64 from a value
inline int64_t GetInt64(Local<Value> value) {
  return value->IsNumber() ? Nan::To<int64_t>(value).FromJust() : 0;
}

/*
 * Returns the pointer address as a Number of the given Buffer instance.
 * It's recommended to use `hexAddress()` in most cases instead of this function.
 *
 * WARNING: a JavaScript Number cannot precisely store a full 64-bit memory
 * address, so there's a possibility of an inaccurate value being returned
 * on 64-bit systems.
 *
 * info[0] - Buffer - the Buffer instance get the memory address of
 * info[1] - Number - optional (0) - the offset of the Buffer start at
 * info[2] - Boolean - optional (false) - interpret the content as pointer if true.
 */

NAN_METHOD(Address) {

  Local<Value> buf = info[0];
  if (!Buffer::HasInstance(buf)) {
    return Nan::ThrowTypeError("address: Buffer instance expected");
  }

  int64_t offset = GetInt64(info[1]);
  uintptr_t intptr = 0;
  bool external = false;
  if (info.Length() > 2) {
    external = info[2]->ToBoolean(info.GetIsolate())->IsTrue();
  }
  if (!external) {
    char *ptr = Buffer::Data(buf.As<Object>()) + offset;
    intptr = reinterpret_cast<uintptr_t>(ptr);
  } else {
    uintptr_t *ptrRef = reinterpret_cast<uintptr_t*>(
      Buffer::Data(buf.As<Object>()) + offset);
    intptr = *ptrRef;
  }
  Local<Number> rtn = Nan::New(static_cast<double>(intptr));

  info.GetReturnValue().Set(rtn);
}

/**
 * Returns the pointer address as a hexadecimal String. This function
 * is safe to use for displaying memory addresses, as compared to the
 * `address()` function which could overflow since it returns a Number.
 *
 * info[0] - Buffer - the Buffer instance get the memory address of
 * info[1] - Number - optional (0) - the offset of the Buffer start at
 * info[2] - Boolean - optional (false) - interpret the content as pointer if true.
  */

NAN_METHOD(HexAddress) {

  Local<Value> buf = info[0];
  if (!Buffer::HasInstance(buf)) {
    return Nan::ThrowTypeError("hexAddress: Buffer instance expected");
  }

  int64_t offset = GetInt64(info[1]);
  char *ptr = nullptr;
  bool external = false;
  if (info.Length() > 2) {
    external = info[2]->ToBoolean(info.GetIsolate())->IsTrue();
  }
  if (!external) {
    ptr = Buffer::Data(buf.As<Object>()) + offset;
  } else {
    char **ptrRef = reinterpret_cast<char **>(
      Buffer::Data(buf.As<Object>()) + offset);
    ptr = *ptrRef;
  }
  char strbuf[30]; /* should be plenty... */
  std::snprintf(strbuf, 30, "%p", ptr);

  Local<String> val;
  if (strbuf[0] == '0' && strbuf[1] == 'x') {
    /* strip the leading "0x" from the address */
    val = Nan::New(strbuf + 2).ToLocalChecked();
  } else {
    val = Nan::New(strbuf).ToLocalChecked();
  }

  info.GetReturnValue().Set(val);
}

/*
 * Returns "true" if the given Buffer points to NULL, "false" otherwise.
 *
 * info[0] - Buffer - the Buffer instance to check for NULL
 * info[1] - Number - optional (0) - the offset of the Buffer start at
 * info[2] - Boolean - optional (false) - interpret the content as pointer if true.
  */

NAN_METHOD(IsNull) {

  Local<Value> buf = info[0];
  if (!Buffer::HasInstance(buf)) {
    return Nan::ThrowTypeError("isNull: Buffer instance expected");
  }

  int64_t offset = GetInt64(info[1]);
  char *ptr = Buffer::Data(buf.As<Object>()) + offset;
  Local<Value> rtn = Nan::New(ptr == NULL);

  info.GetReturnValue().Set(rtn);
}

/**
 * Returns the machine endianness as C String; either "BE" or "LE".
 */

const char *CheckEndianness() {
  int i = 1;
  bool is_bigendian = (*(char *)&i) == 0;
  if (is_bigendian) {
    return "BE";
  } else {
    return "LE";
  }
}

/*
 * Converts an arbitrary pointer to a node Buffer with specified length
 */

void wrap_pointer_cb(char *data, void *hint) {
}

inline Local<Value> WrapPointer(char *ptr, size_t length) {
  Nan::EscapableHandleScope scope;
  if (ptr == NULL) length = 0;
  return scope.Escape(Nan::NewBuffer(ptr, length, wrap_pointer_cb, NULL).ToLocalChecked());
}

/*
 * Creates the "null_pointer_buffer" Buffer instance that points to NULL.
 * It has a length of 0 so that you don't accidentally try to deref the NULL
 * pointer in JS-land by doing something like: `ref.NULL[0]`.
 */

inline Local<Value> WrapNullPointer() {
  return WrapPointer((char*)NULL, 0);
}

/*
 * Retreives a JS Object instance that was previously stored in
 * the given Buffer instance at the given offset.
 *
 * info[0] - Buffer - the "buf" Buffer instance to read from
 * info[1] - Number - the offset from the "buf" buffer's address to read from
 */

NAN_METHOD(ReadObject) {

  Local<Value> buf = info[0];
  if (!Buffer::HasInstance(buf)) {
    return Nan::ThrowTypeError("readObject: Buffer instance expected");
  }

  int64_t offset = GetInt64(info[1]);
  char *ptr = Buffer::Data(buf.As<Object>()) + offset;

  if (ptr == NULL) {
    return Nan::ThrowError("readObject: Cannot read from NULL pointer");
  }

  Persistent<Object>* prtn = reinterpret_cast<Persistent<Object>*>(ptr);
  Local<Value> rtn = Nan::New(*prtn);
  info.GetReturnValue().Set(rtn);
}

/*
 * Callback function for when the weak persistent object from WriteObject
 * gets garbage collected. We just have to dispose of our weak reference now.
 */

void write_object_cb(const Nan::WeakCallbackInfo<void>& data) {
  //fprintf(stderr, "write_object_cb\n");
  //NanDisposePersistent(data.GetValue());
}

/*
 * Writes a Persistent reference to given Object to the given Buffer
 * instance and offset.
 *
 * info[0] - Buffer - the "buf" Buffer instance to write to
 * info[1] - Number - the offset from the "buf" buffer's address to write to
 * info[2] - Object - the "obj" Object which will have a new Persistent reference
 *                    created for the obj, who'se memory address will be written
 * info[3] - Boolean - `false` by default. if `true` is passed in then a
 *                    persistent reference will be written to the Buffer instance.
 *                    A weak reference gets written by default.
 */

NAN_METHOD(WriteObject) {

  Local<Value> buf = info[0];
  if (!Buffer::HasInstance(buf)) {
    return Nan::ThrowTypeError("writeObject: Buffer instance expected");
  }

  int64_t offset = GetInt64(info[1]);
  char *ptr = Buffer::Data(buf.As<Object>()) + offset;

  Nan::Persistent<Object>* pptr = reinterpret_cast<Nan::Persistent<Object>*>(ptr);
  Local<Object> val = info[2].As<Object>();

#if defined(V8_MAJOR_VERSION) && (V8_MAJOR_VERSION > 4 ||                      \
  (V8_MAJOR_VERSION == 4 && defined(V8_MINOR_VERSION) && V8_MINOR_VERSION >= 3))
  bool persistent = info[3]->BooleanValue(info.GetIsolate()->GetCurrent());
#else
  bool persistent = info[3]->BooleanValue();
#endif
  if (persistent) {
      (*pptr).Reset(val);
  } else {
    void *user_data = nullptr;
    Nan::Persistent<Object> p2(val);
    p2.SetWeak(user_data, write_object_cb, Nan::WeakCallbackType::kParameter);
    std::memcpy(reinterpret_cast<void*>(pptr),
      &p2, sizeof(Nan::Persistent<Object>));
  }

  info.GetReturnValue().SetUndefined();
}

/*
 * Reads the memory address of the given "buf" pointer Buffer at the specified
 * offset, and returns a new SlowBuffer instance from the memory address stored.
 *
 * info[0] - Buffer - the "buf" Buffer instance to read from
 * info[1] - Number - the offset from the "buf" buffer's address to read from
 * info[2] - Number - the length in bytes of the returned SlowBuffer instance. it is ignored if extenal flag true
 * info[3] - Boolean - the flag whether the pointer is in external or sandbox
 */

NAN_METHOD(ReadPointer) {

  Local<Value> buf = info[0];
  if (!Buffer::HasInstance(buf)) {
    return Nan::ThrowTypeError("readPointer: Buffer instance expected as first argument");
  }

  int64_t offset = GetInt64(info[1]);
  char *ptr = Buffer::Data(buf.As<Object>()) + offset;
  v8::Isolate *isolate = info.GetIsolate();
#if defined(V8_MAJOR_VERSION) && (V8_MAJOR_VERSION > 4 ||                      \
  (V8_MAJOR_VERSION == 4 && defined(V8_MINOR_VERSION) && V8_MINOR_VERSION > 3))
  size_t size = info[2]->Uint32Value(isolate->GetCurrentContext()).FromJust();
#else
  size_t size = info[2]->Uint32Value();
#endif

  bool external = false;
  if (info.Length() > 3) {
    external = info[3]->ToBoolean(isolate)->IsTrue();
  }
  if (ptr == NULL) {
    return Nan::ThrowError("readPointer: Cannot read from NULL pointer");
  }

  char *val = *reinterpret_cast<char **>(ptr);
  if (!external) {
    info.GetReturnValue().Set(WrapPointer(val, size));
  } else {
    Local<ArrayBuffer> ab = ArrayBuffer::New(isolate, sizeof(void*));
    char** destPtr = reinterpret_cast<char **>(ab->Data());
    *destPtr = val;
    MaybeLocal<Uint8Array> ret = Buffer::New(isolate, ab, 0, sizeof(void*));
    info.GetReturnValue().Set(ret.ToLocalChecked());
  }
}

/*
 * Writes the memory address of the "input" buffer (and optional offset) to the
 * specified "buf" buffer and offset. Essentially making "buf" hold a reference
 * to the "input" Buffer.
 *
 * info[0] - Buffer - the "buf" Buffer instance to write to
 * info[1] - Number - the offset from the "buf" buffer's address to write to
 * info[2] - Buffer - the "input" Buffer whose memory address will be written
 * info[3] - Boolean - the way to convert buf to pointer
 */

NAN_METHOD(WritePointer) {

  Local<Value> buf = info[0];
  Local<Value> input = info[2];
  if (!Buffer::HasInstance(buf)) {
    return Nan::ThrowTypeError("writePointer: Buffer instance expected as first argument");
  }
  if (!(input->IsNull() || Buffer::HasInstance(input))) {
    return Nan::ThrowTypeError("writePointer: Buffer instance expected as third argument");
  }
  Local<Uint8Array> destArray = Local<Uint8Array>::Cast(buf);

  int64_t offset = GetInt64(info[1]);

  bool external = false;
  if (info.Length() > 3) {
    external = info[3]->ToBoolean(info.GetIsolate())->IsTrue();
  }
 
  if (destArray->ByteLength() >= sizeof(void*) + destArray->ByteOffset()) {
    char *ptr = Buffer::Data(buf.As<Object>()) + offset;
    if (input->IsNull()) {
      *reinterpret_cast<char **>(ptr) = nullptr;
    } else {
      char *input_ptr = nullptr;
      if (!external) {
        input_ptr = Buffer::Data(input.As<Object>());
      } else {
        Local<Uint8Array> ptrArray = Local<Uint8Array>::Cast(input);
        size_t byteLength = ptrArray->ByteLength();
        size_t endLength = sizeof(void*) + ptrArray->ByteOffset();
        if (byteLength >= endLength) {
          unsigned char* ptr = reinterpret_cast<unsigned char*>(
            ptrArray->Buffer()->Data());
            ptr += ptrArray->ByteOffset();
          char** ptrRef = reinterpret_cast<char **>(ptr);
          input_ptr = *ptrRef;
        }
      }
      *reinterpret_cast<char **>(ptr) = input_ptr;
    }
  } else {
    Nan::ThrowError("writePointer: offset + pointer size must be less than equals buffer size");
  }
  info.GetReturnValue().SetUndefined();
}

/*
 * Reads a machine-endian int64_t from the given Buffer at the given offset.
 *
 * info[0] - Buffer - the "buf" Buffer instance to read from
 * info[1] - Number - the offset from the "buf" buffer's address to read from
 */

NAN_METHOD(ReadInt64) {

  Local<Value> buf = info[0];
  if (!Buffer::HasInstance(buf)) {
    return Nan::ThrowTypeError("readInt64: Buffer instance expected");
  }

  int64_t offset = GetInt64(info[1]);
  char *ptr = Buffer::Data(buf.As<Object>()) + offset;

  if (ptr == NULL) {
    return Nan::ThrowTypeError("readInt64: Cannot read from NULL pointer");
  }

  int64_t val = *reinterpret_cast<int64_t *>(ptr);

  Local<Value> rtn;
  if (val < JS_MIN_INT || val > JS_MAX_INT) {
    // return a String
    char strbuf[128];
    std::snprintf(strbuf, 128, "%" PRId64, val);
    rtn = Nan::New<v8::String>(strbuf).ToLocalChecked();
  } else {
    // return a Number
    rtn = Nan::New<v8::Number>(static_cast<double>(val));
  }

  info.GetReturnValue().Set(rtn);
}

/*
 * Writes the input Number/String int64 value as a machine-endian int64_t to
 * the given Buffer at the given offset.
 *
 * info[0] - Buffer - the "buf" Buffer instance to write to
 * info[1] - Number - the offset from the "buf" buffer's address to write to
 * info[2] - String/Number - the "input" String or Number which will be written
 */

NAN_METHOD(WriteInt64) {

  Local<Value> buf = info[0];
  if (!Buffer::HasInstance(buf)) {
    return Nan::ThrowTypeError("writeInt64: Buffer instance expected");
  }

  int64_t offset = GetInt64(info[1]);
  char *ptr = Buffer::Data(buf.As<Object>()) + offset;

  Local<Value> in = info[2];
  int64_t val;
  if (in->IsNumber()) {
    val = GetInt64(in);
  } else if (in->IsString()) {
    char *endptr, *str;
    int base = 0;
#if defined(V8_MAJOR_VERSION) && (V8_MAJOR_VERSION > 6 ||                      \
  (V8_MAJOR_VERSION == 6 && defined(V8_MINOR_VERSION) && V8_MINOR_VERSION > 2))
    v8::Isolate *isolate = v8::Isolate::GetCurrent();
    String::Utf8Value _str(isolate, in);
#else
    String::Utf8Value _str(in);
#endif
    str = *_str;

    errno = 0;     /* To distinguish success/failure after call */
    val = std::strtoll(str, &endptr, base);

    if (endptr == str) {
      return Nan::ThrowTypeError("writeInt64: no digits we found in input String");
    } else  if (errno == ERANGE && (val == LLONG_MAX || val == LLONG_MIN)) {
      return Nan::ThrowTypeError("writeInt64: input String numerical value out of range");
    } else if (errno != 0 && val == 0) {
      char errmsg[200];
      snprintf(errmsg, sizeof(errmsg), "writeInt64: %s", strerror(errno));
      return Nan::ThrowTypeError(errmsg);
    }
  } else {
    return Nan::ThrowTypeError("writeInt64: Number/String 64-bit value required");
  }

  *reinterpret_cast<int64_t *>(ptr) = val;

  info.GetReturnValue().SetUndefined();
}

/*
 * Reads a machine-endian uint64_t from the given Buffer at the given offset.
 *
 * info[0] - Buffer - the "buf" Buffer instance to read from
 * info[1] - Number - the offset from the "buf" buffer's address to read from
 */

NAN_METHOD(ReadUInt64) {

  Local<Value> buf = info[0];
  if (!Buffer::HasInstance(buf)) {
    return Nan::ThrowTypeError("readUInt64: Buffer instance expected");
  }

  int64_t offset = GetInt64(info[1]);
  char *ptr = Buffer::Data(buf.As<Object>()) + offset;

  if (ptr == NULL) {
    return Nan::ThrowTypeError("readUInt64: Cannot read from NULL pointer");
  }

  uint64_t val = *reinterpret_cast<uint64_t *>(ptr);

  Local<Value> rtn;
  if (val > JS_MAX_INT) {
    // return a String
    char strbuf[128];
    snprintf(strbuf, 128, "%" PRIu64, val);
    rtn = Nan::New<v8::String>(strbuf).ToLocalChecked();
  } else {
    // return a Number
    rtn = Nan::New<v8::Number>(static_cast<double>(val));
  }

  info.GetReturnValue().Set(rtn);
}

/*
 * Writes the input Number/String uint64 value as a machine-endian uint64_t to
 * the given Buffer at the given offset.
 *
 * info[0] - Buffer - the "buf" Buffer instance to write to
 * info[1] - Number - the offset from the "buf" buffer's address to write to
 * info[2] - String/Number - the "input" String or Number which will be written
 */

NAN_METHOD(WriteUInt64) {

  Local<Value> buf = info[0];
  if (!Buffer::HasInstance(buf)) {
    return Nan::ThrowTypeError("writeUInt64: Buffer instance expected");
  }

  int64_t offset = GetInt64(info[1]);
  char *ptr = Buffer::Data(buf.As<Object>()) + offset;

  Local<Value> in = info[2];
  uint64_t val;
  if (in->IsNumber()) {
    val = GetInt64(in);
  } else if (in->IsString()) {
    char *endptr, *str;
    int base = 0;

#if defined(V8_MAJOR_VERSION) && (V8_MAJOR_VERSION > 6 ||                      \
  (V8_MAJOR_VERSION == 6 && defined(V8_MINOR_VERSION) && V8_MINOR_VERSION > 2))
    String::Utf8Value _str(info.GetIsolate(), in);
#else
    String::Utf8Value _str(in);
#endif
    str = *_str;

    errno = 0;     /* To distinguish success/failure after call */
    val = strtoull(str, &endptr, base);

    if (endptr == str) {
      return Nan::ThrowTypeError("writeUInt64: no digits we found in input String");
    } else if (errno == ERANGE && val == ULLONG_MAX) {
      return Nan::ThrowTypeError("writeUInt64: input String numerical value out of range");
    } else if (errno != 0 && val == 0) {
      char errmsg[200];
      snprintf(errmsg, sizeof(errmsg), "writeUInt64: %s", strerror(errno));
      return Nan::ThrowTypeError(errmsg);
    }
  } else {
    return Nan::ThrowTypeError("writeUInt64: Number/String 64-bit value required");
  }

  *reinterpret_cast<uint64_t *>(ptr) = val;

  info.GetReturnValue().SetUndefined();
}

/*
 * Reads a Utf8 C String from the given pointer at the given offset (or 0).
 * I didn't want to add this function but it ends up being necessary for reading
 * past a 0 or 1 length Buffer's boundary in node-ffi :\
 *
 * info[0] - Buffer - the "buf" Buffer instance to read from
 * info[1] - Number - the offset from the "buf" buffer's address to read from
 */

NAN_METHOD(ReadCString) {

  Local<Value> buf = info[0];
  if (!Buffer::HasInstance(buf)) {
    return Nan::ThrowTypeError("readCString: Buffer instance expected");
  }

  int64_t offset = GetInt64(info[1]);
  char *ptr = Buffer::Data(buf.As<Object>()) + offset;

  if (ptr == NULL) {
    return Nan::ThrowError("readCString: Cannot read from NULL pointer");
  }

  Local<Value> rtn = Nan::New<v8::String>(ptr).ToLocalChecked();
  info.GetReturnValue().Set(rtn);
}

/*
 * Returns a new Buffer instance that has the same memory address
 * as the given buffer, but with the specified size.
 *
 * info[0] - Buffer - the "buf" Buffer instance to read the address from
 * info[1] - Number - the size in bytes that the returned Buffer should be
 * info[2] - Number - the offset from the "buf" buffer's address to read from
 */

NAN_METHOD(ReinterpretBuffer) {

  Local<Value> buf = info[0];
  if (!Buffer::HasInstance(buf)) {
    return Nan::ThrowTypeError("reinterpret: Buffer instance expected");
  }

  int64_t offset = GetInt64(info[2]);
  char *ptr = Buffer::Data(buf.As<Object>()) + offset;

  if (ptr == NULL) {
    return Nan::ThrowError("reinterpret: Cannot reinterpret from NULL pointer");
  }

#if defined(V8_MAJOR_VERSION) && (V8_MAJOR_VERSION > 4 ||                      \
  (V8_MAJOR_VERSION == 4 && defined(V8_MINOR_VERSION) && V8_MINOR_VERSION > 3))
  v8::Isolate *isolate = info.GetIsolate();
  size_t size = info[1]->Uint32Value(isolate->GetCurrentContext()).FromJust();
#else
  size_t size = info[1]->Uint32Value();
#endif

  info.GetReturnValue().Set(WrapPointer(ptr, size));
}

/*
 * Returns a new Buffer instance that has the same memory address
 * as the given buffer, but with a length up to the first aligned set of values of
 * 0 in a row for the given length.
 *
 * info[0] - Buffer - the "buf" Buffer instance to read the address from
 * info[1] - Number - the number of sequential 0-byte values that need to be read
 * info[2] - Number - the offset from the "buf" buffer's address to read from
 */

NAN_METHOD(ReinterpretBufferUntilZeros) {

  Local<Value> buf = info[0];
  if (!Buffer::HasInstance(buf)) {
    return Nan::ThrowTypeError("reinterpretUntilZeros: Buffer instance expected");
  }

  int64_t offset = GetInt64(info[2]);
  char *ptr = Buffer::Data(buf.As<Object>()) + offset;

  if (ptr == NULL) {
    return Nan::ThrowError("reinterpretUntilZeros: Cannot reinterpret from NULL pointer");
  }

#if defined(V8_MAJOR_VERSION) && (V8_MAJOR_VERSION > 4 ||                      \
  (V8_MAJOR_VERSION == 4 && defined(V8_MINOR_VERSION) && V8_MINOR_VERSION > 3))
  v8::Isolate *isolate = info.GetIsolate();
  uint32_t numZeros = info[1]->Uint32Value(
    isolate->GetCurrentContext()).FromJust();
#else
  uint32_t numZeros = info[1]->Uint32Value();
#endif
  uint32_t i = 0;
  size_t size = 0;
  bool end = false;

  while (!end && size < kMaxLength) {
    end = true;
    for (i = 0; i < numZeros; i++) {
      if (ptr[size + i] != 0) {
        end = false;
        break;
      }
    }
    if (!end) {
      size += numZeros;
    }
  }

  info.GetReturnValue().Set(WrapPointer(ptr, size));
}

/**
 * copy from a poiner container to another pointer container
 * info[0] - Buffer - the "dst" buffer instance to write to. The dst must contain an address to be writen into.
 * info[1] - Buffer - the "src" buffer instance to get from. The src must contain an address to be read from.
 * info[2] - Number - the "size" value which indicate copy size 
 */
NAN_METHOD(CopyMemoryI) {
    Nan::HandleScope scope;
    int state;
    state = info.Length() > 2 ? 0 : -1;
    if (state) {
        Nan::ThrowError("expect arguments length greater than 2");
    }
    if (state == 0) {
        state = node::Buffer::HasInstance(info[0]) ? 0 : -1;
        if (state) {
            Nan::ThrowError("expect 1st argument Array buffer view");
        }
    }
    if (state == 0) {
        state = node::Buffer::HasInstance(info[1]) ? 0 : -1;
        if (state) {
            Nan::ThrowError("expect 2nd argument Array buffer view");
        }
    }
    v8::Isolate* isolate;
    isolate = info.GetIsolate();
    v8::Local<Context> ctx = isolate->GetCurrentContext();

    if (state == 0) {
        uint32_t size = 0;
        v8::Maybe<uint32_t> sizeMaybe = info[2]->Uint32Value(ctx);
        if (sizeMaybe.IsJust()) {
            size = sizeMaybe.FromJust();
        }
        if (size > 0) {
            v8::Local<v8::Value> dst = info[0];
            v8::Local<v8::Value> src = info[1];
            void** dstPtrRef = reinterpret_cast<void**>(
                node::Buffer::Data(dst)); 
            void** srcPtrRef = reinterpret_cast<void**>(
                node::Buffer::Data(src));
            std::memcpy(*dstPtrRef, *srcPtrRef, size);
        } 
    }
}

/**
 * add displacement to external pointer
 * info[0] - Buffer - the "pointer" buffer instance.
 * info[1] - Number - the offset value to be added 
 */
NAN_METHOD(AddOffset) {
    Nan::HandleScope scope;
    int state;
    state = info.Length() > 1 ? 0 : -1;
    if (state) {
        Nan::ThrowError("expect arguments length greater than 1");
    }
    if (state == 0) {
        state = node::Buffer::HasInstance(info[0]) ? 0 : -1;
        if (state) {
            Nan::ThrowError("expect 1st argument Array buffer view");
        }
    }
    v8::Isolate* isolate;
    isolate = info.GetIsolate();
    v8::Local<Context> ctx = isolate->GetCurrentContext();

    if (state == 0) {
        int32_t offset = 0;
        v8::Maybe<int32_t> offsetMaybe = info[1]->Int32Value(ctx);
        if (offsetMaybe.IsJust()) {
            offset = offsetMaybe.FromJust();
        }
        if (offset) {
            v8::Local<v8::Value> ptrContainer = info[0];
            char** ptrRef = reinterpret_cast<char**>(
                node::Buffer::Data(ptrContainer)); 
            char* ptr = *ptrRef;
            ptr += offset;
            *ptrRef = ptr;
        } 
    }
}



} // anonymous namespace

NAN_MODULE_INIT(init) {
  Nan::HandleScope scope;

  // "sizeof" map
  Local<Object> smap = Nan::New<v8::Object>();
  // fixed sizes
#define SET_SIZEOF(name, type) \
  Nan::Set(smap, Nan::New<v8::String>( #name ).ToLocalChecked(),\
    Nan::New<v8::Uint32>(static_cast<uint32_t>(sizeof(type))))
  SET_SIZEOF(int8, int8_t);
  SET_SIZEOF(uint8, uint8_t);
  SET_SIZEOF(int16, int16_t);
  SET_SIZEOF(uint16, uint16_t);
  SET_SIZEOF(int32, int32_t);
  SET_SIZEOF(uint32, uint32_t);
  SET_SIZEOF(int64, int64_t);
  SET_SIZEOF(uint64, uint64_t);
  SET_SIZEOF(float, float);
  SET_SIZEOF(double, double);
  // (potentially) variable sizes
  SET_SIZEOF(bool, bool);
  SET_SIZEOF(byte, unsigned char);
  SET_SIZEOF(char, char);
  SET_SIZEOF(uchar, unsigned char);
  SET_SIZEOF(short, short);
  SET_SIZEOF(ushort, unsigned short);
  SET_SIZEOF(int, int);
  SET_SIZEOF(uint, unsigned int);
  SET_SIZEOF(long, long);
  SET_SIZEOF(ulong, unsigned long);
  SET_SIZEOF(longlong, long long);
  SET_SIZEOF(ulonglong, unsigned long long);
  SET_SIZEOF(pointer, char *);
  SET_SIZEOF(size_t, size_t);
  SET_SIZEOF(wchar_t, wchar_t);
  // size of a Persistent handle to a JS object
  SET_SIZEOF(Object, Nan::Persistent<Object>);

  // "alignof" map
  Local<Object> amap = Nan::New<v8::Object>();
#define SET_ALIGNOF(name, type) \
  struct s_##name { type a; }; \
  Nan::Set(amap, Nan::New<v8::String>( #name ).ToLocalChecked(), \
    Nan::New<v8::Uint32>(static_cast<uint32_t>(__alignof__(struct s_##name))))
  SET_ALIGNOF(int8, int8_t);
  SET_ALIGNOF(uint8, uint8_t);
  SET_ALIGNOF(int16, int16_t);
  SET_ALIGNOF(uint16, uint16_t);
  SET_ALIGNOF(int32, int32_t);
  SET_ALIGNOF(uint32, uint32_t);
  SET_ALIGNOF(int64, int64_t);
  SET_ALIGNOF(uint64, uint64_t);
  SET_ALIGNOF(float, float);
  SET_ALIGNOF(double, double);
  SET_ALIGNOF(bool, bool);
  SET_ALIGNOF(char, char);
  SET_ALIGNOF(uchar, unsigned char);
  SET_ALIGNOF(short, short);
  SET_ALIGNOF(ushort, unsigned short);
  SET_ALIGNOF(int, int);
  SET_ALIGNOF(uint, unsigned int);
  SET_ALIGNOF(long, long);
  SET_ALIGNOF(ulong, unsigned long);
  SET_ALIGNOF(longlong, long long);
  SET_ALIGNOF(ulonglong, unsigned long long);
  SET_ALIGNOF(pointer, char *);
  SET_ALIGNOF(size_t, size_t);
  SET_ALIGNOF(wchar_t, wchar_t);
  SET_ALIGNOF(Object, Nan::Persistent<Object>);

  // exports
  Nan::Set(target, Nan::New<v8::String>("sizeof").ToLocalChecked(), smap);
  Nan::Set(target, Nan::New<v8::String>("alignof").ToLocalChecked(), amap);
  Nan::DefineOwnProperty(
    target,
    Nan::New<v8::String>("endianness").ToLocalChecked(),
    Nan::New<v8::String>(CheckEndianness()).ToLocalChecked(),
    static_cast<PropertyAttribute>(ReadOnly|DontDelete));
  Nan::DefineOwnProperty(
    target, Nan::New<v8::String>("NULL").ToLocalChecked(),
    WrapNullPointer(),
    static_cast<PropertyAttribute>(ReadOnly|DontDelete));
  Nan::SetMethod(target, "address", Address);
  Nan::SetMethod(target, "hexAddress", HexAddress);
  Nan::SetMethod(target, "isNull", IsNull);
  Nan::SetMethod(target, "readObject", ReadObject);
  Nan::SetMethod(target, "writeObject", WriteObject);
  Nan::SetMethod(target, "readPointer", ReadPointer);
  Nan::SetMethod(target, "writePointer", WritePointer);
  Nan::SetMethod(target, "readInt64", ReadInt64);
  Nan::SetMethod(target, "writeInt64", WriteInt64);
  Nan::SetMethod(target, "readUInt64", ReadUInt64);
  Nan::SetMethod(target, "writeUInt64", WriteUInt64);
  Nan::SetMethod(target, "readCString", ReadCString);
  Nan::SetMethod(target, "reinterpret", ReinterpretBuffer);
  Nan::SetMethod(target, "reinterpretUntilZeros", ReinterpretBufferUntilZeros);
  Nan::SetMethod(target, "copyMemory", CopyMemoryI);
  Nan::SetMethod(target, "addOffset", AddOffset);
}
NAN_MODULE_WORKER_ENABLED(binding, init)
