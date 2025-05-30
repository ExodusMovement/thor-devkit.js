// @ts-expect-error
import { AbiCoder, formatSignature as _formatSignature } from '@exodus/ethers/utils/abi-coder.js'
// @ts-expect-error
import { keccak256 } from '@exodus/crypto/keccak'

class Coder extends AbiCoder {
    constructor() {
        // @ts-expect-error
        super((type, value) => {
            if ((type.match(/^u?int/) && !Array.isArray(value) && typeof value !== 'object') ||
                value._ethersType === 'BigNumber') {
                return value.toString()
            }
            if (type === 'address') {
                return value.toLowerCase()
            }
            return value
        })
    }

    public encode(types: Array<string | Function.Parameter>, values: any[]): string {
        try {
            return super.encode(types, values)
        } catch (err) {
            if (err.reason) {
                throw new Error(err.reason)
            }
            throw err
        }
    }

    public decode(types: Array<string | Function.Parameter>, data: string): any[] {
        try {
            return super.decode(types, data)
        } catch (err) {
            if (err.reason) {
                throw new Error(err.reason)
            }
            throw err
        }
    }
}

const coder = new Coder()

function formatSignature(fragment: any) {
    try {
        return _formatSignature(fragment)
            .replace(/\(tuple\(/g, '((')
            .replace(/,tuple\(/g, ',(')
    } catch (err) {
        if (err.reason) {
            throw new Error(err.reason)
        }
        throw err
    }
}

    /**
     * encode single parameter
     * @param type type of the parameter
     * @param value value of the parameter
     * @returns encoded value in hex string
     */
    export function encodeParameter(type: string, value: any) {
        return coder.encode([type], [value])
    }

    /**
     * decode single parameter
     * @param type type of the parameter
     * @param data encoded parameter in hex string
     * @returns decoded value
     */
    export function decodeParameter(type: string, data: string) {
        return coder.decode([type], data)[0]
    }

    /**
     * encode a group of parameters
     * @param types type array
     * @param values value array
     * @returns encoded values in hex string
     */
    export function encodeParameters(types: Function.Parameter[], values: any[]) {
        return coder.encode(types, values)
    }

    /**
     * decode a group of parameters
     * @param types type array
     * @param data encoded values in hex string
     * @returns decoded object
     */
    export function decodeParameters(types: Function.Parameter[], data: string) {
        const result = coder.decode(types, data)
        const decoded: Decoded = {}
        types.forEach((t, i) => {
            decoded[i] = result[i]
            if (t.name) {
                decoded[t.name] = result[i]
            }
        })
        return decoded
    }

    /** for contract function */
    export class Function {
        /** canonical name */
        public readonly canonicalName: string

        /** the function signature, aka. 4 bytes prefix */
        public readonly signature: string

        /**
         * create a function object
         * @param definition abi definition of the function
         */
        constructor(public readonly definition: Function.Definition) {
            this.canonicalName = formatSignature(definition)
            this.signature = '0x' + keccak256(this.canonicalName).slice(0, 4).toString('hex')
        }

        /**
         * encode input parameters into call data
         * @param args arguments for the function
         */
        public encode(...args: any[]): string {
            return this.signature + encodeParameters(this.definition.inputs, args).slice(2)
        }

        /**
         * decode output data
         * @param outputData output data to decode
         */
        public decode(outputData: string) {
            return decodeParameters(this.definition.outputs, outputData)
        }
    }

    export namespace Function {
        export type StateMutability = 'pure' | 'view' | 'constant' | 'payable' | 'nonpayable'
        export interface Parameter {
            name: string
            type: string
            components?: any[] // Tuples ONLY
            internalType?: string
        }

        export interface Definition {
            type: 'function'
            name: string
            constant?: boolean
            payable?: boolean
            stateMutability: StateMutability
            inputs: Parameter[]
            outputs: Parameter[]
        }
    }

    export type Decoded = { [name: string]: any } & { [index: number]: any }

