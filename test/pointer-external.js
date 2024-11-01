var assert = require('assert')
var weak = require('weak')
var ref = require('../')

describe('pointer-external', function() {
  var test = Buffer.from('hello world')

  beforeEach(gc)

  it('should write and read back a pointer (Buffer) in a Buffer', function () {
    var buf = Buffer.alloc(ref.sizeof.pointer)
    ref.writePointer(buf, 0, test)
    var out = ref.readPointer(buf, 0, test.length, true)
    assert.strictEqual(ref.address(out, 0, true), ref.address(test))
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


  it('should return a pointer length Buffer when reading a NULL pointer', function () {
    var buf = Buffer.alloc(ref.sizeof.pointer)
    ref.writePointer(buf, 0, ref.NULL, true)
    var out = ref.readPointer(buf, 0, 100, true)
    assert.strictEqual(out.length, ref.sizeof.pointer)
  })

  describe('offset', function () {

    it('should read two pointers next to each other in memory', function () {
      var buf = Buffer.alloc(ref.sizeof.pointer * 2)
      var a = Buffer.from('hello')
      var b = Buffer.from('world')
      buf.writePointer(a, 0 * ref.sizeof.pointer)
      buf.writePointer(b, 1 * ref.sizeof.pointer)
      var _a = buf.readPointer(0 * ref.sizeof.pointer, true)
      var _b = buf.readPointer(1 * ref.sizeof.pointer, 0, true)
      assert.equal(a.address(), _a.address(true))
      assert.equal(b.address(), _b.address(true))
    })
  })

  it('expects original pointer equals external pointer from buffer', function() {
      var buf = Buffer.alloc(ref.sizeof.pointer * 2)
      var a0 = Buffer.from('hello')
      var b0 = Buffer.from('world')
      var a = Buffer.alloc(ref.sizeof.pointer)
      var b = Buffer.alloc(ref.sizeof.pointer)
      a.writePointer(a0)
      b.writePointer(b0, 0)

      buf.writePointer(a, 0 * ref.sizeof.pointer, true)
      buf.writePointer(b, 1 * ref.sizeof.pointer, true)
      var _a = buf.readPointer(0 * ref.sizeof.pointer, true)
      var _b = buf.readPointer(1 * ref.sizeof.pointer, 0, true)
      assert.equal(a0.address(), _a.address(true))
      assert.equal(b0.address(), _b.address(true))
  })
})
