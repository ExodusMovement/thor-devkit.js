'use strict'

/* tslint:disable */

// Patched getAddress, see https://github.com/vechain/ethers.js/commit/4313595f78c75a60639ad55b86634dd135e217a1

import * as errors from '@exodus/ethers/errors';

import BN from 'bn.js';

// Shims for environments that are missing some required constants and functions
var MAX_SAFE_INTEGER: number = 0x1fffffffffffff;

function log10(x: number): number {
    if (Math.log10) { return Math.log10(x); }
    return Math.log(x) / Math.LN10;
}


// See: https://en.wikipedia.org/wiki/International_Bank_Account_Number

// Create lookup table
var ibanLookup: { [character: string]: string } = {};
for (var i = 0; i < 10; i++) { ibanLookup[String(i)] = String(i); }
for (var i = 0; i < 26; i++) { ibanLookup[String.fromCharCode(65 + i)] = String(10 + i); }

// How many decimal digits can we process? (for 64-bit float, this is 15)
var safeDigits = Math.floor(log10(MAX_SAFE_INTEGER));

function ibanChecksum(address: string): string {
    address = address.toUpperCase();
    address = address.substring(4) + address.substring(0, 2) + '00';

    var expanded = '';
    address.split('').forEach(function(c) {
        expanded += ibanLookup[c];
    });

    // Javascript can handle integers safely up to 15 (decimal) digits
    while (expanded.length >= safeDigits){
        var block = expanded.substring(0, safeDigits);
        expanded = parseInt(block, 10) % 97 + expanded.substring(block.length);
    }

    var checksum = String(98 - (parseInt(expanded, 10) % 97));
    while (checksum.length < 2) { checksum = '0' + checksum; }

    return checksum;
};

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

    // Maybe ICAP? (we only support direct mode)
    } else if (address.match(/^XE[0-9]{2}[0-9A-Za-z]{30,31}$/)) {

        // It is an ICAP address with a bad checksum
        if (address.substring(2, 4) !== ibanChecksum(address)) {
            errors.throwError('bad icap checksum', errors.INVALID_ARGUMENT, { arg: 'address', value: address });
        }

        result = (new BN(address.substring(4), 36)).toString(16);
        while (result.length < 40) { result = '0' + result; }
        result = '0x' + result;

    } else {
        errors.throwError('invalid address', errors.INVALID_ARGUMENT, { arg: 'address', value: address });
    }

    return result;
}