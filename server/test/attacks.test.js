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

// Every attack has a control: the same request, from someone allowed to make it, succeeds.
// Without one, a test can pass because the request was broken, not because the rule held.
// And every attack checks what actually happened (the row, or the whole response), not just the status.
