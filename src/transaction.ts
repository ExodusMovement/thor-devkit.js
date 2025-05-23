import { address } from './address.js'
import { blake2b256 } from './blake2b.js'
import { RLP } from './rlp.js'
import { secp256k1 } from './secp256k1.js'

/** Transaction class defines VeChainThor's multi-clause transaction */
export class Transaction {
    public static readonly DELEGATED_MASK = 1

    public readonly body: Transaction.Body

    /** signature to transaction */
    public signature?: Buffer

    /**
     * construct a transaction object with given body
     * @param body body of tx
     */
    constructor(body: Transaction.Body) {
        this.body = { ...body }
    }

    /**
     * returns transaction ID
     * null returned if something wrong (e.g. invalid signature)
     */
    get id() {
        if (!this._signatureValid) {
            return null
        }
        try {
            const signingHash = this.signingHash()
            const pubKey = secp256k1.recover(signingHash, this.signature!.slice(0, 65))
            const origin = address.fromPublicKey(pubKey)
            return '0x' + blake2b256(
                signingHash,
                Buffer.from(origin.slice(2), 'hex'),
            ).toString('hex')
        } catch {
            return null
        }
    }

    /**
     * compute signing hashes.
     */
    public signingHash() {
        const reserved = this._encodeReserved()
        const buf = unsignedTxRLP.encode({ ...this.body, reserved })
        const hash = blake2b256(buf)
        return hash
    }

    /** returns whether delegated. see https://github.com/vechain/VIPs/blob/master/vips/VIP-191.md */
    get delegated() {
        // tslint:disable-next-line:no-bitwise
        return (((this.body.reserved ?? {}).features ?? 0) & Transaction.DELEGATED_MASK) === Transaction.DELEGATED_MASK
    }

    /** returns intrinsic gas it takes */
    get intrinsicGas() {
        return Transaction.intrinsicGas(this.body.clauses)
    }

    /** encode into Buffer */
    public encode() {
        const reserved = this._encodeReserved()
        if (this.signature) {
            return txRLP.encode({ ...this.body, reserved, signature: this.signature })
        }

        return unsignedTxRLP.encode({ ...this.body, reserved })
    }

    private _encodeReserved() {
        const reserved = this.body.reserved ?? {}
        const list = [featuresKind.data(reserved.features ?? 0, 'reserved.features').encode(),
        ...(reserved.unused ?? [])]

        // trim
        while (list.length > 0) {
            if (list[list.length - 1].length === 0) {
                list.pop()
            } else {
                break
            }
        }
        return list
    }

    private get _signatureValid() {
        const expectedSigLen = this.delegated ? 65 * 2 : 65
        return this.signature ? this.signature.length === expectedSigLen : false
    }
}

export namespace Transaction {
    /** clause type */
    export interface Clause {
        /**
         * destination address where transfer token to, or invoke contract method on.
         * set null destination to deploy a contract.
         */
        to: string | null

        /** amount of token to transfer to the destination */
        value: string | number

        /** input data for contract method invocation or deployment */
        data: string
    }

    /** body type */
    export interface Body {
        /** last byte of genesis block ID */
        chainTag: number
        /** 8 bytes prefix of some block's ID */
        blockRef: string
        /** constraint of time bucket */
        expiration: number
        /** array of clauses */
        clauses: Clause[]
        /** coef applied to base gas price [0,255] */
        gasPriceCoef: number
        /** max gas provided for execution */
        gas: string | number
        /** ID of another tx that is depended */
        dependsOn: string | null
        /** nonce value for various purposes */
        nonce: string | number

        reserved?: {
            /** tx feature bits */
            features?: number
            unused?: Buffer[]
        }
    }

    /**
     * calculates intrinsic gas that a tx costs with the given clauses.
     * @param clauses
     */
    export function intrinsicGas(clauses: Clause[]) {
        const txGas = 5000
        const clauseGas = 16000
        const clauseGasContractCreation = 48000

        if (clauses.length === 0) {
            return txGas + clauseGas
        }

        return clauses.reduce((sum, c) => {
            if (c.to) {
                sum += clauseGas
            } else {
                sum += clauseGasContractCreation
            }
            sum += dataGas(c.data)
            return sum
        }, txGas)
    }

    function dataGas(data: string) {
        const zgas = 4
        const nzgas = 68

        let sum = 0
        for (let i = 2; i < data.length; i += 2) {
            if (data.substring(i, i + 2) === '00') {
                sum += zgas
            } else {
                sum += nzgas
            }
        }
        return sum
    }
}

const unsignedTxRLP = new RLP({
    name: 'tx',
    kind: [
        { name: 'chainTag', kind: new RLP.NumericKind(1) },
        { name: 'blockRef', kind: new RLP.CompactFixedBlobKind(8) },
        { name: 'expiration', kind: new RLP.NumericKind(4) },
        {
            name: 'clauses', kind: {
                item: [
                    { name: 'to', kind: new RLP.NullableFixedBlobKind(20) },
                    { name: 'value', kind: new RLP.NumericKind(32) },
                    { name: 'data', kind: new RLP.BlobKind() },
                ],
            },
        },
        { name: 'gasPriceCoef', kind: new RLP.NumericKind(1) },
        { name: 'gas', kind: new RLP.NumericKind(8) },
        { name: 'dependsOn', kind: new RLP.NullableFixedBlobKind(32) },
        { name: 'nonce', kind: new RLP.NumericKind(8) },
        { name: 'reserved', kind: { item: new RLP.BufferKind() } },
    ],
})

const txRLP = new RLP({
    name: 'tx',
    kind: [...(unsignedTxRLP.profile.kind as RLP.Profile[]), { name: 'signature', kind: new RLP.BufferKind() }],
})

const featuresKind = new RLP.NumericKind(4)
