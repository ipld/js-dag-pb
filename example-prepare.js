import multiformats from 'multiformats/basics'
import dagPB from '@ipld/dag-pb'
const { CID } = multiformats
const { prepare } = dagPB(multiformats)

console.log(prepare({ Data: 'some data' }))
// ->{ Data: Uint8Array(9) [115, 111, 109, 101, 32, 100,  97, 116, 97] }
console.log(prepare({ Links: [CID.from('bafkqabiaaebagba')] }))
// -> { Links: [ { Hash: CID(bafkqabiaaebagba) } ] }
