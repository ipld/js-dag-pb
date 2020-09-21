/* eslint-env mocha */

import chai from 'chai'
import dagPB from '@ipld/dag-pb'
import multiformats from 'multiformats/basics'

const { assert } = chai

const { multicodec } = multiformats
multicodec.add(dagPB)

const encode = (v) => multicodec.encode(v, 'dag-pb')
const { validate } = dagPB(multiformats)

describe('Forms (Data Model)', () => {
  it('validate good forms', () => {
    const doesntThrow = (good) => {
      validate(good)
      const byts = encode(good)
      assert.instanceOf(byts, Uint8Array)
    }

    doesntThrow({})

    doesntThrow({ Data: Uint8Array.from([1, 2, 3]) })
    doesntThrow({ Links: [{}] })
    doesntThrow({
      Links: [
        {},
        { Name: 'bar' },
        { Name: 'foo' }
      ]
    })
    doesntThrow({
      Links: [
        {},
        { Name: 'a' },
        { Name: 'a' }
      ]
    })
    const l = { Name: 'a' }
    doesntThrow({ Links: [l, l] })
  })

  it('validate fails bad forms', () => {
    const throws = (bad) => {
      assert.throws(() => validate(bad))
      assert.throws(() => encode(bad))
    }

    for (const bad of [true, false, null, 0, 101, -101, 'blip', [], Infinity, Symbol.for('boop'), Uint8Array.from([1, 2, 3])]) {
      throws(bad)
    }

    throws({ Data: null, Links: null })
    throws({ Data: null })
    throws({ Links: null })

    // empty links array not allowed, should be null
    throws({ Links: [] })

    throws({ extraneous: true })
    throws({ Links: [{ extraneous: true }] })

    // bad Data forms
    for (const bad of [true, false, 0, 101, -101, 'blip', Infinity, Symbol.for('boop'), []]) {
      throws({ Data: bad })
    }

    // bad Link array forms
    for (const bad of [true, false, 0, 101, -101, 'blip', Infinity, Symbol.for('boop'), Uint8Array.from([1, 2, 3])]) {
      throws({ Links: bad })
    }

    // bad Link forms
    for (const bad of [true, false, 0, 101, -101, 'blip', Infinity, Symbol.for('boop'), Uint8Array.from([1, 2, 3])]) {
      throws({ Links: [bad] })
    }

    // bad Link.Hash forms
    for (const bad of [true, false, 0, 101, -101, [], {}, Infinity, Symbol.for('boop'), Uint8Array.from([1, 2, 3])]) {
      throws({ Links: [{ Hash: bad }] })
    }

    // bad Link.Name forms
    for (const bad of [true, false, 0, 101, -101, [], {}, Infinity, Symbol.for('boop'), Uint8Array.from([1, 2, 3])]) {
      throws({ Links: [{ Name: bad }] })
    }

    // bad Link.Tsize forms
    for (const bad of [true, false, [], 'blip', {}, Symbol.for('boop'), Uint8Array.from([1, 2, 3])]) {
      throws({ Links: [{ Tsize: bad }] })
    }

    // bad sort
    throws({
      Links: [
        {},
        { Name: 'foo' },
        { Name: 'bar' }
      ]
    })
    throws({
      Links: [
        {},
        { Name: 'aa' },
        { Name: 'a' }
      ]
    })
  })
})
