import { recoverPublicKey } from '@noble/secp256k1'

function isValidMessageHash(hash: Buffer) {
    return Buffer.isBuffer(hash) && hash.length === 32
}

/** secp256k1 methods set */
export namespace secp256k1 {
    /**
     * recovery signature to public key
     * @param msgHash hash of message
     * @param sig signature
     */
    export function recover(msgHash: Buffer, sig: Buffer) {
        if (!isValidMessageHash(msgHash)) {
            throw new Error('invalid message hash')
        }
        if (!Buffer.isBuffer(sig) || sig.length !== 65) {
            throw new Error('invalid signature')
        }
        const recovery = sig[64]
        if (recovery !== 0 && recovery !== 1) {
            throw new Error('invalid signature recovery')
        }

        return Buffer.from(recoverPublicKey(msgHash, sig.slice(0, 64), recovery, false))
    }
}
