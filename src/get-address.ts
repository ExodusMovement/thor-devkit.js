'use strict'

/* tslint:disable */

// Patched getAddress, see https://github.com/vechain/ethers.js/commit/4313595f78c75a60639ad55b86634dd135e217a1

import * as errors from '@exodus/ethers/errors';

export function getAddress(address, checksum = true): string {
    var result = null;

    if (checksum) throw new Error('Unexpected')

    if (typeof(address) !== 'string') {
        errors.throwError('invalid address', errors.INVALID_ARGUMENT, { arg: 'address', value: address });
    }

    if (address.match(/^(0x)?[0-9a-fA-F]{40}$/)) {

        // Missing the 0x prefix
        if (address.substring(0, 2) !== '0x') { address = '0x' + address; }

        result = address;

        // It is a checksummed address with a bad checksum
        if (address.match(/([A-F].*[a-f])|([a-f].*[A-F])/) && result !== address) {
            errors.throwError('bad address checksum', errors.INVALID_ARGUMENT, { arg: 'address', value: address });
        }
    } else if (address.match(/^XE[0-9]{2}[0-9A-Za-z]{30,31}$/)) {
        errors.throwError('ICAP addresses not supported', errors.INVALID_ARGUMENT, { arg: 'address', value: address });
    } else {
        errors.throwError('invalid address', errors.INVALID_ARGUMENT, { arg: 'address', value: address });
    }

    return result;
}
