import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { buy, logInAsAdmin, newClient, register, row, startServer } from '../test-helpers.js';

let stopServer;
beforeEach(async () => {
	stopServer = await startServer();
});
afterEach(() => stopServer());

test('an item shows how many are in stock', async () => {
	const { json } = await newClient().get('/api/item_view/7');

	assert.equal(json.item.stock, 5);
});

test('buying takes a login', async () => {
	const response = await newClient().post('/api/item_view/7/buy', { quantity: 1, cost: 56.78 });

	assert.equal(response.status, 401);
	assert.equal(row('item', 7).stock, 5);
});

test('your orders list what you bought', async () => {
	const amy = await register('amy');
	const { json } = await buy(amy, 7, 2);

	const list = await amy.get('/api/purchases');
	const one = await amy.get(`/api/purchases/${json.purchase.id}`);

	assert.equal(list.json.purchases.length, 1);
	assert.equal(list.json.purchases[0].name, 'Big Chair');
	assert.equal(one.json.purchase.quantity, 2);
	assert.equal(one.json.purchase.username, 'amy');
});

test('an admin can edit an item', async () => {
	const admin = await logInAsAdmin();
	const { json } = await admin.get('/api/item_view/7');

	const response = await admin.put('/api/items/7', { ...json.item, cost: 60, stock: 9 });

	assert.equal(response.status, 200);
	assert.equal(row('item', 7).cost, 60);
	assert.equal(row('item', 7).stock, 9);
});
