import { CID } from 'multiformats/cid'

/* eslint-disable complexity, no-nested-ternary */

/**
 * @typedef {import('./interface.js').PBLink} PBLink
 * @typedef {import('./interface.js').PBNode} PBNode
 */

/**
 * @template T
 * @typedef {import('multiformats/codecs/interface').ByteView<T>} ByteView
 */

/**
 * @template T
 * @typedef {import('multiformats/codecs/interface').ArrayBufferView<T>} ArrayBufferView
 */

const pbNodeProperties = ['Data', 'Links']
const pbLinkProperties = ['Hash', 'Name', 'Tsize']

const textEncoder = new TextEncoder()

/**
 * @param {PBLink} a
 * @param {PBLink} b
 * @returns {number}
 */
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

/**
 * @param {any} node
 * @param {string[]} properties
 * @returns {boolean}
 */
function hasOnlyProperties (node, properties) {
  return !Object.keys(node).some((p) => !properties.includes(p))
}

/**
 * Converts a CID, or a PBLink-like object to a PBLink
 *
 * @param {any} link
 * @returns {PBLink}
 */
function asLink (link) {
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
    let cid = CID.asCID(link.Hash)
    try {
      if (!cid) {
        if (typeof link.Hash === 'string') {
          cid = CID.parse(link.Hash)
        } else if (link.Hash instanceof Uint8Array) {
          cid = CID.decode(link.Hash)
        }
      }
    } catch (/** @type {any} */ e) {
      throw new TypeError(`Invalid DAG-PB form: ${e.message}`)
    }

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

/**
 * @param {any} node
 * @returns {PBNode}
 */
export function prepare (node) {
  if (node instanceof Uint8Array || typeof node === 'string') {
    node = { Data: node }
  }

  if (typeof node !== 'object' || Array.isArray(node)) {
    throw new TypeError('Invalid DAG-PB form')
  }

  /** @type {PBNode} */
  const pbn = {}

  if (node.Data !== undefined) {
    if (typeof node.Data === 'string') {
      pbn.Data = textEncoder.encode(node.Data)
    } else if (node.Data instanceof Uint8Array) {
      pbn.Data = node.Data
    } else {
      throw new TypeError('Invalid DAG-PB form')
    }
  }

  if (node.Links !== undefined) {
    if (Array.isArray(node.Links)) {
      pbn.Links = node.Links.map(asLink)
      pbn.Links.sort(linkComparator)
    } else {
      throw new TypeError('Invalid DAG-PB form')
    }
  } else {
    pbn.Links = []
  }

  return pbn
}

/**
 * @param {PBNode} node
 */
export function validate (node) {
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
  // @ts-ignore private property for TS
  if (!node || typeof node !== 'object' || Array.isArray(node) || node instanceof Uint8Array || (node['/'] && node['/'] === node.bytes)) {
    throw new TypeError('Invalid DAG-PB form')
  }

  if (!hasOnlyProperties(node, pbNodeProperties)) {
    throw new TypeError('Invalid DAG-PB form (extraneous properties)')
  }

  if (node.Data !== undefined && !(node.Data instanceof Uint8Array)) {
    throw new TypeError('Invalid DAG-PB form (Data must be bytes)')
  }

  if (!Array.isArray(node.Links)) {
    throw new TypeError('Invalid DAG-PB form (Links must be a list)')
  }

  for (let i = 0; i < node.Links.length; i++) {
    const link = node.Links[i]
    // @ts-ignore private property for TS
    if (!link || typeof link !== 'object' || Array.isArray(link) || link instanceof Uint8Array || (link['/'] && link['/'] === link.bytes)) {
      throw new TypeError('Invalid DAG-PB form (bad link)')
    }

    if (!hasOnlyProperties(link, pbLinkProperties)) {
      throw new TypeError('Invalid DAG-PB form (extraneous properties on link)')
    }

    if (link.Hash === undefined) {
      throw new TypeError('Invalid DAG-PB form (link must have a Hash)')
    }

    // @ts-ignore private property for TS
    if (link.Hash == null || !link.Hash['/'] || link.Hash['/'] !== link.Hash.bytes) {
      throw new TypeError('Invalid DAG-PB form (link Hash must be a CID)')
    }

    if (link.Name !== undefined && typeof link.Name !== 'string') {
      throw new TypeError('Invalid DAG-PB form (link Name must be a string)')
    }

    if (link.Tsize !== undefined) {
      if (typeof link.Tsize !== 'number' || link.Tsize % 1 !== 0) {
        throw new TypeError('Invalid DAG-PB form (link Tsize must be an integer)')
      }
      if (link.Tsize < 0) {
        throw new TypeError('Invalid DAG-PB form (link Tsize cannot be negative)')
      }
    }

    if (i > 0 && linkComparator(link, node.Links[i - 1]) === -1) {
      throw new TypeError('Invalid DAG-PB form (links must be sorted by Name bytes)')
    }
  }
}

/**
 * @param {Uint8Array} data
 * @param {PBLink[]} [links]
 * @returns {PBNode}
 */
export function createNode (data, links = []) {
  return prepare({ Data: data, Links: links })
}

/**
 * @param {string} name
 * @param {number} size
 * @param {CID} cid
 * @returns {PBLink}
 */
export function createLink (name, size, cid) {
  return asLink({ Hash: cid, Name: name, Tsize: size })
}

/**
 * @template T
 * @param {ByteView<T> | ArrayBufferView<T>} buf
 * @returns {ByteView<T>}
 */
export function toByteView (buf) {
  if (buf instanceof ArrayBuffer) {
    return new Uint8Array(buf, 0, buf.byteLength)
  }

  return buf
}
