const textDecoder = new TextDecoder()

function decodeLink (bytes) {
  const link = {}
  const l = bytes.length
  let index = 0
  while (index < l) {
    const preIndex = index
    let wire = 0
    for (let shift = 0; ; shift += 7) {
      if (shift >= 64) { // maybe <53?
        throw new Error('proto: PBLink: overflow')
      }
      if (index >= l) {
        throw new Error('proto: PBLink: unexpected end of data')
      }
      const b = bytes[index]
      index++
      wire |= (b & 0x7f) << shift
      if (b < 0x80) {
        break
      }
    }
    const fieldNum = wire >> 3
    const wireType = wire & 0x7
    if (wireType === 4) {
      throw new Error('proto: PBLink: wiretype end group for non-group')
    }
    if (fieldNum <= 0) {
      throw new Error(`proto: PBLink: illegal tag ${fieldNum} (wire type ${wire})`)
    }

    let postIndex
    let byteLen = 0
    let stringLen = 0
    let v = 0
    let skippy

    switch (fieldNum) {
      case 1:
        if (wireType !== 2) {
          throw new Error(`proto: PBLink: wrong wireType = ${wireType} for field Hash`)
        }
        for (let shift = 0; ; shift += 7) {
          if (shift >= 64) { // maybe <53?
            throw new Error('proto: PBLink: overflow')
          }
          if (index >= l) {
            throw new Error('proto: PBLink: unexpected end of data')
          }
          const b = bytes[index]
          index++
          byteLen |= (b & 0x7f) << shift
          if (b < 0x80) {
            break
          }
        }
        if (byteLen < 0) {
          throw new Error('proto: PBLink: invalid length')
        }
        postIndex = index + byteLen
        if (postIndex < 0) {
          throw new Error('proto: PBLink: invalid length')
        }
        if (postIndex > l) {
          throw new Error('proto: PBLink: unexpected end of data')
        }
        link.Hash = bytes.slice(index, postIndex)
        index = postIndex
        break
      case 2:
        if (wireType !== 2) {
          throw new Error(`proto: wrong wireType = ${wireType} for field Name`)
        }
        for (let shift = 0; ; shift += 7) {
          if (shift >= 64) { // maybe <53?
            throw new Error('proto: PBLink: overflow')
          }
          if (index >= l) {
            throw new Error('proto: PBLink: unexpected end of data')
          }
          const b = bytes[index]
          index++
          stringLen |= (b & 0x7f) << shift
          if (b < 0x80) {
            break
          }
        }
        if (stringLen < 0) {
          throw new Error('proto: PBLink: invalid length')
        }
        postIndex = index + stringLen
        if (postIndex < 0) {
          throw new Error('proto: PBLink: invalid length')
        }
        if (postIndex > l) {
          throw new Error('proto: PBLink: unexpected end of data')
        }
        link.Name = textDecoder.decode(bytes.slice(index, postIndex))
        index = postIndex
        break
      case 3:
        if (wireType !== 0) {
          throw new Error(`proto: wrong wireType = ${wireType} for field Tsize`)
        }
        for (let shift = 0; ; shift += 7) {
          if (shift >= 64) { // maybe <53?
            throw new Error('proto: PBLink: overflow')
          }
          if (index >= l) {
            throw new Error('proto: PBLink: unexpected end of data')
          }
          const b = bytes[index]
          index++
          v |= (b & 0x7f) << shift
          if (b < 0x80) {
            break
          }
        }
        link.Tsize = v
        break
      default:
        index = preIndex
        skippy = skip(bytes.slice(index))
        if (skippy < 0) {
          throw new Error('proto: invalid length')
        }
        if (index + skippy < 0) {
          throw new Error('proto: invalid length')
        }
        if (index + skippy > l) {
          throw new Error('proto: PBLink: unexpected end of data')
        }
        // discard for now
        // link.XXX_unrecognized = append(m.XXX_unrecognized, bytes[index:index+skippy]...)
        index += skippy
    }
  }

  if (index > l) {
    throw new Error('proto: PBLink: unexpected end of data')
  }

  return link
}

function decodeNode (bytes) {
  const l = bytes.length
  let index = 0
  const node = { Links: [] }
  const dataChunks = []
  while (index < l) {
    const preIndex = index
    let wire = 0
    for (let shift = 0; ; shift += 7) {
      if (shift >= 64) { // maybe <53?
        throw new Error('proto: PBNode: overflow')
      }
      if (index >= l) {
        throw new Error('proto: PBNode: unexpected end of data')
      }
      const b = bytes[index]
      index++
      wire |= (b & 0x7f) << shift
      if (b < 0x80) {
        break
      }
    }
    const fieldNum = wire >> 3
    const wireType = wire & 0x7
    if (wireType === 4) {
      throw new Error('proto: PBNode: wiretype end group for non-group')
    }
    if (fieldNum <= 0) {
      throw new Error(`proto: PBNode: illegal tag ${fieldNum} (wire type ${wire})`)
    }

    let postIndex
    let byteLen = 0
    let msglen = 0
    let skippy

    switch (fieldNum) {
      case 1:
        if (wireType !== 2) {
          throw Error(`proto: wrong wireType = ${wireType} for field Data`)
        }
        for (let shift = 0; ; shift += 7) {
          if (shift >= 64) { // maybe <53?
            throw new Error('proto: PBNode: overflow')
          }
          if (index >= l) {
            throw new Error('proto: PBNode: unexpected end of data')
          }
          const b = bytes[index]
          index++
          byteLen |= (b & 0x7f) << shift
          if (b < 0x80) {
            break
          }
        }
        if (byteLen < 0) {
          throw new Error('proto: PBNode: invalid length')
        }
        postIndex = index + byteLen
        if (postIndex < 0) {
          throw new Error('proto: PBNode: invalid length')
        }
        if (postIndex > l) {
          throw new Error('proto: PBNode: unexpected end of data')
        }
        dataChunks.push(bytes.slice(index, postIndex))
        index = postIndex
        break
      case 2:
        if (wireType !== 2) {
          throw new Error(`proto: wrong wireType = ${wireType} for field Links`)
        }
        for (let shift = 0; ; shift += 7) {
          if (shift >= 64) { // maybe <53?
            throw new Error('proto: PBNode: overflow')
          }
          if (index >= l) {
            throw new Error('proto: PBNode: unexpected end of data')
          }
          const b = bytes[index]
          index++
          msglen |= (b & 0x7f) << shift
          if (b < 0x80) {
            break
          }
        }
        if (msglen < 0) {
          throw new Error('proto: PBNode: invalid length')
        }
        postIndex = index + msglen
        if (postIndex < 0) {
          throw new Error('proto: PBNode: invalid length')
        }
        if (postIndex > l) {
          throw new Error('proto: PBNode: unexpected end of data')
        }
        /*
        if (!node.Links) {
          node.Links = []
        }
        */
        node.Links.push(decodeLink(bytes.slice(index, postIndex)))
        index = postIndex
        break
      default:
        index = preIndex
        skippy = skip(bytes.slice(index))
        if (skippy < 0) {
          throw new Error('proto: PBNode: invalid length')
        }
        if (index + skippy < 0) {
          throw new Error('proto: PBNode: invalid length')
        }
        if (index + skippy > l) {
          throw new Error('proto: PBNode: unexpected end of data')
        }
        // ignore for now
        // m.XXX_unrecognized = append(m.XXX_unrecognized, bytes[index:index+skippy]...)
        index += skippy
    }
  }

  if (index > l) {
    throw new Error('proto: PBNode: unexpected end of data')
  }

  if (dataChunks.length) {
    node.Data = new Uint8Array(dataChunks.reduce((p, c) => p + c.length, 0))
    let off = 0
    for (const b of dataChunks) {
      node.Data.set(b, off)
      off += b.length
    }
  }

  return node
}

function skip (bytes) {
  const l = bytes.length
  let index = 0
  let depth = 0
  while (index < l) {
    let wire = 0
    for (let shift = 0; ; shift += 7) {
      if (shift >= 64) { // maybe <53?
        throw new Error('proto: overflow')
      }
      if (index >= l) {
        throw new Error('proto: unexpected end of data')
      }
      const b = bytes[index]
      index++
      wire |= (b & 0x7f) << shift
      if (b < 0x80) {
        break
      }
    }
    let length = 0
    const wireType = wire & 0x7
    switch (wireType) {
      case 0:
        for (let shift = 0; ; shift += 7) {
          if (shift >= 64) { // maybe <53?
            throw new Error('proto: overflow')
          }
          if (index >= l) {
            throw new Error('proto: unexpected end of data')
          }
          const b = bytes[index]
          index++
          if (b < 0x80) {
            break
          }
        }
        break
      case 1:
        index += 8
        break
      case 2:
        for (let shift = 0; ; shift += 7) {
          if (shift >= 64) { // maybe <53?
            throw new Error('proto: overflow')
          }
          if (index >= l) {
            throw new Error('proto: unexpected end of data')
          }
          const b = bytes[index]
          index++
          length |= (b & 0x7f) << shift
          if (b < 0x80) {
            break
          }
        }
        if (length < 0) {
          throw new Error('proto: invalid length')
        }
        index += length
        if (index < 0) {
          throw new Error('proto: invalid length')
        }
        break
      case 3:
        depth++
        break
      case 4:
        if (depth === 0) {
          throw new Error('proto: unexpected end of group')
        }
        depth--
        break
      case 5:
        index += 4
        break
      default:
        throw new Error(`proto: illegal wireType ${wireType}`)
    }
    if (depth === 0) {
      return index
    }
  }
  throw new Error('proto: unexpected end of data')
}

export { decodeNode, decodeLink }
