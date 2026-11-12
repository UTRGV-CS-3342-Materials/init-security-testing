import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { buy, logInAsAdmin, newClient, postReview, purchasesOf, queryDb, register, row, startServer } from '../test-helpers.js';

// Every test gets its own server and a fresh copy of the database:
// 5 of everything in stock, and only the admin has an account.
let stopServer;
beforeEach(async () => {
	stopServer = await startServer();
});
afterEach(() => stopServer());

test('buying takes it out of stock', async () => {
	const amy = await register('amy');

	const response = await buy(amy, 7, 2);

	assert.equal(response.status, 201);
	assert.equal(row('item', 7).stock, 3);
	assert.equal(purchasesOf('amy').length, 1);
});
