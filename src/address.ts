import { keccak256 } from './keccak.js'

/** address related utilities */
export namespace address {
    /**
     * derive Address from public key, note that the public key is uncompressed
     * @param pub the public key
     */
    export function fromPublicKey(pub: Buffer) {
        return '0x' + keccak256(pub.slice(1)).slice(12).toString('hex')
    }
}
