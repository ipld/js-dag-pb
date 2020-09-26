/* eslint-env mocha */

import chai from 'chai'
import encodeNode from '../pb-encode.js'
import decodeNode from '../pb-decode.js'
import multiformats from 'multiformats/basics'

const { bytes } = multiformats
const { assert } = chai
const acidBytes = Uint8Array.from([1, 85, 0, 5, 0, 1, 2, 3, 4])

describe('Edge cases', () => {
  it('fail to encode large int', () => {
    // sanity check maximum forms

    let form = { Links: [{ Hash: acidBytes, Tsize: Number.MAX_SAFE_INTEGER - 1 }] }
    let expected = '12140a0901550005000102030418feffffffffffff0f'
    assert.strictEqual(bytes.toHex(encodeNode(form)), expected)
    assert.deepEqual(decodeNode(bytes.fromHex(expected)), form)

    form = { Links: [{ Hash: acidBytes, Tsize: Number.MAX_SAFE_INTEGER }] }
    expected = '12140a0901550005000102030418ffffffffffffff0f'
    assert.strictEqual(bytes.toHex(encodeNode(form)), expected)
    assert.deepEqual(decodeNode(bytes.fromHex(expected)), form)

    // too big, we can decode but not encode, it's a tiny bit too hard to bother
    form = { Links: [{ Hash: acidBytes, Tsize: Number.MAX_SAFE_INTEGER + 1 }] }
    expected = '12140a09015500050001020304188080808080808010'
    assert.throws(() => encodeNode(form), /too large/)
    assert.deepEqual(decodeNode(bytes.fromHex(expected)), form)
  })

  it('fail to encode negative large', () => {
    assert.throws(() => {
      encodeNode({ Links: [{ Hash: acidBytes, Tsize: -1 }] })
    }, /negative/)
  })
})