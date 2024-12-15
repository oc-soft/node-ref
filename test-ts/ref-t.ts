import * as ref from '../'
import * as assert from 'node:assert'
import { Buffer } from 'node:buffer'

function checkTypes() {
  assert.equal(typeof ref.types.int.size, 'number', 'type.int has size') 
}

function checkFunctions()  {
  const strBuf = ref.allocCString('Hello world')

  assert.ok(strBuf instanceof Buffer, 'allocCString return Buffer instance')

}

checkTypes()
checkFunctions()

// vi: se ts=2 sw=2 et:
