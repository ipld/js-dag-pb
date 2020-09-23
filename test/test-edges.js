/* eslint-env mocha */

import chai from 'chai'
import encodeNode from '../pb-encode.js'
// import decodeNode from '../pb-decode.js'
import multiformats from 'multiformats/basics'

const { bytes } = multiformats
const { assert } = chai
const acidBytes = Uint8Array.from([1, 85, 0, 5, 0, 1, 2, 3, 4])

describe('Edge cases', () => {
  it('fail to encode large int', () => {
    // sanity check maximum form
    assert.strictEqual(
      bytes.toHex(encodeNode({ Links: [{ Hash: acidBytes, Tsize: (2 ** 31) - 1 }] })),
      '12110a0901550005000102030418ffffffff07'
    )
    assert.throws(() => {
      encodeNode({ Links: [{ Hash: acidBytes, Tsize: 2 ** 31 }] })
    }, /too large/)
  })

  it('fail to encode negative large', () => {
    assert.throws(() => {
      encodeNode({ Links: [{ Hash: acidBytes, Tsize: -1 }] })
    }, /negative/)
  })
})
