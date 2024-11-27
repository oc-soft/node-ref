var assert = require('assert')
var ref = require('../')

describe('ref(), deref() with external pointer', function () {

  it('should read int value from external pointer', function() {
    const intBuf = ref.alloc(ref.types.int, 5)
    const intRefBuf = ref.alloc(
      ref.refType(ref.types.int), intBuf) 
    intRefBuf.external = true
    assert.equal(intRefBuf.type.indirection, 2,
      'test buffer must have indirection 2')
    assert.equal(intRefBuf.deref().deref(), 5, 
      'expect external ')
  }) 

}) 
// vi: se ts=2 sw=2 et:
