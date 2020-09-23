// port and refactor of codegen'd Go version @
// https://github.com/ipfs/go-merkledag/blob/master/pb/merkledag.pb.go

const textDecoder = new TextDecoder()

function decodeVarint (bytes, offset) {
  let v = 0
  for (let shift = 0; ; shift += 7) {
    /* c8 ignore next 3 */
    if (shift >= 64) { // maybe <53?
      throw new Error('protobuf: varint overflow')
    }
    /* c8 ignore next 3 */
    if (offset >= bytes.length) {
      throw new Error('protobuf: unexpected end of data')
    }
    const b = bytes[offset++]
    v += shift < 28 ? (b & 0x7f) << shift : (b & 0x7f) * (2 ** shift)
    if (b < 0x80) {
      break
    }
  }
  return [v, offset]
}

function decodeBytes (bytes, offset, wireType, field) {
  /* c8 ignore next 3 */
  if (wireType !== 2) {
    throw new Error(`protobuf: wrong wireType = ${wireType} for field ${field}`)
  }

  let byteLen
  ;[byteLen, offset] = decodeVarint(bytes, offset)
  const postOffset = offset + byteLen

  /* c8 ignore next 3 */
  if (byteLen < 0 || postOffset < 0) {
    throw new Error('protobuf: invalid length')
  }
  /* c8 ignore next 3 */
  if (postOffset > bytes.length) {
    throw new Error('protobuf: unexpected end of data')
  }

  return [bytes.subarray(offset, postOffset), postOffset]
}

function decodeLink (bytes) {
  const link = {}
  const l = bytes.length
  let index = 0
  while (index < l) {
    const preIndex = index
    let wire
    ;[wire, index] = decodeVarint(bytes, index)
    const fieldNum = wire >> 3
    const wireType = wire & 0x7
    /* c8 ignore next 3 */
    if (wireType === 4) {
      throw new Error('protobuf: groups are not supported')
    }
    /* c8 ignore next 3 */
    if (fieldNum <= 0) {
      throw new Error(`protobuf: illegal tag ${fieldNum} (wire type ${wire})`)
    }

    let byts

    switch (fieldNum) {
      case 1:
        ;[link.Hash, index] = decodeBytes(bytes, index, wireType, 'Hash')
        break
      case 2:
        ;[byts, index] = decodeBytes(bytes, index, wireType, 'Name')
        link.Name = textDecoder.decode(byts)
        break
      case 3:
        /* c8 ignore next 3 */
        if (wireType !== 0) {
          throw new Error(`proto: wrong wireType = ${wireType} for field Tsize`)
        }
        ;[link.Tsize, index] = decodeVarint(bytes, index)
        break
      /* c8 ignore next 2 */
      default:
        index = skipBytes(bytes, preIndex)
    }
  }

  /* c8 ignore next 3 */
  if (index > l) {
    throw new Error('protobuf: unexpected end of data')
  }

  return link
}

function decodeNode (bytes) {
  const l = bytes.length
  let index = 0
  let links
  const dataChunks = []
  while (index < l) {
    const preIndex = index
    let wire
    ;[wire, index] = decodeVarint(bytes, index)
    const fieldNum = wire >> 3
    const wireType = wire & 0x7
    /* c8 ignore next 3 */
    if (wireType === 4) {
      throw new Error('protobuf: groups are not supported')
    }
    /* c8 ignore next 3 */
    if (fieldNum <= 0) {
      throw new Error(`proto: PBNode: illegal tag ${fieldNum} (wire type ${wire})`)
    }

    let byts

    switch (fieldNum) {
      case 1:
        ;[byts, index] = decodeBytes(bytes, index, wireType, 'Data')
        dataChunks.push(byts)
        break
      case 2:
        ;[byts, index] = decodeBytes(bytes, index, wireType, 'Links')
        if (!links) {
          links = []
        }
        links.push(decodeLink(byts))
        break
      /* c8 ignore next 2 */
      default:
        index = skipBytes(bytes, preIndex)
    }
  }

  /* c8 ignore next 3 */
  if (index > l) {
    throw new Error('proto: PBNode: unexpected end of data')
  }

  const node = {}

  if (dataChunks.length === 1) { // common case
    node.Data = dataChunks[0]
  // unsure if this next case is even possible or should be permissible
  /* c8 ignore next 8 */
  } else if (dataChunks.length) {
    node.Data = new Uint8Array(dataChunks.reduce((p, c) => p + c.length, 0))
    let off = 0
    for (const b of dataChunks) {
      node.Data.set(b, off)
      off += b.length
    }
  }

  if (links) {
    node.Links = links
  }

  return node
}

// protobuf looseness, not ideal but it is what it is
/* c8 ignore next 10 */
function skipBytes (bytes, offset) {
  const skippy = skip(bytes.subarray(offset))
  if (skippy < 0 || offset + skippy < 0) {
    throw new Error('protobuf: invalid length')
  }
  if (offset + skippy > bytes.length) {
    throw new Error('protobuf: unexpected end of data')
  }
  return offset + skippy
}

/* c8 ignore next 34 */
function skip (bytes) {
  let index = 0
  while (index < bytes.length) {
    let wire = 0
    ;[wire, index] = decodeVarint(bytes, index)
    let length = 0
    const wireType = wire & 0x7
    switch (wireType) {
      case 0:
        ;[, index] = decodeVarint(bytes, index)
        break
      case 1:
        index += 8
        break
      case 2:
        ;[length, index] = decodeVarint(bytes, index)
        index += length
        if (length < 0 || index < 0) {
          throw new Error('proto: invalid length')
        }
        break
      case 3:
      case 4:
        throw new Error('protobuf: groups are not supported')
      case 5:
        index += 4
        break
      default:
        throw new Error(`proto: illegal wireType ${wireType}`)
    }
    return index
  }
  throw new Error('proto: unexpected end of data')
}

export default decodeNode
