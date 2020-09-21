import Block from '@ipld/block/defaults'
import dagPB from '@ipld/dag-pb'

Block.multiformats.add(dagPB)

async function run () {
  const b1 = Block.encoder({
    Data: new TextEncoder().encode('Some data as a string')
  }, 'dag-pb')

  // also possible if `prepare()` is extracted, see API details in README
  // const b1 = Block.encoder(prepare('Some data as a string'), 'dag-pb')
  // const b1 = Block.encoder(prepare(new TextEncoder().encode('Some data as a string')), 'dag-pb')

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
