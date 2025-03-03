
var assert = require('assert')
var ref = require('../')

describe('isNull', function () {

  it('should return "true" for the NULL pointer', function () {
    assert.strictEqual(true, ref.isNull(ref.NULL))
  })

  it('should return "false" for a valid Buffer', function () {
    var buf = Buffer.from('hello')
    assert.strictEqual(false, ref.isNull(buf))
  })

  it('should return "true" for a bufffer containing null', function() {
    const buf = Buffer.alloc(ref.sizeof.pointer * 2, 0)
    assert.strictEqual(true, ref.containsNullPointer(buf, ref.sizeof.pointer))
  })

})
