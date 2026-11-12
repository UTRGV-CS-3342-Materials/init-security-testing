import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { newClient, queryDb, startServer } from '../test-helpers.js';

let stopServer;
before(async () => {
	stopServer = await startServer();
});
after(() => stopServer());

async function register(username) {
	const client = newClient();
	await client.post('/api/register', { username, password: 'correct-horse' });
	return client;
}

async function postReview(client, content = 'Original.') {
	const { json } = await client.post('/api/item_view/6/reviews', { content });
	return json.review;
}

test('you can edit your review', async () => {
	const owner = await register('editor');
	const review = await postReview(owner);

	const response = await owner.put(`/api/reviews/${review.id}`, { author: review.author, content: 'Edited.' });

	assert.equal(response.status, 200);
	assert.equal(response.json.review.content, 'Edited.');
});

test('you can delete your review', async () => {
	const owner = await register('deleter');
	const review = await postReview(owner);

	const response = await owner.delete(`/api/reviews/${review.id}`);

	assert.equal(response.status, 204);
	assert.equal(queryDb('SELECT id FROM review WHERE id = ?', review.id).length, 0);
});

test('editing or deleting takes a login', async () => {
	const review = await postReview(await register('anon-test'));
	const path = `/api/reviews/${review.id}`;

	assert.equal((await newClient().put(path, { content: 'Edited.' })).status, 401);
	assert.equal((await newClient().delete(path)).status, 401);
});

test('reviews show the username', async () => {
	const owner = await register('shown-name');
	const review = await postReview(owner);

	const { json } = await newClient().get('/api/item_view/6');

	assert.equal(json.reviews.find((r) => r.id === review.id).username, 'shown-name');
});
