# 8b. Broken fix

For sheet 8: Admins can delete reviews, but not edit them

`db.js`: give edit the same admin branch as delete, and have the route pass `req.user` instead of `req.user.id`.

```js
export function updateReview(reviewId, user, fields) {
	const set = Object.keys(fields).map((c) => `${c} = ?`).join(', ');
	const values = Object.values(fields);
	const { changes } = user.admin
		? db.prepare(`UPDATE review SET ${set} WHERE id = ?`).run(...values, reviewId)
		: db.prepare(`UPDATE review SET ${set} WHERE id = ? AND user_id = ?`).run(...values, reviewId, user.id);
	if (changes === 0) return undefined;
	return db.prepare('SELECT * FROM review WHERE id = ?').get(reviewId);
}
```
