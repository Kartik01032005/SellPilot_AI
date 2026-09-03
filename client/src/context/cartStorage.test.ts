import assert from 'node:assert/strict';
import { getCartStorageKey } from './cartStorage';

assert.equal(getCartStorageKey('user-a'), 'sellpilot_cart:user-a');
assert.equal(getCartStorageKey('user-b'), 'sellpilot_cart:user-b');
assert.notEqual(getCartStorageKey('user-a'), getCartStorageKey('user-b'));
assert.equal(getCartStorageKey(null), null);
assert.equal(getCartStorageKey(undefined), null);

console.log('Cart persistence isolation regression test passed.');
