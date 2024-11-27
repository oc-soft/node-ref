const assert = require('assert')
const ref = require('../')

describe('momory-operation', function() {

  it('should throw invalid argument exception - 1', function() {
    let gotEx = false
    try {
      ref.copyMemory()
    } catch (ex) {
      gotEx = true
    }
    assert(gotEx, 'expect get exception - 1')
  })
  it('should throw invalid argument exception - 2', function() {
    let gotEx = false
    try {
      ref.copyMemory(1)
    } catch (ex) {
      gotEx = true
    }
    assert(gotEx, 'expect get exception - 2')
  })
  it('should throw invalid argument exception - 3', function() {
    let gotEx = false
    try {
      ref.copyMemory(2, 1)
    } catch (ex) {
      gotEx = true
    }
    assert(gotEx, 'expect get exception - 3')
  })

  it('dest buffer should have "abc".', function() {

    const src = Buffer.from('abc') 
    const dst = Buffer.from('def')
    const srcContainer = Buffer.alloc(ref.sizeof.pointer)
    const dstContainer = Buffer.alloc(ref.sizeof.pointer)
    ref.writePointer(srcContainer, 0, src)
    ref.writePointer(dstContainer, 0, dst)
    ref.copyMemory(dstContainer, srcContainer, 3)
    assert(String.fromCharCode(dst[0], dst[1], dst[2]) == 'abc',
      'expect dest buffer has "abc"')
  }) 
  it('dest buffer should have "xyz".', function() {

    const src = Buffer.from('yza') 
    const dst = Buffer.from('xef')
    const srcContainer = Buffer.alloc(ref.sizeof.pointer)
    const dstContainer = Buffer.alloc(ref.sizeof.pointer)
    ref.writePointer(srcContainer, 0, src)
    ref.writePointer(dstContainer, 0, dst)
    ref.addOffset(dstContainer, 1)
    ref.copyMemory(dstContainer, srcContainer, 2)
    assert(String.fromCharCode(dst[0], dst[1], dst[2]) == 'xyz',
      'expect dest buffer has "abc"')
  }) 
  it('read int pointer from offset 4', function() {
    const srcBuf = Buffer.alloc(4 + ref.types.int.size)
    ref.set(srcBuf, 4, 5, ref.types.int)
    const bufferPointer = ref.alloc(ref.refType(ref.types.void))
    bufferPointer.writePointer(srcBuf,  0)
    const intBuf = ref.readFromPointer(bufferPointer, 4, ref.types.int.size)
    intBuf.type = ref.types.int
    const value = intBuf.deref() 
    assert(value == 5, 'expect value from pointer be 5') 
  })
})

// vi: se ts=2 sw=2 et:
