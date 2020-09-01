import protons from 'protons'
import protoDef from './dag.proto.js'

const proto = protons(protoDef)

const code = 0x70
const name = 'dag-pb'

const textEncoder = new TextEncoder()

function linkComparator (a, b) {
  if (a === b) {
    return 0
  }

  const abuf = textEncoder.encode(a.Name)
  const bbuf = textEncoder.encode(b.Name)

  let x = abuf.length
  let y = bbuf.length

  for (let i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  return x < y ? -1 : y < x ? 1 : 0
}

function create (multiformats) {
  const { CID, bytes } = multiformats

  const asLink = (link) => {
    if (typeof link.asCID === 'object') {
      return { Hash: CID.asCID(link).bytes, Name: '', Tsize: 0 }
    }

    let cid
    try {
      cid = CID.from(link.Hash)
    } catch (e) {}

    if (!cid) {
      throw new TypeError('Invalid DAG-PB form (bad Hash/CID)')
    }

    return {
      Hash: cid.bytes,
      Name: link.Name || '',
      Tsize: link.Tsize || 0
    }
  }

  const encode = (node) => {
    if (node instanceof Uint8Array || typeof node === 'string') {
      node = { Data: node }
    }

    if (typeof node !== 'object' || Array.isArray(node)) {
      throw new TypeError('Invalid DAG-PB form')
    }

    const pbn = { Data: null, Links: null }

    if (node.Data) {
      if (typeof node.Data === 'string') {
        pbn.Data = textEncoder.encode(node.Data)
      } else if (node.Data instanceof Uint8Array & node.Data.length > 0) {
        // zero-length data must be null, can't be Uint8Array(0)
        pbn.Data = node.Data
      }
    }

    if (node.Links && node.Links.length > 0) {
      pbn.Links = node.Links.map(asLink)
      pbn.Links.sort(linkComparator)
    }

    const serialized = proto.PBNode.encode(pbn)
    return bytes.coerce(serialized)
  }

  const decode = (bytes) => {
    const pbn = proto.PBNode.decode(bytes)

    const node = {
      Links: pbn.Links.map((link) => {
        return {
          Name: link.Name,
          Tsize: link.Tsize,
          Hash: new CID(link.Hash)
        }
      }),
      Data: pbn.Data == null ? new Uint8Array(0) : pbn.Data
    }

    return node
  }

  return { encode, decode, code, name }
}

export default create
