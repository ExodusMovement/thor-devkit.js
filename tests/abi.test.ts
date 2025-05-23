import chai from 'chai'
import { abi } from '../src'

const { expect } = chai

// tslint:disable:quotemark
// tslint:disable:object-literal-key-quotes
// tslint:disable:max-line-length
// tslint:disable:trailing-comma

describe('abi', () => {

    // contract Foo {
    //     struct Candidate {
    //         address master;
    //         address endorsor;
    //         bytes32 identity;
    //         bool active;
    //     }
    //     function f1(uint a1, string a2) public returns(address r1, bytes r2);
    //     function nodes() external returns (AuthorityUtils.Candidate[] memory list);
    //     event E1(uint indexed a1, string a2);
    //     event E2(uint indexed a1, string a2) anonymous;
    //     event Added(AuthorityUtils.Candidate[] nodes)
    // }
    const f1 = new abi.Function({
        "constant": false,
        "inputs": [
            {
                "name": "a1",
                "type": "uint256"
            },
            {
                "name": "a2",
                "type": "string"
            }
        ],
        "name": "f1",
        "outputs": [
            {
                "name": "r1",
                "type": "address"
            },
            {
                "name": "r2",
                "type": "bytes"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    })

    const f2 = new abi.Function({
        "inputs": [],
        "name": "nodes",
        "payable": false,
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "address",
                        "name": "master",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "endorsor",
                        "type": "address"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "identity",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "bool",
                        "name": "active",
                        "type": "bool"
                    }
                ],
                "internalType": "struct AuthorityUtils.Candidate[]",
                "name": "list",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    })

    it('codec', () => {
        expect(abi.encodeParameter('uint256', '2345675643')).equal('0x000000000000000000000000000000000000000000000000000000008bd02b7b')
        expect(() => abi.encodeParameter('bytes32', '0xdf3234')).to.throw()

        expect(abi.encodeParameter('bytes32', '0xdf32340000000000000000000000000000000000000000000000000000000000')).equal('0xdf32340000000000000000000000000000000000000000000000000000000000')
        expect(abi.encodeParameter('bytes', '0xdf3234')).equal('0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000003df32340000000000000000000000000000000000000000000000000000000000')
        expect(abi.encodeParameter('uint256', '2345675643')).equal('0x000000000000000000000000000000000000000000000000000000008bd02b7b')
        expect(abi.encodeParameter('bytes32[]', ['0xdf32340000000000000000000000000000000000000000000000000000000000', '0xfdfd000000000000000000000000000000000000000000000000000000000000'])).equal('0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000002df32340000000000000000000000000000000000000000000000000000000000fdfd000000000000000000000000000000000000000000000000000000000000')

        expect(abi.decodeParameter('uint256', '0x0000000000000000000000000000000000000000000000000000000000000010')).equal("16")
        expect(abi.decodeParameter('string', '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000848656c6c6f212521000000000000000000000000000000000000000000000000'))
            .equal("Hello!%!")
        expect(abi.decodeParameter('string', '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000848656c6c6f212521000000000000000000000000000000000000000000000000'))
            .equal("Hello!%!")

    })

    it('codec errors', () => {
        // Exception on encoding
        expect(() => abi.encodeParameter('bytes32', '0xdf3234')).to.throw()
        // @ts-ignore
        expect(() => abi.encodeParameter('WRONG', 10)).to.throw()
        
        // Exception on decoding
        expect(() => abi.decodeParameter('uint256', 'WRONG_UINT')).to.throw(Error, "invalid hexidecimal string")
    })

    it('function', () => {
        expect(f1.signature).equal('0x27fcbb2f')
        expect(f1.encode(1, 'foo')).equal('0x27fcbb2f000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000003666f6f0000000000000000000000000000000000000000000000000000000000')
        expect(f1.decode('0x000000000000000000000000abc000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000003666f6f0000000000000000000000000000000000000000000000000000000000')).deep.equal({
            0: '0xabc0000000000000000000000000000000000001',
            1: '0x666f6f',
            r1: '0xabc0000000000000000000000000000000000001',
            r2: '0x666f6f'
        })

        // Wrong definition of function (wrong formatSignature)
        expect(() => {
            // @ts-ignore
            new abi.Function({
                "constant": false,
                // @ts-ignore
                "inputs": "WRONG_FORMAT",
                "name": "f1",
                "outputs": [
                    {
                        "name": "r1",
                        "type": "address"
                    },
                    {
                        "name": "r2",
                        "type": "bytes"
                    }
                ],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            })
        }).to.throw()
    })

    it('v2: Function', () => {
        const output = '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000060000000000000000000000006935455ef590eb8746f5230981d09d3552398018000000000000000000000000b5358b034647202d0cd3d1bf615e63e498e0268249984a53f9397370079bba8d95f5c15c743098fb318483e0cb6bbf46ec89ccfb00000000000000000000000000000000000000000000000000000000000000000000000000000000000000005ff66ee3a3ea2aba2857ea8276edb6190d9a1661000000000000000000000000d51666c6b4fed6070a78691f1f3c8e79ad02e3a076f090d383f49d8faab2eb151241528a552f0ae645f460360a7635b8883987a60000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c5a02c1eac7516a9275d86c1cb39a5262b8684a4000000000000000000000000e32499b4143830f2526c79d388ecee530b6357aac635894a50ce5c74c62d238dbe95bd6a0fa076029d913d76b0d0b111c538153f00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e8fd586e022f825a109848832d7e552132bc332000000000000000000000000224626926a7a12225a60e127cec119c939db4a5cdbf2712e19af00dc4d376728f7cb06cc215c8e7c53b94cb47cefb4a26ada2a6c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ea2e8c9d6dcad9e4be4f1c88a3befb8ea742832e0000000000000000000000001a011475baa1d368fa2d8328a1b7a8d848b62c94c68dc811199d40ff7ecd8c8d46454ad9ac5f5cde9bae32f927fec10d82dbdf7800000000000000000000000000000000000000000000000000000000000000000000000000000000000000004977d68df97bb313b23238520580d8d3a59939bf0000000000000000000000007ad1d568b3fe5bad3fc264aca70bc7bcd5e4a6ff83b137cf7e30864b8a4e56453eb1f094b4434685d86895de38ac2edcf5d3f5340000000000000000000000000000000000000000000000000000000000000000'
        const decoded = f2.decode(output)

        expect(decoded).to.haveOwnProperty('list')
        expect(decoded.list.length).to.equal(6)

        const data = [{
            master: '0x0e8fd586e022f825a109848832d7e552132bc332',
            endorsor: '0x224626926a7a12225a60e127cec119c939db4a5c',
            identity: '0xdbf2712e19af00dc4d376728f7cb06cc215c8e7c53b94cb47cefb4a26ada2a6c',
            active: false
        }, {
            master: '0x4977d68df97bb313b23238520580d8d3a59939bf',
            endorsor: '0x7ad1d568b3fe5bad3fc264aca70bc7bcd5e4a6ff',
            identity: '0x83b137cf7e30864b8a4e56453eb1f094b4434685d86895de38ac2edcf5d3f534',
            active: false
        }]

        const encoded = abi.encodeParameters(f2.definition.outputs, [data])
        const decodedV2 = abi.decodeParameters(f2.definition.outputs, encoded)

        expect(decodedV2).to.haveOwnProperty('list')
        expect(decodedV2.list.length).to.equal(data.length)

        decodedV2.list.forEach((v:any, i:number) => {
            expect(v.master).to.be.equal(data[i].master)
            expect(v.endorsor).to.be.equal(data[i].endorsor)
            expect(v.identity).to.be.equal(data[i].identity)
            expect(v.active).to.be.equal(data[i].active)
        })
    })
})
