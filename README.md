# @ipld/dag-pb

An implementation of the [DAG-PB spec](https://github.com/ipld/specs/blob/master/block-layer/codecs/dag-pb.md) for JavaScript designed for use with [multiformats](https://github.com/multiformats/js-multiformats) or via the higher-level `Block` abstraction in [@ipld/block](https://github.com/ipld/js-block).

## Example

```js
import CID from 'multiformats/cid'
import { sha256 } from 'multiformats/hashes/sha2'
import * as dagPB from '@ipld/dag-pb'

async function run () {
  const bytes = dagPB.encode({
    Data: new TextEncoder().encode('Some data as a string'),
    Links: []
  })

  // also possible if you `import dagPB, { prepare } from '@ipld/dag-pb'`
  // const bytes = dagPB.encode(prepare('Some data as a string'))
  // const bytes = dagPB.encode(prepare(new TextEncoder().encode('Some data as a string')))

  const hash = await sha256.digest(bytes)
  const cid = CID.create(1, dagPB.code, hash)

  console.log(cid, '=>', Buffer.from(bytes).toString('hex'))

  const decoded = dagPB.decode(bytes)

  console.log(decoded)
  console.log(`decoded "Data": ${new TextDecoder().decode(decoded.Data)}`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

## Usage

`@ipld/dag-pb` is designed to be used within multiformats but can be used separately. `encode()`, `decode()`, `validate()` and `prepare()` functions are available if you pass in a `multiformats` object to the default export function. Each of these can operate independently as required.

### `prepare()`

The DAG-PB encoding is very strict about the Data Model forms that are passed in. The objects _must_ exactly resemble what they would if they were to undergo a round-trip of encode & decode. Therefore, extraneous or mistyped properties are not acceptable and will be rejected. See the [DAG-PB spec](https://github.com/ipld/specs/blob/master/block-layer/codecs/dag-pb.md) for full details of the acceptable schema and additional constraints.

Due to this strictness, a `prepare()` function is made available which simplifies construction and allows for more flexible input forms. Prior to encoding objects, call `prepare()` to receive a new object that strictly conforms to the schema.

```js
import CID from 'multiformats/cid'
import { prepare } from '@ipld/dag-pb'

console.log(prepare({ Data: 'some data' }))
// ->{ Data: Uint8Array(9) [115, 111, 109, 101, 32, 100,  97, 116, 97] }
console.log(prepare({ Links: [CID.parse('bafkqabiaaebagba')] }))
// -> { Links: [ { Hash: CID(bafkqabiaaebagba) } ] }
```

Some features of `prepare()`:

* Extraneous properties are omitted
* String values for `Data` are converted
* Strings are converted to `{ Data: bytes }` (as are `Uint8Array`s)
* Multiple ways of finding CIDs in the `Links` array are attempted, including interpreting the whole link element as a CID, reading a `Uint8Array` as a CID
* Ensuring that properties are of the correct type (link `Name` is a `string` and `Tsize` is a `number`)
* `Links` array is always present, even if empty
* `Links` array is properly sorted

## License

Licensed under either of

 * Apache 2.0, ([LICENSE-APACHE](LICENSE-APACHE) / http://www.apache.org/licenses/LICENSE-2.0)
 * MIT ([LICENSE-MIT](LICENSE-MIT) / http://opensource.org/licenses/MIT)

### Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.
