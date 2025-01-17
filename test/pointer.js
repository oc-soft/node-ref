
var assert = require('assert')
var weak = require('weak')
var ref = require('../')

describe('pointer', function () {

  var test = Buffer.from('hello world')

  beforeEach(gc)

  it('should write and read back a pointer (Buffer) in a Buffer', function () {
    var buf = Buffer.alloc(ref.sizeof.pointer)
    ref.writePointer(buf, 0, test)
    var out = ref.readPointer(buf, 0, test.length)
    assert.strictEqual(out.length, test.length)
    for (var i = 0, l = out.length; i < l; i++) {
      assert.strictEqual(out[i], test[i])
    }
    assert.strictEqual(ref.address(out), ref.address(test))
  })

  it('should retain references to a written pointer in a Buffer', function (done) {
    var child_gc = false
    var parent_gc = false
    var child = Buffer.from('a pointer holding some data...')
    var parent = Buffer.alloc(ref.sizeof.pointer)

    weak(child, function () { child_gc = true })
    weak(parent, function () { parent_gc = true })
    ref.writePointer(parent, 0, child)
    assert(!child_gc, '"child" has been garbage collected too soon')
    assert(!parent_gc, '"parent" has been garbage collected too soon')

    // try to GC `child`
    child = null
    gc()
    assert(!child_gc, '"child" has been garbage collected too soon')
    assert(!parent_gc, '"parent" has been garbage collected too soon')

    // now GC `parent`
    parent = null
    setImmediate(function () {
      gc()
      assert(parent_gc, '"parent" has not been garbage collected')
      assert(child_gc, '"child" has not been garbage collected')
      done()
    });
  })

  it('should throw an Error when reading from the NULL pointer', function () {
    assert.throws(function () {
      ref.NULL.readPointer()
    })
  })

  it('should return a 0-length Buffer when reading a NULL pointer', function () {
    var buf = Buffer.alloc(ref.sizeof.pointer)
    ref.writePointer(buf, 0, ref.NULL)
    var out = ref.readPointer(buf, 0, 100)
    assert.strictEqual(out.length, 0)
  })

  describe('offset', function () {

    it('should read two pointers next to each other in memory', function () {
      var buf = Buffer.alloc(ref.sizeof.pointer * 2)
      var a = Buffer.from('hello')
      var b = Buffer.from('world')
      buf.writePointer(a, 0 * ref.sizeof.pointer)
      buf.writePointer(b, 1 * ref.sizeof.pointer)
      var _a = buf.readPointer(0 * ref.sizeof.pointer)
      var _b = buf.readPointer(1 * ref.sizeof.pointer)
      assert.equal(a.address(), _a.address())
      assert.equal(b.address(), _b.address())
    })

  })

  describe('compare', function() {
    it('should not equals pointer', function() {
      const buf1 = Buffer.alloc(ref.sizeof.pointer)
      const buf2 = Buffer.alloc(ref.sizeof.pointer)
      const a = Buffer.from('hello')
      const b = Buffer.from('world')
      buf1.writePointer(a, 0 * ref.sizeof.pointer)
      buf2.writePointer(b, 0 * ref.sizeof.pointer)
      assert.notEqual(ref.comparePointer(buf1, buf2), 0,
        'expect two pointers do not equals 0')
    })
    it('should equals pointer', function() {
      const buf1 = Buffer.alloc(ref.sizeof.pointer)
      const a = Buffer.from('hello')
      buf1.writePointer(a, 0 * ref.sizeof.pointer)
      buf1.writePointer(a, 1 * ref.sizeof.pointer)
      assert.notEqual(ref.comparePointer(
        buf1, buf1, 0, 1 * ref.sizeof.pointer), 0,
        'expect two pointers equals 0')
    })
  })
})
