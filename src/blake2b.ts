// @ts-expect-error
import { blake2bWithOptions } from '@exodus/crypto/blake2b'

const blake2b256raw = blake2bWithOptions({ size: 32 })

/**
 * computes blake2b 256bit hash of given data
 * @param data one or more Buffer | string
 */
export function blake2b256(...data: Array<Buffer | string>) {
    if (data.length === 1) {
        return blake2b256raw(data[0])
    }

    return blake2b256raw(data.map(x => Buffer.isBuffer(x) ? x : Buffer.from(x)))
}
