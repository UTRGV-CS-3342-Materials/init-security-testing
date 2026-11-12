# 3b. Broken fix

For sheet 3: A password hash never leaves the server (reviews)

`db.js`: get the reviews alone, then look up each reviewer.

```js
export function getReviews(itemId) {
	return db.prepare('SELECT * FROM review WHERE item_id = ?').all(itemId)
		.map((review) => ({ ...review, user: db.prepare('SELECT * FROM user WHERE id = ?').get(review.user_id) }));
}
```

**Caught by:** searching the whole response text. A test that checks `reviews[0].password_hash` passes, because the hash is now one level down.
