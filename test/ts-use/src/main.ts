import { deepStrictEqual } from 'assert'

import { BlockEncoder, BlockDecoder, BlockCodec } from 'multiformats/codecs/interface'
import * as dagPB from '@ipld/dag-pb'
import { PBNode } from '@ipld/dag-pb'

const exampleNode:PBNode = { Data: Uint8Array.from([0, 1, 2, 3, 4]), Links: [] }
const exampleBytes = [0x0a, 5, 0, 1, 2, 3, 4]

const main = () => {
  // make sure we have a full CodecFeature
  useCodecFeature(dagPB)
}

function useCodecFeature (codec: BlockCodec<0x70, any>) {
  // use only as a BlockEncoder
  useEncoder(codec)

  // use only as a BlockDecoder
  useDecoder(codec)

  // use as a full BlockCodec which does both BlockEncoder & BlockDecoder
  useBlockCodec(codec)
}

function useEncoder<Codec extends number> (encoder: BlockEncoder<Codec, PBNode>) {
  deepStrictEqual(encoder.code, 0x70)
  deepStrictEqual(encoder.name, 'dag-pb')
  deepStrictEqual(Array.from(encoder.encode(exampleNode)), exampleBytes)
  console.log('[TS] ✓ { encoder: BlockEncoder }')
}

function useDecoder<Codec extends number> (decoder: BlockDecoder<Codec, Uint8Array>) {
  deepStrictEqual(decoder.code, 0x70)
  deepStrictEqual(decoder.decode(Uint8Array.from(exampleBytes)), exampleNode)
  console.log('[TS] ✓ { decoder: BlockDecoder }')
}

function useBlockCodec<Codec extends number> (blockCodec: BlockCodec<Codec, PBNode>) {
  deepStrictEqual(blockCodec.code, 0x70)
  deepStrictEqual(blockCodec.name, 'dag-pb')
  deepStrictEqual(Array.from(blockCodec.encode(exampleNode)), exampleBytes)
  deepStrictEqual(blockCodec.decode(Uint8Array.from(exampleBytes)), exampleNode)
  console.log('[TS] ✓ {}:BlockCodec')
}

main()

export default main
