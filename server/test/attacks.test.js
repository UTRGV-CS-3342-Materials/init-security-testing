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

// 1. You can edit your own reviews, and nobody else's
test("you can't edit someone else's review", async () => {
	const amy = await register('amy');
	const bob = await register('bob');
	const review = await postReview(amy);
	const path = `/api/reviews/${review.id}`;

	assert.equal((await bob.put(path, { content: 'Hacked.' })).status, 404);
	assert.equal(row('review', review.id).content, 'Original.');

	assert.equal((await amy.put(path, { content: 'Edited.' })).status, 200);
	assert.equal(row('review', review.id).content, 'Edited.');
});

// 2. You can delete your own reviews, and admins can delete anyone's
test("you can't delete someone else's review, but an admin can", async () => {
	const amy = await register('amy');
	const bob = await register('bob');
	const review = await postReview(amy);
	const path = `/api/reviews/${review.id}`;

	assert.equal((await bob.delete(path)).status, 404);
	assert.ok(row('review', review.id));

	const admin = await logInAsAdmin();
	assert.equal((await admin.delete(path)).status, 204);
	assert.equal(row('review', review.id), undefined);
});

// 3. A password hash never leaves the server (reviews)
test('reviews include no password hash', async () => {
	await postReview(await register('amy'));
	const [{ password_hash }] = queryDb('SELECT password_hash FROM user WHERE username = ?', 'amy');

	const response = await newClient().get('/api/item_view/6');

	assert.ok(!response.text.includes(password_hash));
	assert.ok(!response.text.includes('password_hash'));
	assert.ok(response.text.includes('amy'));
});
