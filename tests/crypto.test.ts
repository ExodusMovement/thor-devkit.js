import chai from 'chai'
import { fromPublicKey } from '../src/address'
import { blake2b256 } from '../src/blake2b'
import { keccak256 } from '@exodus/crypto/keccak'
import * as secp256k1 from '../src/secp256k1'

const { expect } = chai

// tslint:disable:quotemark
// tslint:disable:object-literal-key-quotes
// tslint:disable:max-line-length
// tslint:disable:trailing-comma

describe('hash', () => {
    it('blake2b256', () => {
        expect(blake2b256(Buffer.alloc(0)).toString('hex')).equal('0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8')
        expect(blake2b256('hello world').toString('hex')).equal('256c83b297114d201b30179f3f0ef0cace9783622da5974326b436178aeef610')
        expect(blake2b256('hello', ' world').toString('hex')).equal('256c83b297114d201b30179f3f0ef0cace9783622da5974326b436178aeef610')
    })

    it('keccak', () => {
        expect(keccak256(Buffer.alloc(0)).toString('hex')).equal('c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470')
        expect(keccak256('hello world').toString('hex')).equal('47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad')
    })
})

describe('secp256k1', () => {
    const pubKey = Buffer.from('04b90e9bb2617387eba4502c730de65a33878ef384a46f1096d86f2da19043304afa67d0ad09cf2bea0c6f2d1767a9e62a7a7ecc41facf18f2fa505d92243a658f', 'hex')
    const addr = '0xd989829d88b0ed1b06edf5c50174ecfa64f14a64'
    const msgHash = keccak256('hello world')
    const sig = Buffer.from('f8fe82c74f9e1f5bf443f8a7f8eb968140f554968fdcab0a6ffe904e451c8b9244be44bccb1feb34dd20d9d8943f8c131227e55861736907b02d32c06b934d7200', 'hex')
    
    const invalidMessageHash = Buffer.from('INVALID_MESSAGE_HASH', 'hex')
    const invalidSignature = Buffer.from('INVALID_SIGNATURE', 'hex')
    const validSignatureWithWrongRecovery = Buffer.from('f8fe82c74f9e1f5bf443f8a7f8eb968140f554968fdcab0a6ffe904e451c8b9244be44bccb1feb34dd20d9d8943f8c131227e55861736907b02d32c06b934d72FF', 'hex')

    it('derive', () => {
        expect(fromPublicKey(pubKey)).deep.equal(addr)
    })
    it('sign/recover', () => {
        expect(secp256k1.recover(msgHash, sig)).deep.equal(pubKey)

        // Recover with invalid message hash AND invalid signature AND invalid signature recovery
        expect(() => secp256k1.recover(invalidMessageHash, sig)).to.throw(Error, 'invalid message hash')
        expect(() => secp256k1.recover(msgHash, invalidSignature)).to.throw(Error, 'invalid signature')
        expect(() => secp256k1.recover(msgHash, validSignatureWithWrongRecovery)).to.throw(Error, 'invalid signature recovery')
    })
})
