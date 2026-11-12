# 3. A password hash never leaves the server (reviews)

**Failure:** `getReviews` selects `user.*` to get the username. The page shows only the name, and the response has everything.

## Check

No login needed:

```
curl -s http://localhost:3000/api/item_view/6
```

`password_hash` and `admin` for every reviewer. Also in the browser's network panel.

## Test (`attacks.test.js`)

```js
test('reviews include no password hash', async () => {
	await postReview(await register('amy'));
	const [{ password_hash }] = queryDb('SELECT password_hash FROM user WHERE username = ?', 'amy');

	const response = await newClient().get('/api/item_view/6');

	assert.ok(!response.text.includes(password_hash));
	assert.ok(!response.text.includes('password_hash'));
	assert.ok(response.text.includes('amy'));
});
```

## Fix (`db.js`)

Name the columns. Older reviews have no user, so they keep the name they were posted with.

```js
export function getReviews(itemId) {
	return db.prepare(`
		SELECT review.id, review.content, review.item_id, review.user_id, COALESCE(user.username, review.author) AS username
		FROM review LEFT JOIN user ON user.id = review.user_id
		WHERE item_id = ?
	`).all(itemId);
}
```

## Broken fix

In [`03b-broken-fix.md`](03b-broken-fix.md). Swap it in for the fix, and run the test. Which line catches it? Then put the fix back.
