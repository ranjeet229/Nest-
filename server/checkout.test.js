import test from 'node:test';
import assert from 'node:assert/strict';
import {totals} from './checkout.js';
test('checkout uses per-item quantities and charges delivery below threshold',()=>{assert.deepEqual(totals([{price:699,quantity:2}]),{subtotal:1398,shipping:99,total:1497})});
test('free delivery starts exactly at the threshold',()=>{assert.deepEqual(totals([{price:1999,quantity:1}]),{subtotal:1999,shipping:0,total:1999})});
test('mixed cart totals are calculated consistently',()=>{assert.deepEqual(totals([{price:3499,quantity:2},{price:1299,quantity:1}]),{subtotal:8297,shipping:0,total:8297})});
