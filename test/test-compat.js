/* eslint-env mocha */

// tests mirrored in go-merkledag/pb/forms_test.go

import chai from 'chai'
import dagPB from '@ipld/dag-pb'
import multiformats from 'multiformats/basics'
import encodeNode from '../pb-encode.js'

const { assert } = chai

const { multicodec, CID, bytes } = multiformats
multicodec.add(dagPB)
// multihash.add({ code: 0, name: 'identity', encode: (e) => e, decode: (d) => d })

const encode = (v) => multicodec.encode(v, 'dag-pb')
const decode = (v) => multicodec.decode(v, 'dag-pb')

function verifyRoundTrip (testCase, bypass) {
  const actualBytes = (bypass ? encodeNode : encode)(testCase.node)
  assert.strictEqual(bytes.toHex(actualBytes), testCase.expectedBytes)
  const roundTripNode = decode(actualBytes)
  if (roundTripNode.Data) {
    roundTripNode.Data = bytes.toHex(roundTripNode.Data)
  }
  if (roundTripNode.Links) {
    for (const link of roundTripNode.Links) {
      if (link.Hash) {
        // they're CIDs which don't stringify well
        // or consistent with our fixtures
        link.Hash = bytes.toHex(link.Hash.bytes)
      }
    }
  }
  const actualForm = JSON.stringify(roundTripNode, null, 2)
  assert.strictEqual(actualForm, testCase.expectedForm)
}

describe('Forms', () => {
  it('empty', () => {
    verifyRoundTrip({
      node: {},
      expectedBytes: '',
      expectedForm: '{}'
    })
  })

  it('Data zero', () => {
    verifyRoundTrip({
      node: { Data: new Uint8Array(0) },
      expectedBytes: '0a00',
      expectedForm: `{
  "Data": ""
}`
    })
  })

  it('Data some', () => {
    verifyRoundTrip({
      node: { Data: Uint8Array.from([0, 1, 2, 3, 4]) },
      expectedBytes: '0a050001020304',
      expectedForm: `{
  "Data": "0001020304"
}`
    })
  })

  // this is excluded from the spec, it must be undefined
  it('Links zero', () => {
    const testCase = {
      node: { Links: [] },
      expectedBytes: '',
      expectedForm: '{}'
    }
    assert.throws(() => verifyRoundTrip(testCase), /Links/)
    // bypass straight to encode and it should verify the bytes
    verifyRoundTrip(testCase, true)
  })

  // this is excluded from the spec, it must be undefined
  it('Data some Links zero', () => {
    const testCase = {
      node: { Data: Uint8Array.from([0, 1, 2, 3, 4]), Links: [] },
      expectedBytes: '0a050001020304',
      expectedForm: `{
  "Data": "0001020304"
}`
    }
    assert.throws(() => verifyRoundTrip(testCase), /Links/)
    // bypass straight to encode and it should verify the bytes
    verifyRoundTrip(testCase, true)
  })

  it('Links empty', () => {
    verifyRoundTrip({
      node: { Links: [{}] },
      expectedBytes: '1200',
      expectedForm: `{
  "Links": [
    {}
  ]
}`
    })
  })

  it('Data some Links empty', () => {
    verifyRoundTrip({
      node: { Data: Uint8Array.from([0, 1, 2, 3, 4]), Links: [{}] },
      expectedBytes: '12000a050001020304',
      expectedForm: `{
  "Data": "0001020304",
  "Links": [
    {}
  ]
}`
    })
  })

  // this is excluded from the spec, it must be a CID bytes
  it('Links Hash zero', () => {
    const testCase = {
      node: { Links: [{ Hash: new Uint8Array(0) }] },
      expectedBytes: '12020a00',
      expectedForm: `{
  "Links": [
    {
      "Hash": ""
    }
  ]
}`
    }
    assert.throws(() => verifyRoundTrip(testCase), /CID/)
    // should still error, but in the decoder which can't read this as a CID
    assert.throws(() => verifyRoundTrip(testCase, true), /decode/)
  })

  it('Links Hash some', () => {
    // Hash is raw+identity 0x0001020304 CID(bafkqabiaaebagba)
    verifyRoundTrip({
      node: {
        Links: [{
          Hash: new CID(Uint8Array.from([1, 85, 0, 5, 0, 1, 2, 3, 4]))
        }]
      },
      expectedBytes: '120b0a09015500050001020304',
      expectedForm: `{
  "Links": [
    {
      "Hash": "015500050001020304"
    }
  ]
}`
    })
  })

  it('Links Name zero', () => {
    verifyRoundTrip({
      node: { Links: [{ Name: '' }] },
      expectedBytes: '12021200',
      expectedForm: `{
  "Links": [
    {
      "Name": ""
    }
  ]
}`
    })
  })

  it('Links Name some', () => {
    verifyRoundTrip({
      node: { Links: [{ Name: 'some name' }] },
      expectedBytes: '120b1209736f6d65206e616d65',
      expectedForm: `{
  "Links": [
    {
      "Name": "some name"
    }
  ]
}`
    })
  })

  it('Links Tsize zero', () => {
    verifyRoundTrip({
      node: { Links: [{ Tsize: 0 }] },
      expectedBytes: '12021800',
      expectedForm: `{
  "Links": [
    {
      "Tsize": 0
    }
  ]
}`
    })
  })

  it('Links Name some', () => {
    verifyRoundTrip({
      node: { Links: [{ Tsize: 1010 }] },
      expectedBytes: '120318f207',
      expectedForm: `{
  "Links": [
    {
      "Tsize": 1010
    }
  ]
}`
    })
  })
})
