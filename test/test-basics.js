/* eslint-env mocha */

import chai from 'chai'
import chaiSubset from 'chai-subset'
import dagPB from '@ipld/dag-pb'
import multiformats from 'multiformats/basics'
import base58 from 'multiformats/bases/base58'

chai.use(chaiSubset)
const { assert } = chai

const { CID, multicodec, multibase, bytes } = multiformats
multibase.add(base58)
multicodec.add(dagPB)

const encode = (v) => multicodec.encode(v, 'dag-pb')
const decode = (v) => multicodec.decode(v, 'dag-pb')
const { prepare, validate } = dagPB(multiformats)

function linkCidsToStrings (links) {
  return links.map((l) => {
    return {
      Name: l.Name,
      Tsize: l.Tsize,
      Hash: l.Hash.toString()
    }
  })
}

describe('dag-pb', () => {
  it('prepare & encode an empty node', () => {
    const prepared = prepare({})
    assert.deepEqual(prepared, { Data: null, Links: null })
    const result = encode(prepared)
    assert.instanceOf(result, Uint8Array)
    assert.strictEqual(result.length, 0)
  })

  it('prepare & encode a node with data', () => {
    const data = Uint8Array.from([0, 1, 2, 3, 4])
    const prepared = prepare({ Data: data })
    assert.deepEqual(prepared, { Data: data, Links: null })
    const result = encode(prepared)
    assert.instanceOf(result, Uint8Array)

    const node = decode(result)
    assert.deepEqual(node.Data, data)
  })

  it('prepare & encode a node with links', () => {
    const links = [
      { Hash: CID.from('QmWDtUQj38YLW8v3q4A6LwPn4vYKEbuKWpgSm6bjKW6Xfe') }
    ]
    const prepared = prepare({ Links: links })
    assert.deepEqual(prepared, { Data: null, Links: [{ Hash: links[0].Hash, Name: null, Tsize: null }] })
    const result = encode(prepared)
    assert.instanceOf(result, Uint8Array)

    const node = decode(result)
    assert.containSubset(linkCidsToStrings(node.Links), linkCidsToStrings([{
      Name: null,
      Tsize: null,
      Hash: CID.from('QmWDtUQj38YLW8v3q4A6LwPn4vYKEbuKWpgSm6bjKW6Xfe')
    }]))
  })

  it('prepare & encode a node with links as plain objects', () => {
    const links = [{
      Name: null,
      Tsize: null,
      Hash: CID.from('QmWDtUQj38YLW8v3q4A6LwPn4vYKEbuKWpgSm6bjKW6Xfe')
    }]
    const prepared = prepare({ Links: links })
    assert.deepEqual(prepared, { Data: null, Links: [{ Hash: links[0].Hash, Name: null, Tsize: null }] })
    const result = encode(prepared)
    assert.instanceOf(result, Uint8Array)

    const node = decode(result)
    assert.containSubset(linkCidsToStrings(node.Links), linkCidsToStrings(links))
  })

  it('ignore invalid properties when preparing', () => {
    const prepared = prepare({ foo: 'bar' })
    assert.deepEqual(prepared, { Data: null, Links: null })
    const result = encode(prepared)
    assert.strictEqual(result.length, 0)
  })

  it('prepare & create a node with string data', () => {
    const data = 'some data'
    const prepared = prepare({ Data: data })
    assert.deepEqual(prepared, { Data: new TextEncoder().encode(data), Links: null })
    const serialized = encode(prepared)
    const deserialized = decode(serialized)
    assert.deepEqual(deserialized.Data, new TextEncoder().encode('some data'))
  })

  it('prepare & create a node with bare string', () => {
    const data = 'some data'
    const prepared = prepare(data)
    assert.deepEqual(prepared, { Data: new TextEncoder().encode(data), Links: null })
    const serialized = encode(prepared)
    const deserialized = decode(serialized)
    assert.deepEqual(deserialized.Data, new TextEncoder().encode('some data'))
  })

  it('prepare & create a node with links (& sorting)', () => {
    const origLinks = [{
      Name: 'some other link',
      Hash: CID.from('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39V'),
      Tsize: 8
    }, {
      Name: 'some link',
      Hash: CID.from('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U'),
      Tsize: 100000000
    }]

    const someData = new TextEncoder().encode('some data')

    const node = {
      Data: someData,
      Links: origLinks.map(({ Name, Tsize, Hash }) => {
        return { Name, Tsize, Hash }
      })
    }

    const prepared = prepare(node)
    assert.deepEqual(prepared.Links.map((l) => l.Name), [
      'some link',
      'some other link'
    ])
    const reconstituted = decode(encode(prepared))

    // check sorting
    assert.deepEqual(reconstituted.Links.map((l) => l.Name), [
      'some link',
      'some other link'
    ])
  })

  it('prepare & create a node with stable sorted links', () => {
    const links = [{
      Name: '',
      Hash: CID.from('QmUGhP2X8xo9dsj45vqx1H6i5WqPqLqmLQsHTTxd3ke8mp'),
      Tsize: 262158
    }, {
      Name: '',
      Hash: CID.from('QmP7SrR76KHK9A916RbHG1ufy2TzNABZgiE23PjZDMzZXy'),
      Tsize: 262158
    }, {
      Name: '',
      Hash: CID.from('QmQg1v4o9xdT3Q14wh4S7dxZkDjyZ9ssFzFzyep1YrVJBY'),
      Tsize: 262158
    }, {
      Name: '',
      Hash: CID.from('QmdP6fartWRrydZCUjHgrJ4XpxSE4SAoRsWJZ1zJ4MWiuf'),
      Tsize: 262158
    }, {
      Name: '',
      Hash: CID.from('QmNNjUStxtMC1WaSZYiDW6CmAUrvd5Q2e17qnxPgVdwrwW'),
      Tsize: 262158
    }, {
      Name: '',
      Hash: CID.from('QmWJwqZBJWerHsN1b7g4pRDYmzGNnaMYuD3KSbnpaxsB2h'),
      Tsize: 262158
    }, {
      Name: '',
      Hash: CID.from('QmRXPSdysBS3dbUXe6w8oXevZWHdPQWaR2d3fggNsjvieL'),
      Tsize: 262158
    }, {
      Name: '',
      Hash: CID.from('QmTUZAXfws6zrhEksnMqLxsbhXZBQs4FNiarjXSYQqVrjC'),
      Tsize: 262158
    }, {
      Name: '',
      Hash: CID.from('QmNNk7dTdh8UofwgqLNauq6N78DPc6LKK2yBs1MFdx7Mbg'),
      Tsize: 262158
    }, {
      Name: '',
      Hash: CID.from('QmW5mrJfyqh7B4ywSvraZgnWjS3q9CLiYURiJpCX3aro5i'),
      Tsize: 262158
    }, {
      Name: '',
      Hash: CID.from('QmTFHZL5CkgNz19MdPnSuyLAi6AVq9fFp81zmPpaL2amED'),
      Tsize: 262158
    }]

    const node = { Data: new TextEncoder().encode('some data'), Links: links }
    const prepared = prepare(node)
    assert.deepEqual(prepared, node)
    const reconstituted = decode(encode(node))

    // check sorting
    assert.deepEqual(reconstituted.Links.map((l) => l.Hash), links.map(l => l.Hash))
  })

  it('prepare & create with empty link name', () => {
    const node = {
      Data: new TextEncoder().encode('hello'),
      Links: [
        CID.from('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U')
      ]
    }
    const expected = { Data: node.Data, Links: [{ Name: null, Tsize: null, Hash: node.Links[0] }] }
    const prepared = prepare(node)
    assert.deepEqual(prepared, expected)
    const reconstituted = decode(encode(prepared))
    assert.strictEqual(reconstituted.Links[0].Name, null)
    assert.deepEqual(reconstituted, expected)
  })

  it('prepare & create with undefined link name', () => {
    const node = {
      Data: new TextEncoder().encode('hello'),
      Links: [
        { Tsize: 10, Hash: CID.from('QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U'), Name: null }
      ]
    }
    const prepared = prepare(node)
    assert.deepEqual(prepared, node)
    const reconstituted = decode(encode(prepared))
    assert.deepEqual(reconstituted, node)
  })

  it('prepare & create a node with bytes only', () => {
    const node = new TextEncoder().encode('hello')
    const reconstituted = decode(encode(prepare(node)))
    assert.deepEqual(reconstituted, { Data: new TextEncoder().encode('hello'), Links: null })
  })

  it('prepare & create an empty node', () => {
    const node = new Uint8Array(0)
    const prepared = prepare(node)
    assert.deepEqual(prepared, { Data: null, Links: null })
    const reconstituted = decode(encode(prepared))
    assert.deepEqual(reconstituted, { Data: null, Links: null })
  })

  it('prepare & create an empty node from object', () => {
    const prepared = prepare({})
    assert.deepEqual(prepared, { Data: null, Links: null })
    const reconstituted = decode(encode(prepared))
    assert.deepEqual(reconstituted, { Data: null, Links: null })
  })

  it('fail to prepare & create a node with other data types', () => {
    const invalids = [
      [],
      true,
      100,
      () => {},
      Symbol.for('nope')
    ]

    for (const invalid of invalids) {
      assert.throws(() => encode(prepare(invalid)), 'Invalid DAG-PB form')
    }
  })

  it('deserialize go-ipfs block with unnamed links', async () => {
    const testBlockUnnamedLinks = bytes.fromHex('122b0a2212203f29086b59b9e046b362b4b19c9371e834a9f5a80597af83be6d8b7d1a5ad33b120018aed4e015122b0a221220ae1a5afd7c770507dddf17f92bba7a326974af8ae5277c198cf13206373f7263120018aed4e015122b0a22122022ab2ebf9c3523077bd6a171d516ea0e1be1beb132d853778bcc62cd208e77f1120018aed4e015122b0a22122040a77fe7bc69bbef2491f7633b7c462d0bce968868f88e2cbcaae9d0996997e8120018aed4e015122b0a2212206ae1979b14dd43966b0241ebe80ac2a04ad48959078dc5affa12860648356ef6120018aed4e015122b0a221220a957d1f89eb9a861593bfcd19e0637b5c957699417e2b7f23c88653a240836c4120018aed4e015122b0a221220345f9c2137a2cd76d7b876af4bfecd01f80b7dd125f375cb0d56f8a2f96de2c31200189bfec10f0a2b080218cbc1819201208080e015208080e015208080e015208080e015208080e015208080e01520cbc1c10f')

    const expectedLinks = [
      {
        Name: '',
        Hash: CID.from('QmSbCgdsX12C4KDw3PDmpBN9iCzS87a5DjgSCoW9esqzXk'),
        Tsize: 45623854
      },
      {
        Name: '',
        Hash: CID.from('Qma4GxWNhywSvWFzPKtEswPGqeZ9mLs2Kt76JuBq9g3fi2'),
        Tsize: 45623854
      },
      {
        Name: '',
        Hash: CID.from('QmQfyxyys7a1e3mpz9XsntSsTGc8VgpjPj5BF1a1CGdGNc'),
        Tsize: 45623854
      },
      {
        Name: '',
        Hash: CID.from('QmSh2wTTZT4N8fuSeCFw7wterzdqbE93j1XDhfN3vQHzDV'),
        Tsize: 45623854
      },
      {
        Name: '',
        Hash: CID.from('QmVXsSVjwxMsCwKRCUxEkGb4f4B98gXVy3ih3v4otvcURK'),
        Tsize: 45623854
      },
      {
        Name: '',
        Hash: CID.from('QmZjhH97MEYwQXzCqSQbdjGDhXWuwW4RyikR24pNqytWLj'),
        Tsize: 45623854
      },
      {
        Name: '',
        Hash: CID.from('QmRs6U5YirCqC7taTynz3x2GNaHJZ3jDvMVAzaiXppwmNJ'),
        Tsize: 32538395
      }
    ]

    const node = decode(testBlockUnnamedLinks)
    assert.deepEqual(node.Links, expectedLinks)

    // not a lot of point to this but we are testing that `code` is correct
    const hash = await multiformats.multihash.hash(testBlockUnnamedLinks, 'sha2-256')
    const cid = CID.create(0, dagPB(multiformats).code, hash)
    assert.strictEqual(cid.toString(), 'QmQqy2SiEkKgr2cw5UbQ93TtLKEMsD8TdcWggR8q9JabjX')
  })

  it('deserialize go-ipfs block with named links', async () => {
    const testBlockNamedLinks = bytes.fromHex('12390a221220b4397c02da5513563d33eef894bf68f2ccdf1bdfc14a976956ab3d1c72f735a0120e617564696f5f6f6e6c792e6d346118cda88f0b12310a221220025c13fcd1a885df444f64a4a82a26aea867b1148c68cb671e83589f971149321208636861742e74787418e40712340a2212205d44a305b9b328ab80451d0daa72a12a7bf2763c5f8bbe327597a31ee40d1e48120c706c61796261636b2e6d3375187412360a2212202539ed6e85f2a6f9097db9d76cffd49bf3042eb2e3e8e9af4a3ce842d49dea22120a7a6f6f6d5f302e6d70341897fb8592010a020801')

    const expectedLinks = [
      {
        Name: 'audio_only.m4a',
        Hash: CID.from('QmaUAwAQJNtvUdJB42qNbTTgDpzPYD1qdsKNtctM5i7DGB'),
        Tsize: 23319629
      },
      {
        Name: 'chat.txt',
        Hash: CID.from('QmNVrxbB25cKTRuKg2DuhUmBVEK9NmCwWEHtsHPV6YutHw'),
        Tsize: 996
      },
      {
        Name: 'playback.m3u',
        Hash: CID.from('QmUcjKzDLXBPmB6BKHeKSh6ZoFZjss4XDhMRdLYRVuvVfu'),
        Tsize: 116
      },
      {
        Name: 'zoom_0.mp4',
        Hash: CID.from('QmQqy2SiEkKgr2cw5UbQ93TtLKEMsD8TdcWggR8q9JabjX'),
        Tsize: 306281879
      }
    ]

    const node = decode(testBlockNamedLinks)
    assert.deepEqual(node.Links, expectedLinks)

    // not a lot of point to this but we are testing that `code` is correct
    const hash = await multiformats.multihash.hash(testBlockNamedLinks, 'sha2-256')
    const cid = CID.create(0, dagPB(multiformats).code, hash)
    assert.strictEqual(cid.toString(), 'QmbSAC58x1tsuPBAoarwGuTQAgghKvdbKSBC8yp5gKCj5M')
  })

  it('prepare & create with multihash bytes', () => {
    const linkHash = bytes.fromHex('12208ab7a6c5e74737878ac73863cb76739d15d4666de44e5756bf55a2f9e9ab5f43')
    const link = {
      Name: 'hello',
      Tsize: 3,
      Hash: linkHash
    }

    const node = { Name: new TextEncoder().encode('some data'), Links: [link] }
    const prepared = prepare(node)
    assert.strictEqual(prepared.Links[0].Hash.toString(), 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U')
    const reconstituted = decode(encode(prepared))

    assert.strictEqual(reconstituted.Links[0].Hash.toString(), 'QmXg9Pp2ytZ14xgmQjYEiHjVjMFXzCVVEcRTWJBmLgR39U')
  })

  it('fail to create without hash', () => {
    assert.throws(() => {
      const node = {
        Name: new TextEncoder().encode('some data'),
        Links: [{ Name: 'hello', Tsize: 3 }]
      }
      prepare(node)
    }, 'Invalid DAG-PB form')
  })

  it('validate good forms', () => {
    const doesntThrow = (good) => {
      validate(good)
      const byts = encode(good)
      assert.instanceOf(byts, Uint8Array)
    }

    doesntThrow({ Data: null, Links: null })
    doesntThrow({ Data: Uint8Array.from([1, 2, 3]), Links: null })
    doesntThrow({ Data: null, Links: [{ Hash: null, Name: null, Tsize: null }] })
    doesntThrow({
      Data: null,
      Links: [
        { Hash: null, Name: null, Tsize: null },
        { Hash: null, Name: 'bar', Tsize: null },
        { Hash: null, Name: 'foo', Tsize: null }
      ]
    })
    doesntThrow({
      Data: null,
      Links: [
        { Hash: null, Name: null, Tsize: null },
        { Hash: null, Name: 'a', Tsize: null },
        { Hash: null, Name: 'a', Tsize: null }
      ]
    })
    const l = { Hash: null, Name: 'a', Tsize: null }
    doesntThrow({ Data: null, Links: [l, l] })
  })

  it('validate fails bad forms', () => {
    const throws = (bad) => {
      assert.throws(() => validate(bad))
      assert.throws(() => encode(bad))
    }

    for (const bad of [true, false, null, 0, 101, -101, 'blip', [], Infinity, Symbol.for('boop'), Uint8Array.from([1, 2, 3])]) {
      throws(bad)
    }

    throws({})

    // empty links array not allowed, should be null
    throws({ Data: null, Links: [] })

    throws({ Data: null, Links: null, extraneous: true })
    throws({ Data: null, Links: [{ Hash: null, Name: null, Tsize: null, extraneous: true }] })

    // bad Data forms
    for (const bad of [true, false, 0, 101, -101, 'blip', Infinity, Symbol.for('boop'), []]) {
      throws({ Data: bad, Links: null })
    }

    // bad Link array forms
    for (const bad of [true, false, 0, 101, -101, 'blip', Infinity, Symbol.for('boop'), Uint8Array.from([1, 2, 3])]) {
      throws({ Data: null, Links: bad })
    }

    // bad Link forms
    for (const bad of [true, false, 0, 101, -101, 'blip', {}, Infinity, Symbol.for('boop'), Uint8Array.from([1, 2, 3])]) {
      throws({ Data: null, Links: [bad] })
    }

    // bad Link.Hash forms
    for (const bad of [true, false, 0, 101, -101, [], {}, Infinity, Symbol.for('boop'), Uint8Array.from([1, 2, 3])]) {
      throws({ Data: null, Links: [{ Hash: bad, Name: null, Tsize: null }] })
    }

    // bad Link.Name forms
    for (const bad of [true, false, 0, 101, -101, [], {}, Infinity, Symbol.for('boop'), Uint8Array.from([1, 2, 3])]) {
      throws({ Data: null, Links: [{ Hash: null, Name: bad, Tsize: null }] })
    }

    // bad Link.Tsize forms
    for (const bad of [true, false, [], 'blip', {}, Symbol.for('boop'), Uint8Array.from([1, 2, 3])]) {
      throws({ Data: null, Links: [{ Hash: null, Name: null, Tsize: bad }] })
    }

    // bad sort
    throws({
      Data: null,
      Links: [
        { Hash: null, Name: null, Tsize: null },
        { Hash: null, Name: 'foo', Tsize: null },
        { Hash: null, Name: 'bar', Tsize: null }
      ]
    })
    throws({
      Data: null,
      Links: [
        { Hash: null, Name: null, Tsize: null },
        { Hash: null, Name: 'aa', Tsize: null },
        { Hash: null, Name: 'a', Tsize: null }
      ]
    })
  })
})
