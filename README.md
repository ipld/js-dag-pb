# @ipld/dag-pb

An implementation of the [DAG-PB spec](https://github.com/ipld/specs/blob/master/block-layer/codecs/dag-pb.md) for JavaScript designed for use with [multiformats](https://github.com/multiformats/js-multiformats) or via the higher-level `Block` abstraction in [@ipld/block](https://github.com/ipld/js-block).

## Example

```js
import Block from '@ipld/block/defaults'
import dagPB from '@ipld/dag-pb'

Block.multiformats.add(dagPB)

async function run () {
  const b1 = Block.encoder({
    Data: new TextEncoder().encode('Some data as a string')
  }, 'dag-pb')
	// or: const b1 = Block.encoder('Some data as a string', 'dag-pb')
  // or: const b1 = Block.encoder(new TextEncoder().encode('Some data as a string'), 'dag-pb')
  const cid = await b1.cid()
  const bytes = b1.encode()

  console.log(cid, '=>', Block.multiformats.bytes.toHex(bytes))

  const b2 = Block.decoder(bytes, 'dag-pb')
  // or: const b2 = Block.create(bytes, cid)
  const decoded = b2.decode()

  console.log(decoded)
  console.log(`decoded "Data": ${new TextDecoder().decode(decoded.Data)}`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

## License

Licensed under either of

 * Apache 2.0, ([LICENSE-APACHE](LICENSE-APACHE) / http://www.apache.org/licenses/LICENSE-2.0)
 * MIT ([LICENSE-MIT](LICENSE-MIT) / http://opensource.org/licenses/MIT)

### Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.
