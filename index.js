import decodeNode from './pb-decode.js'
import encodeNode from './pb-encode.js'

const code = 0x70
const name = 'dag-pb'
const pbNodeProperties = ['Data', 'Links']
const pbLinkProperties = ['Hash', 'Name', 'Tsize']

const textEncoder = new TextEncoder()

function linkComparator (a, b) {
  if (a === b) {
    return 0
  }

  const abuf = a.Name ? textEncoder.encode(a.Name) : []
  const bbuf = b.Name ? textEncoder.encode(b.Name) : []

  let x = abuf.length
  let y = bbuf.length

  for (let i = 0, len = Math.min(x, y); i < len; ++i) {
    if (abuf[i] !== bbuf[i]) {
      x = abuf[i]
      y = bbuf[i]
      break
    }
  }

  return x < y ? -1 : y < x ? 1 : 0
}

function hasOnlyProperties (node, properties) {
  return !Object.keys(node).some((p) => !properties.includes(p))
}

function create (multiformats) {
  const { CID, bytes } = multiformats

  const asLink = (link) => {
    if (typeof link.asCID === 'object') {
      const Hash = CID.asCID(link)
      if (!Hash) {
        throw new TypeError('Invalid DAG-PB form')
      }
      return { Hash }
    }

    if (typeof link !== 'object' || Array.isArray(link)) {
      throw new TypeError('Invalid DAG-PB form')
    }

    const pbl = {}

    if (link.Hash) {
      let cid
      try {
        cid = CID.from(link.Hash)
      } catch (e) {}

      if (cid) {
        pbl.Hash = cid
      }
    }

    if (!pbl.Hash) {
      throw new TypeError('Invalid DAG-PB form')
    }

    if (typeof link.Name === 'string') {
      pbl.Name = link.Name
    }

    if (typeof link.Tsize === 'number') {
      pbl.Tsize = link.Tsize
    }

    return pbl
  }

  const prepare = (node) => {
    if (node instanceof Uint8Array || typeof node === 'string') {
      node = { Data: node }
    }

    if (typeof node !== 'object' || Array.isArray(node)) {
      throw new TypeError('Invalid DAG-PB form')
    }

    const pbn = {}

    if (node.Data) {
      if (typeof node.Data === 'string') {
        pbn.Data = textEncoder.encode(node.Data)
      } else if (node.Data instanceof Uint8Array) {
        pbn.Data = node.Data
      }
    }

    if (node.Links && Array.isArray(node.Links) && node.Links.length) {
      pbn.Links = node.Links.map(asLink)
      pbn.Links.sort(linkComparator)
    }

    return pbn
  }

  const validate = (node) => {
    /*
    type PBLink struct {
      Hash optional Link
      Name optional String
      Tsize optional Int
    }

    type PBNode struct {
      Links [PBLink]
      Data optional Bytes
    }
    */
    if (!node || typeof node !== 'object' || Array.isArray(node)) {
      throw new TypeError('Invalid DAG-PB form')
    }

    if (!hasOnlyProperties(node, pbNodeProperties)) {
      throw new TypeError('Invalid DAG-PB form (extraneous properties)')
    }

    if (node.Data !== undefined && !(node.Data instanceof Uint8Array)) {
      throw new TypeError('Invalid DAG-PB form (Data must be a Uint8Array)')
    }

    if (node.Links === undefined) {
      return
    }

    if (!Array.isArray(node.Links)) {
      throw new TypeError('Invalid DAG-PB form (Links must be an array)')
    }

    if (!node.Links.length) {
      throw new TypeError('Invalid DAG-PB form (empty Links array must be omitted)')
    }

    for (let i = 0; i < node.Links.length; i++) {
      const link = node.Links[i]
      if (!link || typeof link !== 'object' || Array.isArray(link)) {
        throw new TypeError('Invalid DAG-PB form (bad link object)')
      }

      if (!hasOnlyProperties(link, pbLinkProperties)) {
        throw new TypeError('Invalid DAG-PB form (extraneous properties on link object)')
      }

      if (!link.Hash) {
        throw new TypeError('Invalid DAG-PB form (link must have a Hash)')
      }

      if (link.Hash.asCID !== link.Hash) {
        throw new TypeError('Invalid DAG-PB form (link Hash must be a CID)')
      }

      if (link.Name !== undefined && typeof link.Name !== 'string') {
        throw new TypeError('Invalid DAG-PB form (link Name must be a string)')
      }

      if (link.Tsize !== undefined && (typeof link.Tsize !== 'number' || link.Tsize % 1 !== 0)) {
        throw new TypeError('Invalid DAG-PB form (link Tsize must be an integer)')
      }

      if (i > 0 && linkComparator(link, node.Links[i - 1]) === -1) {
        throw new TypeError('Invalid DAG-PB form (links must be sort by Name bytes)')
      }
    }
  }

  const encode = (node) => {
    validate(node)
    const pbn = {}
    if (node.Links) {
      pbn.Links = node.Links.map((l) => {
        const link = {}
        if (l.Hash) {
          link.Hash = l.Hash.bytes // cid -> bytes
        }
        if (l.Name !== undefined) {
          link.Name = l.Name
        }
        if (l.Tsize !== undefined) {
          link.Tsize = l.Tsize
        }
        return link
      })
    }
    if (node.Data) {
      pbn.Data = node.Data
    }
    const serialized = encodeNode(pbn)
    return bytes.coerce(serialized)
  }

  const decode = (bytes) => {
    const pbn = decodeNode(bytes)

    const node = {}
    if (pbn.Data) {
      node.Data = pbn.Data
    }
    if (pbn.Links) {
      node.Links = pbn.Links && pbn.Links.map((l) => {
        const link = {}
        if (l.Hash) {
          link.Hash = new CID(l.Hash)
        }
        if (l.Name !== undefined) {
          link.Name = l.Name
        }
        if (l.Tsize !== undefined) {
          link.Tsize = l.Tsize
        }
        return link
      })
    }
    return node
  }

  return { encode, decode, validate, prepare, code, name }
}

export default create
