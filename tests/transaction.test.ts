import chai from 'chai'
import { Transaction, Body } from '../src'
import { blake2b256 } from '../src/blake2b'

const { expect } = chai

// tslint:disable:quotemark
// tslint:disable:object-literal-key-quotes
// tslint:disable:max-line-length
// tslint:disable:trailing-comma

describe("transaction", () => {

    // Correct transaction body
    const correctTransactionBody: Body = {
        chainTag: 1,
        blockRef: '0x00000000aabbccdd',
        expiration: 32,
        clauses: [{
            to: '0x7567d83b7b8d80addcb281a71d54fc7b3364ffed',
            value: 10000,
            data: '0x000000606060'
        }, {
            to: '0x7567d83b7b8d80addcb281a71d54fc7b3364ffed',
            value: 20000,
            data: '0x000000606060'
        }],
        gasPriceCoef: 128,
        gas: 21000,
        dependsOn: null,
        nonce: 12345678,
    }

    // Correct unsigned transaction
    const unsigned = new Transaction(correctTransactionBody)
    const unsignedEncoded = Buffer.from('f8540184aabbccdd20f840df947567d83b7b8d80addcb281a71d54fc7b3364ffed82271086000000606060df947567d83b7b8d80addcb281a71d54fc7b3364ffed824e208600000060606081808252088083bc614ec0', 'hex')

    // Delegated transaction
    const delegated = new Transaction({
        ...correctTransactionBody,
        reserved: {
            features: 1
        }
    })

    // Incorrectly delegated transaction
    const incorrectlyDelegated = new Transaction({
        ...correctTransactionBody,
        // Invalid features field
        reserved: {
            features: 1,
            unused: [Buffer.alloc(0), Buffer.alloc(0)]
        }
    })

    it('unsigned', () => {
        const signingHash = blake2b256(unsigned.encode())
        expect(signingHash.toString('hex')).equal('2a1c25ce0d66f45276a5f308b99bf410e2fc7d5b6ea37a49f2ab9f1da9446478')
        expect(unsigned.signingHash().toString('hex')).equal('2a1c25ce0d66f45276a5f308b99bf410e2fc7d5b6ea37a49f2ab9f1da9446478')

        expect(unsigned.id).equal(null)
        expect(unsigned.intrinsicGas).equal(37432)
        expect(new Transaction({ ...correctTransactionBody, clauses: [] }).intrinsicGas).equal(21000)
        expect(new Transaction({
            ...correctTransactionBody,
            clauses: [{
                to: null,
                value: 0,
                data: '0x'
            }]
        }).intrinsicGas).equal(53000)

        expect(unsigned.signature).equal(undefined)

        expect(unsigned.encode().toString('hex')).equal(unsignedEncoded.toString('hex'))
    })

    it('invalid body', () => {
        expect(() => { new Transaction({ ...correctTransactionBody, chainTag: 256 }).encode() }).to.throw()
        expect(() => { new Transaction({ ...correctTransactionBody, chainTag: -1 }).encode() }).to.throw()
        expect(() => { new Transaction({ ...correctTransactionBody, chainTag: 1.1 }).encode() }).to.throw()

        expect(() => { new Transaction({ ...correctTransactionBody, blockRef: '0x' }).encode() }).to.throw()
        expect(() => { new Transaction({ ...correctTransactionBody, blockRef: '0x' + '0'.repeat(18) }).encode() }).to.throw()

        expect(() => { new Transaction({ ...correctTransactionBody, expiration: 2 ** 32 }).encode() }).to.throw()
        expect(() => { new Transaction({ ...correctTransactionBody, expiration: -1 }).encode() }).to.throw()
        expect(() => { new Transaction({ ...correctTransactionBody, expiration: 1.1 }).encode() }).to.throw()

        expect(() => { new Transaction({ ...correctTransactionBody, gasPriceCoef: 256 }).encode() }).to.throw()
        expect(() => { new Transaction({ ...correctTransactionBody, gasPriceCoef: -1 }).encode() }).to.throw()
        expect(() => { new Transaction({ ...correctTransactionBody, gasPriceCoef: 1.1 }).encode() }).to.throw()

        expect(() => { new Transaction({ ...correctTransactionBody, gas: '0x10000000000000000' }).encode() }).to.throw()
        expect(() => { new Transaction({ ...correctTransactionBody, nonce: '0x10000000000000000' }).encode() }).to.throw()
    })

    const signed = new Transaction(correctTransactionBody)
    const signedEncoded = Buffer.from('f8970184aabbccdd20f840df947567d83b7b8d80addcb281a71d54fc7b3364ffed82271086000000606060df947567d83b7b8d80addcb281a71d54fc7b3364ffed824e208600000060606081808252088083bc614ec0b841f76f3c91a834165872aa9464fc55b03a13f46ea8d3b858e528fcceaf371ad6884193c3f313ff8effbb57fe4d1adc13dceb933bedbf9dbb528d2936203d5511df00', 'hex')
    signed.signature = Buffer.from('f76f3c91a834165872aa9464fc55b03a13f46ea8d3b858e528fcceaf371ad6884193c3f313ff8effbb57fe4d1adc13dceb933bedbf9dbb528d2936203d5511df00', 'hex')

    it("signed", () => {
        expect(signed.signature!.toString('hex')).equal('f76f3c91a834165872aa9464fc55b03a13f46ea8d3b858e528fcceaf371ad6884193c3f313ff8effbb57fe4d1adc13dceb933bedbf9dbb528d2936203d5511df00')
        expect(signed.id).equal('0xda90eaea52980bc4bb8d40cb2ff84d78433b3b4a6e7d50b75736c5e3e77b71ec')
    })

    it("encode decode", () => {
        expect(signed.encode().toString('hex')).equal(signedEncoded.toString('hex'))
    })

    const incorrectlySigned = new Transaction(correctTransactionBody)
    incorrectlySigned.signature = Buffer.from([1, 2, 3])
    it('incorrectly signed', () => {
        expect(incorrectlySigned.id).equal(null)
    })
})
