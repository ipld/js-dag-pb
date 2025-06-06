/* eslint-disable no-console */

import { deepStrictEqual } from 'assert'
import * as dagPB from '@ipld/dag-pb'
import type { PBNode } from '@ipld/dag-pb'
import type { BlockEncoder, BlockDecoder, BlockCodec } from 'multiformats/codecs/interface'

const exampleNode:PBNode = { Data: Uint8Array.from([0, 1, 2, 3, 4]), Links: [] }
const exampleBytes = [0x0a, 5, 0, 1, 2, 3, 4]

const main = (): void => {
  // make sure we have a full codec
  useCodec(dagPB)
}

function useCodec (codec: BlockCodec<0x70, any>): void {
  // use only as a BlockEncoder
  useEncoder(codec)

  // use only as a BlockDecoder
  useDecoder(codec)

  // use with ArrayBuffer input type
  useDecoderWithArrayBuffer(codec)

  // use as a full BlockCodec which does both BlockEncoder & BlockDecoder
  useBlockCodec(codec)
}

function useEncoder<Codec extends number> (encoder: BlockEncoder<Codec, PBNode>): void {
  deepStrictEqual(encoder.code, 0x70)
  deepStrictEqual(encoder.name, 'dag-pb')
  deepStrictEqual(Array.from(encoder.encode(exampleNode)), exampleBytes)
  console.log('[TS] ✓ { encoder: BlockEncoder }')
}

function useDecoder<Codec extends number> (decoder: BlockDecoder<Codec, Uint8Array>): void {
  deepStrictEqual(decoder.code, 0x70)
  deepStrictEqual(decoder.decode(Uint8Array.from(exampleBytes)), exampleNode)
  console.log('[TS] ✓ { decoder: BlockDecoder }')
}

function useDecoderWithArrayBuffer<Codec extends number> (decoder: BlockDecoder<Codec, Uint8Array>): void {
  deepStrictEqual(decoder.code, 0x70)
  deepStrictEqual(decoder.decode(Uint8Array.from(exampleBytes).buffer), exampleNode)
  console.log('[TS] ✓ { decoder: BlockDecoder }')
}

function useBlockCodec<Codec extends number> (blockCodec: BlockCodec<Codec, PBNode>): void {
  deepStrictEqual(blockCodec.code, 0x70)
  deepStrictEqual(blockCodec.name, 'dag-pb')
  deepStrictEqual(Array.from(blockCodec.encode(exampleNode)), exampleBytes)
  deepStrictEqual(blockCodec.decode(Uint8Array.from(exampleBytes)), exampleNode)
  console.log('[TS] ✓ {}:BlockCodec')
}

main()

export default main
