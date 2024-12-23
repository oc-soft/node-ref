
var assert = require('assert')
var ref = require('../')

describe('types', function () {

  describe('refType()', function () {

    it('should return a new "type" with its `indirection` level increased by 1', function () {
      var int = ref.types.int
      var intPtr = ref.refType(int)
      assert.equal(int.size, intPtr.size)
      assert.equal(int.indirection + 1, intPtr.indirection)
    })

    it('should coerce string types', function () {
      var intPtr = ref.refType('int')
      assert.equal(2, intPtr.indirection)
      assert.equal(intPtr.size, ref.types.int.size)
    })

    it('should override and update a read-only name property', function () {
      // a type similar to ref-struct's StructType
      // used for types refType name property test
      function StructType() {}
      StructType.size = 0
      StructType.indirection = 0

      // read-only name property
      assert.equal(StructType.name, 'StructType')
      try {
        StructType.name = 'foo'
      } catch (err) {
        // ignore
      }
      assert.equal(StructType.name, 'StructType')

      // name property should be writable and updated
      var newObj = ref.refType(StructType)
      var newProp = Object.getOwnPropertyDescriptor(newObj, 'name')
      assert.equal(newProp.writable, true)
      assert.equal(newObj.name, 'StructType*')
    })
    it('should return a pointer type with external attribute', function() {
      var externalPtr = ref.coerceType('external')
      assert.equal(2, externalPtr.indirection)
      assert.equal(externalPtr.external, true)
    })
  })

  describe('derefType()', function () {

    it('should return a new "type" with its `indirection` level decreased by 1', function () {
      var intPtr = Object.create(ref.types.int)
      intPtr.indirection++
      var int = ref.derefType(intPtr)
      assert.equal(intPtr.size, intPtr.size)
      assert.equal(intPtr.indirection - 1, int.indirection)
    })

    it('should throw an Error when given a "type" with its `indirection` level already at 1', function () {
      assert.throws(function () {
        ref.derefType(ref.types.int)
      })
    })

  })

  describe('size', function () {
    Object.keys(ref.types).forEach(function (name) {
      if (name === 'void') return
      it('sizeof(' + name + ') should be >= 1', function () {
        var type = ref.types[name]
        assert.equal('number', typeof type.size)
        assert(type.size >= 1)
      })
    })
  })

  describe('alignment', function () {
    Object.keys(ref.types).forEach(function (name) {
      if (name === 'void') return
      it('alignof(' + name + ') should be >= 1', function () {
        var type = ref.types[name]
        assert.equal('number', typeof type.alignment)
        assert(type.alignment >= 1)
      })
    })
  })

})
